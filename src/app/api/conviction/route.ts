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

export type ConvictionTicker = {
  ticker: string
  score: number
  uniqueMembers: number
  bipartisan: boolean
  recentCount: number
  avgAmount: number
  topBuyers: { name: string; party: string; slug: string }[]
}

export async function GET() {
  const since30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  const since14 = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)

  const trades = await prisma.trade.findMany({
    where: {
      tradeType: 'purchase',
      ticker: { not: null },
      transactionDate: { gte: since30 },
    },
    select: {
      ticker: true,
      amount: true,
      transactionDate: true,
      memberId: true,
      member: {
        select: { name: true, party: true, slug: true },
      },
    },
  })

  const grouped = new Map<string, typeof trades>()
  for (const trade of trades) {
    if (!trade.ticker || ETF_BLOCKLIST.includes(trade.ticker)) continue
    const existing = grouped.get(trade.ticker) ?? []
    existing.push(trade)
    grouped.set(trade.ticker, existing)
  }

  const results: ConvictionTicker[] = []

  for (const [ticker, group] of grouped.entries()) {
    const memberIds = new Set(group.map(t => t.memberId))
    const uniqueMembers = memberIds.size

    const parties = new Set(group.map(t => t.member?.party).filter(Boolean))
    const bipartisan = parties.has('D') && parties.has('R')

    const recentCount = group.filter(t => t.transactionDate && t.transactionDate >= since14).length

    const amounts = group.map(t => amountMidpoint(t.amount))
    const avgAmount = amounts.length > 0 ? amounts.reduce((a, b) => a + b, 0) / amounts.length : 0

    const raw_score =
      uniqueMembers * 15 +
      (bipartisan ? 25 : 0) +
      recentCount * 5 +
      Math.min(avgAmount / 5000, 30)

    const score = Math.min(Math.round(raw_score), 100)

    const seenMembers = new Set<string>()
    const topBuyers: { name: string; party: string; slug: string }[] = []
    for (const trade of group) {
      if (!trade.member || seenMembers.has(trade.memberId)) continue
      seenMembers.add(trade.memberId)
      topBuyers.push({
        name: trade.member.name,
        party: trade.member.party ?? 'unknown',
        slug: trade.member.slug,
      })
      if (topBuyers.length >= 3) break
    }

    results.push({
      ticker,
      score,
      uniqueMembers,
      bipartisan,
      recentCount,
      avgAmount: Math.round(avgAmount),
      topBuyers,
    })
  }

  results.sort((a, b) => b.score - a.score)
  const top20 = results.slice(0, 20)

  return NextResponse.json({
    tickers: top20,
    generatedAt: new Date().toISOString(),
  })
}
