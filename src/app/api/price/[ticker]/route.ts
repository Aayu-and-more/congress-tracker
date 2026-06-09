import { NextRequest, NextResponse } from 'next/server'
import { getQuote } from '@/lib/finnhub'

// Input validation - ticker must be safe
const TICKER_RE = /^[A-Z0-9.^]{1,10}$/

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ ticker: string }> }
) {
  const { ticker } = await params
  if (!TICKER_RE.test(ticker)) {
    return NextResponse.json({ error: 'Invalid ticker' }, { status: 400 })
  }
  const quote = await getQuote(ticker)
  if (!quote) {
    return NextResponse.json({ available: false })
  }
  const changePercent = quote.pc > 0 ? ((quote.c - quote.pc) / quote.pc) * 100 : 0
  return NextResponse.json({
    available: true,
    current: quote.c,
    prevClose: quote.pc,
    changePercent: parseFloat(changePercent.toFixed(2)),
  })
}
