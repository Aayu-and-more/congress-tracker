export const dynamic = 'force-dynamic'

import DumpWatch from '@/components/DumpWatch'

export default async function DumpWatchPage() {
  return (
    <div className="p-6 md:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#f4f4f4]" style={{ fontFamily: 'var(--font-heading)' }}>Dump Watch</h1>
        <p className="text-[#666] text-sm mt-1">Stocks Congress is exiting — last 30 days</p>
      </div>
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="text-red-400 text-xs font-semibold uppercase tracking-wider">🔴 Sell Pressure Monitor</span>
        </div>
        <DumpWatch />
        <p className="text-xs text-[#333] pt-2">
          Score combines unique seller count, bipartisan activity, recency, and estimated sell volume. Members sometimes sell for personal reasons unrelated to stock outlook. Not investment advice.
        </p>
      </div>
    </div>
  )
}
