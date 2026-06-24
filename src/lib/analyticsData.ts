import { prisma } from './prisma'

const PURCHASE_TYPES = ['purchase']
const SALE_TYPES = ['sale_full', 'sale_partial', 'sale']

function isoWeek(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayOfWeek = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayOfWeek)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
}

function isoWeekKey(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayOfWeek = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayOfWeek)
  const year = d.getUTCFullYear()
  const week = isoWeek(date)
  return `${year}-${String(week).padStart(2, '0')}`
}

export interface AnalyticsData {
  bipartisan: { ticker: string; dBuys: number; rBuys: number; total: number }[]
  weeklyTrend: { week: string; purchases: number; sales: number }[]
  partyBreakdown: { D: { buys: number; sells: number }; R: { buys: number; sells: number }; other: { buys: number; sells: number } }
  lateFilingStats: { total: number; topLateMembers: { name: string; slug: string; count: number }[] }
}

export async function getAnalyticsData(days = 90): Promise<AnalyticsData> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

  const allTrades = await prisma.trade.findMany({
    where: { transactionDate: { gte: since } },
    select: {
      ticker: true,
      tradeType: true,
      transactionDate: true,
      filedLate: true,
      memberId: true,
      member: { select: { party: true, name: true, slug: true } },
    },
  })

  // bipartisan
  const tickerPartyBuys = new Map<string, { D: number; R: number }>()
  for (const t of allTrades) {
    if (!t.ticker || !PURCHASE_TYPES.includes(t.tradeType)) continue
    const party = t.member.party
    if (party !== 'D' && party !== 'R') continue
    const entry = tickerPartyBuys.get(t.ticker) ?? { D: 0, R: 0 }
    if (party === 'D') entry.D++
    else entry.R++
    tickerPartyBuys.set(t.ticker, entry)
  }

  const bipartisan = Array.from(tickerPartyBuys.entries())
    .filter(([, counts]) => counts.D >= 2 && counts.R >= 2)
    .map(([ticker, counts]) => ({ ticker, dBuys: counts.D, rBuys: counts.R, total: counts.D + counts.R }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 20)

  // weeklyTrend (last 12 weeks)
  const now = new Date()
  const weekKeys: string[] = []
  for (let i = 11; i >= 0; i--) {
    weekKeys.push(isoWeekKey(new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000)))
  }

  const weekMap = new Map<string, { purchases: number; sales: number }>()
  for (const k of weekKeys) weekMap.set(k, { purchases: 0, sales: 0 })

  for (const t of allTrades) {
    if (!t.transactionDate) continue
    const key = isoWeekKey(t.transactionDate)
    if (!weekMap.has(key)) continue
    const entry = weekMap.get(key)!
    if (PURCHASE_TYPES.includes(t.tradeType)) entry.purchases++
    else if (SALE_TYPES.includes(t.tradeType)) entry.sales++
  }

  const weeklyTrend = weekKeys.map((week) => ({ week, ...weekMap.get(week)! }))

  // partyBreakdown
  const partyBreakdown = { D: { buys: 0, sells: 0 }, R: { buys: 0, sells: 0 }, other: { buys: 0, sells: 0 } }
  for (const t of allTrades) {
    const party = t.member.party
    const bucket = party === 'D' ? partyBreakdown.D : party === 'R' ? partyBreakdown.R : partyBreakdown.other
    if (PURCHASE_TYPES.includes(t.tradeType)) bucket.buys++
    else if (SALE_TYPES.includes(t.tradeType)) bucket.sells++
  }

  // lateFilingStats
  const lateTrades = allTrades.filter((t) => t.filedLate)
  const lateMemberCounts = new Map<string, { name: string; slug: string; count: number }>()
  for (const t of lateTrades) {
    const existing = lateMemberCounts.get(t.memberId) ?? { name: t.member.name, slug: t.member.slug, count: 0 }
    existing.count++
    lateMemberCounts.set(t.memberId, existing)
  }

  const topLateMembers = Array.from(lateMemberCounts.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
    .map(({ name, slug, count }) => ({ name, slug, count }))

  return { bipartisan, weeklyTrend, partyBreakdown, lateFilingStats: { total: lateTrades.length, topLateMembers } }
}
