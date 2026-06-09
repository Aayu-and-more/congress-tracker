import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  const member = await prisma.member.findUnique({
    where: { slug },
    include: {
      trades: {
        where: { ticker: { not: null } },
        orderBy: { transactionDate: 'asc' },
        select: { ticker: true, tradeType: true, amount: true, transactionDate: true, assetName: true, docUrl: true },
      },
    },
  })

  if (!member) return NextResponse.json({ error: 'Member not found' }, { status: 404 })

  // Calculate net position per ticker
  const holdings = new Map<string, {
    ticker: string
    assetName: string
    buyCount: number
    sellCount: number
    estimatedBuyValue: number
    estimatedSellValue: number
    lastActivity: Date | null
    docUrl: string | null
  }>()

  for (const trade of member.trades) {
    if (!trade.ticker) continue
    const existing = holdings.get(trade.ticker) ?? {
      ticker: trade.ticker,
      assetName: trade.assetName,
      buyCount: 0,
      sellCount: 0,
      estimatedBuyValue: 0,
      estimatedSellValue: 0,
      lastActivity: null,
      docUrl: null,
    }
    const val = amountMidpoint(trade.amount)
    if (trade.tradeType === 'purchase') {
      existing.buyCount++
      existing.estimatedBuyValue += val
    } else {
      existing.sellCount++
      existing.estimatedSellValue += val
    }
    if (!existing.lastActivity || (trade.transactionDate && trade.transactionDate > existing.lastActivity)) {
      existing.lastActivity = trade.transactionDate
    }
    if (trade.docUrl) existing.docUrl = trade.docUrl
    holdings.set(trade.ticker, existing)
  }

  // Only show tickers where member appears to still hold (bought more than sold by value)
  const portfolio = Array.from(holdings.values())
    .map(h => ({
      ...h,
      netValue: Math.round(h.estimatedBuyValue - h.estimatedSellValue),
      status: h.estimatedBuyValue > h.estimatedSellValue * 0.8 ? 'holding' : 'reduced' as const,
    }))
    .filter(h => h.buyCount > 0)
    .sort((a, b) => b.estimatedBuyValue - a.estimatedBuyValue)

  return NextResponse.json({
    member: {
      name: member.name,
      party: member.party,
      chamber: member.chamber,
      state: member.state,
      slug: member.slug,
    },
    portfolio,
    totalTickers: portfolio.length,
    estimatedTotalBuys: Math.round(portfolio.reduce((s, h) => s + h.estimatedBuyValue, 0)),
  })
}
