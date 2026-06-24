import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const VALID_CHAMBERS = new Set(['senate', 'house'])
const VALID_PARTIES = new Set(['D', 'R', 'I', 'unknown'])
const VALID_TRADE_TYPES = new Set(['purchase', 'sale_full', 'sale_partial', 'sale', 'exchange', 'unknown'])

const EXPORT_CAP = 10_000

function escapeCsv(value: string | null | undefined): string {
  if (value == null) return ''
  const str = String(value)
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return '"' + str.replace(/"/g, '""') + '"'
  }
  return str
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl

  const rawTicker = searchParams.get('ticker')
  const ticker = rawTicker && rawTicker.length <= 10 ? rawTicker.replace(/[^A-Za-z0-9.^]/g, '') : null

  const rawChamber = searchParams.get('chamber')
  const chamber = rawChamber && VALID_CHAMBERS.has(rawChamber) ? rawChamber : null

  const rawParty = searchParams.get('party')
  const party = rawParty && VALID_PARTIES.has(rawParty) ? rawParty : null

  const rawTradeType = searchParams.get('type')
  const tradeType = rawTradeType && VALID_TRADE_TYPES.has(rawTradeType) ? rawTradeType : null

  const rawMemberId = searchParams.get('memberId')
  const memberId = rawMemberId && /^[a-z0-9_-]{1,36}$/i.test(rawMemberId) ? rawMemberId : null

  const rawFrom = searchParams.get('from')
  const fromDate = rawFrom ? new Date(rawFrom) : null
  const from = fromDate && !isNaN(fromDate.getTime()) ? fromDate : null

  const rawTo = searchParams.get('to')
  const toDate = rawTo ? new Date(rawTo) : null
  const to = toDate && !isNaN(toDate.getTime()) ? toDate : null

  const rawFiledLate = searchParams.get('filedLate')
  const filedLate = rawFiledLate === 'true' ? true : null

  const rawSearch = searchParams.get('search')
  const search =
    rawSearch && rawSearch.length <= 100
      ? rawSearch.replace(/[^a-zA-Z0-9 -]/g, '').trim() || null
      : null

  const dateFilter =
    from || to
      ? { transactionDate: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } }
      : {}

  const where = {
    ...(ticker && { ticker: { equals: ticker.toUpperCase() } }),
    ...(tradeType && { tradeType }),
    ...(memberId && { memberId }),
    ...(filedLate !== null && { filedLate }),
    ...dateFilter,
    ...(chamber || party || search
      ? {
          member: {
            ...(chamber && { chamber }),
            ...(party && { party }),
            ...(search && { name: { contains: search, mode: 'insensitive' as const } }),
          },
        }
      : {}),
  }

  const trades = await prisma.trade.findMany({
    where,
    include: {
      member: {
        select: {
          name: true,
          party: true,
          chamber: true,
          state: true,
        },
      },
    },
    orderBy: { transactionDate: 'desc' },
    take: EXPORT_CAP,
  })

  const header = 'Date,Member,Party,Chamber,State,Ticker,Asset,Type,Amount,FiledLate,DocURL'
  const rows = trades.map((t) =>
    [
      escapeCsv(t.transactionDate ? t.transactionDate.toISOString().slice(0, 10) : null),
      escapeCsv(t.member.name),
      escapeCsv(t.member.party),
      escapeCsv(t.member.chamber),
      escapeCsv(t.member.state),
      escapeCsv(t.ticker),
      escapeCsv(t.assetName),
      escapeCsv(t.tradeType),
      escapeCsv(t.amount),
      escapeCsv(String(t.filedLate)),
      escapeCsv(t.docUrl),
    ].join(',')
  )

  const csv = [header, ...rows].join('\n')

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="congress-trades.csv"',
    },
  })
}
