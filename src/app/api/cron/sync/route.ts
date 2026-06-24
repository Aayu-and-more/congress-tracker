import { timingSafeEqual } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { syncAll } from '@/lib/sync'

function safeCompare(a: string, b: string): boolean {
  try {
    const aBuf = Buffer.from(a)
    const bBuf = Buffer.from(b)
    if (aBuf.length !== bBuf.length) return false
    return timingSafeEqual(aBuf, bBuf)
  } catch {
    return false
  }
}

export async function GET(req: NextRequest) {
  // Vercel cron sends Authorization: Bearer <CRON_SECRET>
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    const auth = req.headers.get('authorization') ?? ''
    if (!safeCompare(auth, `Bearer ${cronSecret}`)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  } else if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 503 })
  }

  try {
    const results = await syncAll()
    return NextResponse.json({ success: true, syncedAt: new Date().toISOString(), ...results })
  } catch (err) {
    console.error('[cron/sync] Error:', err)
    return NextResponse.json({ success: false, error: 'Sync failed' }, { status: 500 })
  }
}
