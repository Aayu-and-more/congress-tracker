import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getQuote, getCandles } from '@/lib/finnhub'

interface RouteParams {
  params: Promise<{ ticker: string }>
}

function closestClose(t: number[], c: number[], targetUnix: number): number | null {
  if (!t.length) return null
  let bestIdx = 0
  let bestDiff = Math.abs(t[0] - targetUnix)
  for (let i = 1; i < t.length; i++) {
    const diff = Math.abs(t[i] - targetUnix)
    if (diff < bestDiff) {
      bestDiff = diff
      bestIdx = i
    }
  }
  return c[bestIdx]
}

export async function GET(_req: NextRequest, { params }: RouteParams) {
  const { ticker: rawTicker } = await params
  const ticker = rawTicker.toUpperCase().replace(/[^A-Z0-9.]/g, '')
  if (!ticker || !/^[A-Z0-9.]{1,10}$/.test(ticker)) {
    return NextResponse.json({ error: 'Invalid ticker' }, { status: 400 })
  }

  const quote = await getQuote(ticker)
  if (!quote) {
    return NextResponse.json({ available: false })
  }

  const buyTrades = await prisma.trade.findMany({
    where: { ticker, tradeType: 'purchase', transactionDate: { not: null } },
    orderBy: { transactionDate: 'desc' },
    take: 10,
    select: { id: true, transactionDate: true },
  })

  type TradeResult = {
    priceAtBuy: number
    currentReturnPct: number
    return30dPct: number | null
  }

  const results: TradeResult[] = []

  for (const trade of buyTrades) {
    if (!trade.transactionDate) continue
    const tradeUnix = Math.floor(new Date(trade.transactionDate).getTime() / 1000)
    try {
      const dayCandle = await getCandles(ticker, tradeUnix - 86400, tradeUnix + 86400)
      if (!dayCandle || dayCandle.s !== 'ok' || !dayCandle.t.length) continue

      const priceAtBuy = closestClose(dayCandle.t, dayCandle.c, tradeUnix)
      if (priceAtBuy === null || priceAtBuy === 0) continue

      const currentReturnPct = ((quote.c - priceAtBuy) / priceAtBuy) * 100

      let return30dPct: number | null = null
      try {
        const thirtyDayCandle = await getCandles(ticker, tradeUnix, tradeUnix + 30 * 86400)
        if (thirtyDayCandle && thirtyDayCandle.s === 'ok' && thirtyDayCandle.c.length >= 1) {
          const price30d = thirtyDayCandle.c[thirtyDayCandle.c.length - 1]
          return30dPct = ((price30d - priceAtBuy) / priceAtBuy) * 100
        }
      } catch {
      }

      results.push({ priceAtBuy, currentReturnPct, return30dPct })
    } catch {
    }
  }

  if (results.length < 2) {
    return NextResponse.json({ available: false, reason: 'insufficient_data' })
  }

  const avgCurrentReturn = results.reduce((sum, r) => sum + r.currentReturnPct, 0) / results.length

  const valid30d = results.filter(r => r.return30dPct !== null)
  const avg30dReturn = valid30d.length >= 2
    ? valid30d.reduce((sum, r) => sum + (r.return30dPct as number), 0) / valid30d.length
    : null

  const bestReturn = Math.max(...results.map(r => r.currentReturnPct))
  const worstReturn = Math.min(...results.map(r => r.currentReturnPct))

  return NextResponse.json({
    available: true,
    ticker,
    tradesAnalyzed: results.length,
    avgCurrentReturn,
    avg30dReturn,
    bestReturn,
    worstReturn,
    currentPrice: quote.c,
  }, { headers: { 'Cache-Control': 's-maxage=300, stale-while-revalidate=600' } })
}
