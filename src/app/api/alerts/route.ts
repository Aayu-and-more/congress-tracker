import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const EMAIL_RE = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/

export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  const { email, members, tickers } = body as Record<string, unknown>

  if (typeof email !== 'string' || !EMAIL_RE.test(email) || email.length > 254) {
    return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
  }

  const safeMembers = Array.isArray(members)
    ? (members as unknown[]).filter((m): m is string => typeof m === 'string').slice(0, 50)
    : []
  const safeTickers = Array.isArray(tickers)
    ? (tickers as unknown[]).filter((t): t is string => typeof t === 'string').slice(0, 50)
    : []

  await prisma.alertSubscription.upsert({
    where: { email },
    create: {
      email,
      members: JSON.stringify(safeMembers),
      tickers: JSON.stringify(safeTickers),
      active: true,
    },
    update: {
      members: JSON.stringify(safeMembers),
      tickers: JSON.stringify(safeTickers),
      active: true,
    },
  })

  return NextResponse.json({ success: true })
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const email = searchParams.get('email')
  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
  }
  await prisma.alertSubscription.updateMany({
    where: { email },
    data: { active: false },
  })
  return NextResponse.json({ success: true })
}
