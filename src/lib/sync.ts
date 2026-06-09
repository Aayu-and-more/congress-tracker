import { prisma } from './prisma'
import { sendAlerts } from './alerts'

// Kadoa's congress-trading-monitor has 57k+ trades updated daily
// senatestockwatcher.com + housestockwatcher.com are defunct as of 2026
const TRADES_URL =
  'https://raw.githubusercontent.com/kadoa-org/congress-trading-monitor/main/public/data/trades.json'

const FETCH_TIMEOUT_MS = 60_000 // 4.3MB file, give it a minute
const MAX_RESPONSE_BYTES = 50 * 1024 * 1024 // 50 MB

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function normalizeParty(party?: string | null): string {
  if (!party) return 'unknown'
  const p = party.toUpperCase().trim()
  if (p === 'D') return 'D'
  if (p === 'R') return 'R'
  if (p === 'I') return 'I'
  return 'unknown'
}

function normalizeTradeType(type?: string | null): string {
  if (!type) return 'unknown'
  const t = type.toLowerCase()
  if (t.includes('purchase')) return 'purchase'
  if (t.includes('full')) return 'sale_full'
  if (t.includes('partial')) return 'sale_partial'
  if (t.includes('sale') || t.includes('sell')) return 'sale'
  if (t.includes('exchange')) return 'exchange'
  return t
}

function parseDate(dateStr?: string | null): Date | null {
  if (!dateStr || dateStr === 'N/A' || dateStr === '--') return null
  const d = new Date(dateStr)
  return isNaN(d.getTime()) ? null : d
}

async function safeFetch(url: string): Promise<unknown> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
  try {
    const res = await fetch(url, { signal: controller.signal, cache: 'no-store' })
    if (!res.ok) throw new Error(`HTTP ${res.status} from ${url}`)
    const contentLength = res.headers.get('content-length')
    if (contentLength && parseInt(contentLength, 10) > MAX_RESPONSE_BYTES) {
      throw new Error(`Response too large: ${contentLength} bytes`)
    }
    const buffer = await res.arrayBuffer()
    if (buffer.byteLength > MAX_RESPONSE_BYTES) {
      throw new Error(`Response too large: ${buffer.byteLength} bytes`)
    }
    return JSON.parse(new TextDecoder().decode(buffer))
  } finally {
    clearTimeout(timer)
  }
}

interface KadoaTrade {
  id: string
  transaction_date?: string | null
  filing_date?: string | null
  ticker?: string | null
  asset_name?: string | null
  transaction_type?: string | null
  amount_range_label?: string | null
  is_late?: number | boolean | null
  filer_id?: string | null
  filer_name?: string | null
  chamber?: string | null
  party?: string | null
  state?: string | null
}

export async function syncAll() {
  const syncStart = new Date()
  const results = { total: 0, errors: [] as string[] }

  try {
    const raw = await safeFetch(TRADES_URL)
    const trades = Array.isArray(raw) ? (raw as KadoaTrade[]) : []

    if (trades.length === 0) {
      throw new Error('No trades returned from data source')
    }

    // Batch upsert members first (deduplicated by filer_id)
    const memberMap = new Map<string, string>() // filer_id → db member id

    const uniqueFilers = new Map<string, KadoaTrade>()
    for (const t of trades) {
      if (t.filer_id && !uniqueFilers.has(t.filer_id)) {
        uniqueFilers.set(t.filer_id, t)
      }
    }

    for (const [filerId, t] of uniqueFilers) {
      const name = t.filer_name?.trim() || filerId
      const slug = filerId // filer_id is already a clean slug like "house_lloyd_doggett"
      const member = await prisma.member.upsert({
        where: { slug },
        create: {
          name,
          party: normalizeParty(t.party),
          chamber: t.chamber === 'senate' ? 'senate' : 'house',
          state: t.state ?? null,
          slug,
        },
        update: {
          name,
          party: normalizeParty(t.party),
          state: t.state ?? null,
        },
      })
      memberMap.set(filerId, member.id)
    }

    // Upsert trades
    let count = 0
    for (const t of trades) {
      try {
        if (!t.filer_id || !t.id) continue
        const memberId = memberMap.get(t.filer_id)
        if (!memberId) continue

        const ticker =
          t.ticker && t.ticker !== '--' && t.ticker !== 'N/A'
            ? t.ticker.trim().toUpperCase()
            : null

        const txDate = parseDate(t.transaction_date)
        const discDate = parseDate(t.filing_date)

        await prisma.trade.upsert({
          where: { externalId: t.id },
          create: {
            memberId,
            ticker,
            assetName: t.asset_name ?? ticker ?? 'Unknown Asset',
            tradeType: normalizeTradeType(t.transaction_type),
            amount: t.amount_range_label ?? 'Unknown',
            transactionDate: txDate,
            disclosureDate: discDate,
            filedLate: t.is_late === 1 || t.is_late === true,
            source: t.chamber === 'senate' ? 'senate' : 'house',
            externalId: t.id,
          },
          update: {},
        })
        count++
      } catch {
        // skip bad records
      }
    }

    results.total = count
    await prisma.syncLog.create({
      data: { source: 'kadoa-github', status: 'success', count },
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    results.errors.push(msg)
    await prisma.syncLog.create({
      data: { source: 'kadoa-github', status: 'error', error: msg },
    })
  }

  // Fire alerts for genuinely new trades
  try {
    const newTrades = await prisma.trade.findMany({
      where: { createdAt: { gte: syncStart } },
      take: 200,
      include: { member: { select: { name: true, party: true, chamber: true } } },
    })
    if (newTrades.length > 0) {
      await sendAlerts(newTrades)
    }
  } catch {
    // Alert errors never fail the sync
  }

  return results
}
