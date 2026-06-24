import { timingSafeEqual } from 'crypto'
import { NextResponse } from 'next/server'
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

export async function POST(req: Request) {
  // Require SYNC_SECRET in production; warn loudly in dev if unset
  const secret = process.env.SYNC_SECRET
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Sync endpoint is not configured' }, { status: 503 })
    }
    console.warn('[sync] WARNING: SYNC_SECRET is not set. Endpoint is unprotected.')
  } else {
    const auth = req.headers.get('authorization') ?? ''
    if (!safeCompare(auth, `Bearer ${secret}`)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  try {
    const results = await syncAll()
    return NextResponse.json({ success: true, ...results })
  } catch (err) {
    console.error('[sync] Error:', err)
    return NextResponse.json({ success: false, error: 'Sync failed' }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ message: 'Use POST to trigger sync' })
}
