import { NextResponse } from 'next/server'
import { syncAll } from '@/lib/sync'

export async function POST(req: Request) {
  // Require SYNC_SECRET in production; warn loudly in dev if unset
  const secret = process.env.SYNC_SECRET
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      // In production, refuse to run without a secret — prevents accidental open endpoint
      return NextResponse.json({ error: 'Sync endpoint is not configured' }, { status: 503 })
    }
    // In development we allow it, but log a clear warning
    console.warn('[sync] WARNING: SYNC_SECRET is not set. Endpoint is unprotected.')
  } else {
    const auth = req.headers.get('authorization')
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  try {
    const results = await syncAll()
    return NextResponse.json({ success: true, ...results })
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({ message: 'Use POST to trigger sync' })
}
