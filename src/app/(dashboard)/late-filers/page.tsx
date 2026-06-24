export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/prisma'
import TradeRow from '@/components/TradeRow'

export default async function LateFilersPage() {
  const trades = await prisma.trade.findMany({
    where: { filedLate: true },
    include: { member: { select: { name: true, party: true, chamber: true, slug: true, state: true } } },
    orderBy: { disclosureDate: 'desc' },
    take: 200,
  })

  return (
    <div className="p-6 md:p-8">
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-[#f4f4f4]" style={{ fontFamily: 'var(--font-heading)' }}>
            Late Filers
          </h1>
          <span className="px-2.5 py-1 rounded-lg bg-orange-400/10 text-orange-400 text-sm font-medium">
            {trades.length.toLocaleString()}
          </span>
        </div>
        <p className="text-[#666] text-sm mt-1">Trades disclosed past the 45-day STOCK Act deadline</p>
      </div>

      {trades.length === 0 ? (
        <div className="text-[#444] text-sm py-12 text-center">No late-filed trades found.</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[#1f1f1f]">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#1f1f1f]">
                {['Ticker', 'Asset', 'Type', 'Amount', 'Member', 'Chamber', 'Date', 'Source'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-[#555] uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {trades.map(trade => (
                <TradeRow key={trade.id} trade={trade as any} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
