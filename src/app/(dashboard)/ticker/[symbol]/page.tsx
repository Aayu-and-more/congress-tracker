export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import PriceBadge from '@/components/PriceBadge'
import TradePerformance from '@/components/TradePerformance'

interface PageProps {
  params: Promise<{ symbol: string }>
}

async function getTickerData(symbol: string) {
  const trades = await prisma.trade.findMany({
    where: { ticker: symbol.toUpperCase() },
    include: {
      member: {
        select: {
          id: true,
          name: true,
          party: true,
          chamber: true,
          state: true,
          slug: true,
        },
      },
    },
    orderBy: { transactionDate: 'desc' },
    take: 100,
  })
  return { symbol, trades }
}

export default async function TickerPage({ params }: PageProps) {
  const { symbol } = await params
  const { trades } = await getTickerData(symbol)

  const purchases = trades.filter((t: any) => t.tradeType === 'purchase').length
  const sales = trades.length - purchases

  return (
    <div className="p-6 md:p-8">
      <Link href="/" className="text-[#555] text-sm hover:text-[#f4f4f4] transition-colors mb-6 inline-block">
        ← Back to Feed
      </Link>

      <div className="mb-8">
        <div className="flex items-center flex-wrap gap-2">
          <h1 className="text-3xl font-bold text-[#f4f4f4] font-mono" style={{ fontFamily: 'var(--font-heading)' }}>
            {symbol.toUpperCase()}
          </h1>
          <PriceBadge ticker={symbol.toUpperCase()} />
        </div>
        <p className="text-[#666] text-sm mt-1">{trades.length} congressional trades disclosed</p>
        <p className="text-xs text-[#444] mt-1">
          Data from{' '}
          <a href="https://disclosures-clerk.house.gov/FinancialDisclosure" target="_blank" rel="noopener noreferrer" className="text-blue-400/60 hover:text-blue-400 transition-colors">
            House Clerk
          </a>
          {' & '}
          <a href="https://efdsearch.senate.gov/search/" target="_blank" rel="noopener noreferrer" className="text-blue-400/60 hover:text-blue-400 transition-colors">
            Senate eFD
          </a>
          {' '}— mandatory STOCK Act filings
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Total Trades', value: trades.length },
          { label: 'Buys', value: purchases },
          { label: 'Sells', value: sales },
        ].map(s => (
          <div key={s.label} className="bg-[#111111] border border-[#1f1f1f] rounded-xl p-4">
            <div className="text-2xl font-bold text-[#f4f4f4]" style={{ fontFamily: 'var(--font-heading)' }}>{s.value}</div>
            <div className="text-xs text-[#555] mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      <TradePerformance ticker={symbol.toUpperCase()} />

      <h2 className="text-lg font-semibold text-[#f4f4f4] mb-4" style={{ fontFamily: 'var(--font-heading)' }}>Who&apos;s Trading</h2>
      {trades.length === 0 ? (
        <div className="text-[#444] text-sm">No trades found for {symbol}. Sync data first.</div>
      ) : (
        <div className="space-y-2">
          {trades.map((trade: any) => (
            <div key={trade.id} className="bg-[#111111] border border-[#1f1f1f] rounded-lg p-4 flex items-center justify-between flex-wrap gap-3">
              <Link href={`/member/${trade.member.slug}`} className="flex items-center gap-3 hover:text-blue-400 transition-colors">
                <span className={`w-2 h-2 rounded-full ${trade.member.party === 'D' ? 'bg-blue-400' : trade.member.party === 'R' ? 'bg-red-400' : 'bg-gray-400'}`} />
                <span className="text-sm text-[#f4f4f4]">{trade.member.name}</span>
                <span className={`text-xs ${trade.member.chamber === 'senate' ? 'text-purple-400' : 'text-yellow-400'}`}>
                  {trade.member.chamber === 'senate' ? 'SEN' : 'REP'}
                </span>
              </Link>
              <div className="flex items-center gap-3 text-sm">
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${trade.tradeType === 'purchase' ? 'bg-emerald-400/10 text-emerald-400' : 'bg-red-400/10 text-red-400'}`}>
                  {trade.tradeType === 'purchase' ? 'BUY' : 'SELL'}
                </span>
                <span className="text-[#555]">{trade.amount}</span>
                <span className="text-[#444]">
                  {trade.transactionDate ? new Date(trade.transactionDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
