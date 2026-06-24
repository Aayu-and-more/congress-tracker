import { NextResponse } from 'next/server'
import { syncAll } from '@/lib/sync'

export async function POST(req: Request) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production. Use the Vercel cron.' }, { status: 403 })
  }
  const results = await syncAll()
  return NextResponse.json({ success: true, ...results })
}
