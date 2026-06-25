export const dynamic = 'force-dynamic'

import ConvictionTable from '@/components/ConvictionTable'

export default function SignalsPage() {
  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#f4f4f4]" style={{ fontFamily: 'var(--font-heading)' }}>
          Buy Signals
        </h1>
        <p className="text-[#666] text-sm mt-1">
          Stocks Congress is buying with highest conviction — last 30 days
        </p>
      </div>

      <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-xl p-4 mb-6">
        <p className="text-xs text-[#444]">
          <span className="text-[#555] font-medium">Conviction Score</span> measures how strongly Congress is collectively buying a stock.
          It factors in how many unique members are buying, whether both parties are buying (bipartisan signal),
          how recently trades were filed (last 14 days weighted higher), and the estimated total buy volume.
          Scores are normalized to 100.
        </p>
      </div>

      <ConvictionTable />

      <p className="text-xs text-[#333] mt-6">
        Score combines unique member count, bipartisan activity, recency, and estimated buy volume. Not investment advice.
      </p>
    </div>
  )
}
