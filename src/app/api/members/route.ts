import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const VALID_CHAMBERS = new Set(['senate', 'house'])
const VALID_PARTIES = new Set(['D', 'R', 'I', 'unknown'])

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl

  const rawChamber = searchParams.get('chamber')
  const chamber = rawChamber && VALID_CHAMBERS.has(rawChamber) ? rawChamber : null

  const rawParty = searchParams.get('party')
  const party = rawParty && VALID_PARTIES.has(rawParty) ? rawParty : null

  // Limit search query to 100 chars, strip control characters
  const rawSearch = searchParams.get('q')
  const search = rawSearch ? rawSearch.slice(0, 100).replace(/[\x00-\x1f\x7f]/g, '') : null

  const members = await prisma.member.findMany({
    where: {
      ...(chamber && { chamber }),
      ...(party && { party }),
      ...(search && { name: { contains: search } }),
    },
    include: {
      _count: { select: { trades: true } },
    },
    orderBy: { name: 'asc' },
  })

  return NextResponse.json({ members })
}
