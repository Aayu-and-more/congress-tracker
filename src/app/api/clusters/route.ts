import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const ETF_BLOCKLIST = ['SPY', 'QQQ', 'DIA', 'IVV', 'VOO', 'SPYD', 'SPYB', 'VTI', 'GLD', 'SLV', 'TLT', 'XLF', 'XLE', 'XLK', 'XLV', 'SCHD']

export async function GET() {
  const since = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)

  const trades = await prisma.trade.findMany({
    where: {
      ticker: { not: null },
      transactionDate: { gte: since },
    },
    select: {
      ticker: true,
      tradeType: true,
      transactionDate: true,
      memberId: true,
      member: {
        select: { name: true, party: true, slug: true },
      },
    },
    orderBy: { transactionDate: 'asc' },
  })

  const filtered = trades.filter(t => t.ticker && !ETF_BLOCKLIST.includes(t.ticker))

  const byTicker = new Map<string, typeof filtered>()
  for (const t of filtered) {
    const key = t.ticker!
    if (!byTicker.has(key)) byTicker.set(key, [])
    byTicker.get(key)!.push(t)
  }

  interface Cluster {
    ticker: string
    type: 'buy' | 'sell' | 'mixed'
    memberCount: number
    tradeCount: number
    windowStart: Date
    windowEnd: Date
    members: { name: string; party: string | null; slug: string }[]
    daysAgo: number
  }

  const clusters: Cluster[] = []
  const now = Date.now()
  const windowMs = 14 * 24 * 60 * 60 * 1000

  for (const [ticker, tickerTrades] of byTicker) {
    let bestWindow: typeof filtered | null = null

    for (let i = 0; i < tickerTrades.length; i++) {
      const anchor = tickerTrades[i]
      if (!anchor.transactionDate) continue
      const anchorTime = anchor.transactionDate.getTime()
      const windowEnd = anchorTime + windowMs

      const inWindow = tickerTrades.filter(t => {
        if (!t.transactionDate) return false
        const tt = t.transactionDate.getTime()
        return tt >= anchorTime && tt <= windowEnd
      })

      const uniqueMembers = new Set(inWindow.map(t => t.memberId))
      if (uniqueMembers.size < 3) continue

      if (!bestWindow || uniqueMembers.size > new Set(bestWindow.map(t => t.memberId)).size) {
        bestWindow = inWindow
      }
    }

    if (!bestWindow) continue

    const dates = bestWindow
      .map(t => t.transactionDate?.getTime())
      .filter((d): d is number => d !== undefined && d !== null)

    const windowStart = new Date(Math.min(...dates))
    const windowEnd = new Date(Math.max(...dates))

    let buys = 0
    let sells = 0
    for (const t of bestWindow) {
      if (t.tradeType === 'purchase') buys++
      else sells++
    }
    const type: 'buy' | 'sell' | 'mixed' = buys > sells ? 'buy' : sells > buys ? 'sell' : 'mixed'

    const seenMembers = new Set<string>()
    const members: { name: string; party: string | null; slug: string }[] = []
    for (const t of bestWindow) {
      if (!seenMembers.has(t.memberId)) {
        seenMembers.add(t.memberId)
        members.push({ name: t.member.name, party: t.member.party, slug: t.member.slug })
      }
    }

    const daysAgo = Math.floor((now - windowEnd.getTime()) / (24 * 60 * 60 * 1000))

    clusters.push({
      ticker,
      type,
      memberCount: seenMembers.size,
      tradeCount: bestWindow.length,
      windowStart,
      windowEnd,
      members: members.slice(0, 5),
      daysAgo,
    })
  }

  clusters.sort((a, b) => {
    const timeDiff = b.windowEnd.getTime() - a.windowEnd.getTime()
    if (timeDiff !== 0) return timeDiff
    return b.memberCount - a.memberCount
  })

  return NextResponse.json({ clusters: clusters.slice(0, 8) })
}
