import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const days = Math.min(parseInt(searchParams.get('days') ?? '90'), 365)
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

  // Top bought tickers in window
  const bought = await prisma.trade.groupBy({
    by: ['ticker'],
    where: {
      ticker: { not: null },
      tradeType: 'purchase',
      transactionDate: { gte: since },
    },
    _count: { ticker: true },
    orderBy: { _count: { ticker: 'desc' } },
    take: 15,
  })

  // Top sold tickers in window
  const sold = await prisma.trade.groupBy({
    by: ['ticker'],
    where: {
      ticker: { not: null },
      tradeType: { in: ['sale_full', 'sale_partial', 'sale'] },
      transactionDate: { gte: since },
    },
    _count: { ticker: true },
    orderBy: { _count: { ticker: 'desc' } },
    take: 15,
  })

  // Overall buy/sell ratio per ticker (for sentiment)
  const allRecent = await prisma.trade.findMany({
    where: {
      ticker: { not: null },
      transactionDate: { gte: since },
    },
    select: { ticker: true, tradeType: true, amount: true },
  })

  // Parse amount range to midpoint estimate
  function amountMidpoint(amount: string): number {
    const clean = amount.replace(/[$,]/g, '')
    if (clean.includes('Over 5,000,000') || clean.includes('5000000')) return 7500000
    const match = clean.match(/(\d+)\s*[-–]\s*(\d+)/)
    if (match) return (parseInt(match[1]) + parseInt(match[2])) / 2
    const single = parseInt(clean.replace(/[^0-9]/g, ''))
    return isNaN(single) ? 0 : single
  }

  // Aggregate by ticker
  const tickerMap = new Map<string, { buys: number; sells: number; buyVolume: number; sellVolume: number }>()
  for (const t of allRecent) {
    if (!t.ticker) continue
    const existing = tickerMap.get(t.ticker) ?? { buys: 0, sells: 0, buyVolume: 0, sellVolume: 0 }
    const vol = amountMidpoint(t.amount)
    if (t.tradeType === 'purchase') {
      existing.buys++
      existing.buyVolume += vol
    } else {
      existing.sells++
      existing.sellVolume += vol
    }
    tickerMap.set(t.ticker, existing)
  }

  const sentiment = Array.from(tickerMap.entries())
    .map(([ticker, data]) => ({
      ticker,
      buys: data.buys,
      sells: data.sells,
      buyVolume: Math.round(data.buyVolume),
      sellVolume: Math.round(data.sellVolume),
      sentiment: data.buys > data.sells * 1.5 ? 'bullish' : data.sells > data.buys * 1.5 ? 'bearish' : 'neutral',
    }))
    .sort((a, b) => (b.buys + b.sells) - (a.buys + a.sells))
    .slice(0, 20)

  return NextResponse.json({
    days,
    topBought: bought.map(b => ({ ticker: b.ticker, count: b._count.ticker })),
    topSold: sold.map(s => ({ ticker: s.ticker, count: s._count.ticker })),
    sentiment,
  })
}
