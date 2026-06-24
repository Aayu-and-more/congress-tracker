export const dynamic = 'force-dynamic'

import WeeklyTrendChart from '@/components/charts/WeeklyTrendChart'
import PartyBreakdownChart from '@/components/charts/PartyBreakdownChart'
import BipartisanTable from '@/components/charts/BipartisanTable'
import { getAnalyticsData } from '@/lib/analyticsData'
import Link from 'next/link'

export default async function AnalyticsPage() {
  const data = await getAnalyticsData(90)
  const hasData = data.weeklyTrend.some(w => w.purchases > 0 || w.sales > 0)

  return (
    <div className="p-6 md:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#f4f4f4]" style={{ fontFamily: 'var(--font-heading)' }}>
          Analytics
        </h1>
        <p className="text-[#666] text-sm mt-1">90-day trading patterns across Congress</p>
      </div>

      {!hasData ? (
        <div className="text-[#444] text-sm py-12 text-center">
          No trade data yet.{' '}
          <Link href="/" className="text-blue-400 hover:underline">Go to Live Feed</Link>
          {' '}— data syncs automatically each day.
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-[#111111] border border-[#1f1f1f] rounded-xl p-5">
              <h2 className="text-sm font-medium text-[#f4f4f4] mb-4">Party Breakdown</h2>
              <PartyBreakdownChart data={data.partyBreakdown} />
            </div>
            <div className="bg-[#111111] border border-[#1f1f1f] rounded-xl p-5">
              <h2 className="text-sm font-medium text-[#f4f4f4] mb-4">Bipartisan Buys</h2>
              <BipartisanTable data={data.bipartisan} />
            </div>
          </div>

          <div className="bg-[#111111] border border-[#1f1f1f] rounded-xl p-5">
            <h2 className="text-sm font-medium text-[#f4f4f4] mb-4">Weekly Trade Volume</h2>
            <WeeklyTrendChart data={data.weeklyTrend} />
          </div>

          {data.lateFilingStats.total > 0 && (
            <div className="bg-[#111111] border border-[#1f1f1f] rounded-xl p-5">
              <h2 className="text-sm font-medium text-[#f4f4f4] mb-1">Late Filing Stats</h2>
              <p className="text-xs text-[#555] mb-4">{data.lateFilingStats.total} trades filed late in the last 90 days</p>
              <div className="space-y-2">
                {data.lateFilingStats.topLateMembers.map((filer) => (
                  <div key={filer.slug} className="flex items-center justify-between py-2 border-b border-[#1a1a1a] last:border-0">
                    <Link href={`/member/${filer.slug}`} className="text-sm text-[#f4f4f4] hover:text-blue-400 transition-colors">
                      {filer.name}
                    </Link>
                    <span className="text-sm text-orange-400 font-medium">{filer.count} late</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
