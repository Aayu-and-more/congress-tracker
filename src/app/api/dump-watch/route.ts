import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const ETF_BLOCKLIST = ['SPY', 'QQQ', 'DIA', 'IVV', 'VOO', 'SPYD', 'SPYB', 'VTI', 'GLD', 'SLV', 'TLT', 'XLF', 'XLE', 'XLK', 'XLV', 'SCHD']

function amountMidpoint(amount: string): number {
  const clean = amount.replace(/[$,]/g, '')
  if (clean.toLowerCase().includes('over')) return 7500000
  const match = clean.match(/(\d[\d,]*)\s*[-–]\s*(\d[\d,]*)/)
  if (match) {
    const lo = parseInt(match[1].replace(/,/g, ''))
    const hi = parseInt(match[2].replace(/,/g, ''))
    return (lo + hi) / 2
  }
  const single = parseInt(clean.replace(/[^0-9]/g, ''))
  return isNaN(single) ? 0 : single
}

export async function GET() {
  const since30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  const since14 = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)

  const sells = await prisma.trade.findMany({
    where: {
      ticker: { not: null },
      tradeType: { in: ['sale_full', 'sale_partial', 'sale'] },
      transactionDate: { gte: since30 },
    },
    select: {
      memberId: true,
      ticker: true,
      amount: true,
      transactionDate: true,
      member: { select: { name: true, party: true, slug: true, chamber: true } },
    },
  })

  const filtered = sells.filter(t => !ETF_BLOCKLIST.includes(t.ticker!))

  const tickerMap = new Map<string, {
    memberIds: Set<string>
    parties: Set<string>
    recentCount: number
    totalSellVolume: number
    sellCount: number
    sellers: { memberId: string; name: string; party: string | null; slug: string; chamber: string }[]
  }>()

  for (const trade of filtered) {
    const ticker = trade.ticker!
    if (!tickerMap.has(ticker)) {
      tickerMap.set(ticker, {
        memberIds: new Set(),
        parties: new Set(),
        recentCount: 0,
        totalSellVolume: 0,
        sellCount: 0,
        sellers: [],
      })
    }
    const entry = tickerMap.get(ticker)!
    entry.memberIds.add(trade.memberId)
    if (trade.member.party === 'D' || trade.member.party === 'R') {
      entry.parties.add(trade.member.party)
    }
    if (trade.transactionDate && trade.transactionDate >= since14) {
      entry.recentCount++
    }
    entry.totalSellVolume += amountMidpoint(trade.amount)
    entry.sellCount++

    const alreadyAdded = entry.sellers.some(s => s.memberId === trade.memberId)
    if (!alreadyAdded && entry.sellers.length < 3) {
      entry.sellers.push({
        memberId: trade.memberId,
        name: trade.member.name,
        party: trade.member.party,
        slug: trade.member.slug,
        chamber: trade.member.chamber,
      })
    }
  }

  const qualifiedTickers = Array.from(tickerMap.entries())
    .filter(([, entry]) => entry.memberIds.size >= 2)
    .map(([ticker]) => ticker)

  const buys = await prisma.trade.groupBy({
    by: ['ticker'],
    where: {
      ticker: { in: qualifiedTickers },
      tradeType: 'purchase',
      transactionDate: { gte: since30 },
    },
    _count: { ticker: true },
  })

  const buyCountMap = new Map<string, number>()
  for (const b of buys) {
    if (b.ticker) buyCountMap.set(b.ticker, b._count.ticker)
  }

  const results = qualifiedTickers.map(ticker => {
    const entry = tickerMap.get(ticker)!
    const uniqueSellers = entry.memberIds.size
    const bipartisan = entry.parties.has('D') && entry.parties.has('R')
    const recentCount = entry.recentCount
    const avgAmount = entry.sellCount > 0 ? entry.totalSellVolume / entry.sellCount : 0
    const buyCount = buyCountMap.get(ticker) ?? 0
    const exiting = entry.sellCount > buyCount

    const raw_score =
      uniqueSellers * 15 +
      (bipartisan ? 20 : 0) +
      recentCount * 5 +
      Math.min(avgAmount / 5000, 30)
    const score = Math.min(Math.round(raw_score), 100)

    return {
      ticker,
      score,
      uniqueSellers,
      bipartisan,
      recentCount,
      avgAmount: Math.round(avgAmount),
      exiting,
      topSellers: entry.sellers,
    }
  })

  results.sort((a, b) => b.score - a.score)
  const top20 = results.slice(0, 20)

  return NextResponse.json({ tickers: top20, generatedAt: new Date().toISOString() })
}
