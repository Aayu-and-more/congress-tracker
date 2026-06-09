import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl

  // Sanitize symbol: uppercase letters, digits, dots, carets — max 10 chars
  const rawSymbol = searchParams.get('symbol')
  const symbol =
    rawSymbol && rawSymbol.length <= 10
      ? rawSymbol.replace(/[^A-Za-z0-9.^]/g, '').toUpperCase() || null
      : null

  if (symbol) {
    const trades = await prisma.trade.findMany({
      where: { ticker: symbol },
      include: {
        member: {
          select: {
            id: true,
            name: true,
            party: true,
            chamber: true,
            state: true,
            slug: true,
          },
        },
      },
      orderBy: { transactionDate: 'desc' },
      take: 100,
    })
    return NextResponse.json({ symbol, trades })
  }

  // Top tickers by trade count
  const tickers = await prisma.trade.groupBy({
    by: ['ticker'],
    where: { ticker: { not: null } },
    _count: { ticker: true },
    orderBy: { _count: { ticker: 'desc' } },
    take: 50,
  })

  return NextResponse.json({ tickers })
}
