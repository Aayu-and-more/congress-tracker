import { NextRequest, NextResponse } from 'next/server'
import { getAnalyticsData } from '@/lib/analyticsData'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const rawDays = parseInt(searchParams.get('days') ?? '90', 10)
  const days = Number.isFinite(rawDays) && rawDays >= 7 && rawDays <= 365 ? rawDays : 90

  const data = await getAnalyticsData(days)
  return NextResponse.json(data)
}
