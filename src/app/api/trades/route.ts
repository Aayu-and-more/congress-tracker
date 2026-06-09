import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Allowlists for enum-like parameters
const VALID_CHAMBERS = new Set(['senate', 'house'])
const VALID_PARTIES = new Set(['D', 'R', 'I', 'unknown'])
const VALID_TRADE_TYPES = new Set(['purchase', 'sale_full', 'sale_partial', 'sale', 'exchange', 'unknown'])

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl

  const rawPage = parseInt(searchParams.get('page') ?? '1', 10)
  const page = Number.isFinite(rawPage) && rawPage >= 1 && rawPage <= 1000 ? rawPage : 1

  const rawLimit = parseInt(searchParams.get('limit') ?? '50', 10)
  const limit = Math.min(Number.isFinite(rawLimit) && rawLimit >= 1 ? rawLimit : 50, 100)

  const rawTicker = searchParams.get('ticker')
  const ticker = rawTicker && rawTicker.length <= 10 ? rawTicker.replace(/[^A-Za-z0-9.^]/g, '') : null

  const rawChamber = searchParams.get('chamber')
  const chamber = rawChamber && VALID_CHAMBERS.has(rawChamber) ? rawChamber : null

  const rawParty = searchParams.get('party')
  const party = rawParty && VALID_PARTIES.has(rawParty) ? rawParty : null

  const rawTradeType = searchParams.get('type')
  const tradeType = rawTradeType && VALID_TRADE_TYPES.has(rawTradeType) ? rawTradeType : null

  const rawMemberId = searchParams.get('memberId')
  // memberId is a cuid/uuid — allow alphanumeric + hyphens, max 36 chars
  const memberId = rawMemberId && /^[a-z0-9_-]{1,36}$/i.test(rawMemberId) ? rawMemberId : null

  const where = {
    ...(ticker && { ticker: { equals: ticker.toUpperCase() } }),
    ...(tradeType && { tradeType }),
    ...(memberId && { memberId }),
    ...(chamber || party
      ? {
          member: {
            ...(chamber && { chamber }),
            ...(party && { party }),
          },
        }
      : {}),
  }

  const [trades, total] = await Promise.all([
    prisma.trade.findMany({
      where,
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
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.trade.count({ where }),
  ])

  return NextResponse.json({ trades, total, page, limit, pages: Math.ceil(total / limit) })
}
