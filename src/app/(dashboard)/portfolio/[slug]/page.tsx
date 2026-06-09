export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { prisma } from '@/lib/prisma'

interface PageProps {
  params: Promise<{ slug: string }>
}

function amountMidpoint(amount: string): number {
  const clean = amount.replace(/[$,]/g, '')
  if (clean.toLowerCase().includes('over')) return 7500000
  const match = clean.match(/(\d[\d]*)\s*[-–]\s*(\d[\d]*)/)
  if (match) return (parseInt(match[1]) + parseInt(match[2])) / 2
  const single = parseInt(clean.replace(/[^0-9]/g, ''))
  return isNaN(single) ? 0 : single
}

function formatDollar(n: number): string {
  if (n >= 1_000_000) return `~$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `~$${(n / 1_000).toFixed(0)}K`
  return `~$${n.toFixed(0)}`
}

async function getPortfolio(slug: string) {
  const member = await prisma.member.findUnique({
    where: { slug },
    include: {
      trades: {
        where: { ticker: { not: null } },
        orderBy: { transactionDate: 'asc' },
        select: { ticker: true, tradeType: true, amount: true, transactionDate: true, assetName: true, docUrl: true },
      },
    },
  })
  if (!member) return null

  const holdingsMap = new Map<string, {
    ticker: string; assetName: string; buyCount: number; sellCount: number
    estimatedBuyValue: number; estimatedSellValue: number; lastActivity: Date | null; docUrl: string | null
  }>()

  for (const trade of member.trades) {
    if (!trade.ticker) continue
    const h = holdingsMap.get(trade.ticker) ?? {
      ticker: trade.ticker, assetName: trade.assetName, buyCount: 0, sellCount: 0,
      estimatedBuyValue: 0, estimatedSellValue: 0, lastActivity: null, docUrl: null,
    }
    const val = amountMidpoint(trade.amount)
    if (trade.tradeType === 'purchase') { h.buyCount++; h.estimatedBuyValue += val }
    else { h.sellCount++; h.estimatedSellValue += val }
    if (!h.lastActivity || (trade.transactionDate && trade.transactionDate > h.lastActivity)) {
      h.lastActivity = trade.transactionDate
    }
    if (trade.docUrl) h.docUrl = trade.docUrl
    holdingsMap.set(trade.ticker, h)
  }

  const portfolio = Array.from(holdingsMap.values())
    .map(h => ({
      ...h,
      netValue: Math.round(h.estimatedBuyValue - h.estimatedSellValue),
      status: h.estimatedBuyValue > h.estimatedSellValue * 0.8 ? 'holding' : 'reduced',
    }))
    .filter(h => h.buyCount > 0)
    .sort((a, b) => b.estimatedBuyValue - a.estimatedBuyValue)

  return { member, portfolio }
}

export default async function MemberPortfolioPage({ params }: PageProps) {
  const { slug } = await params
  const data = await getPortfolio(slug)

  if (!data) {
    return (
      <div className="p-8 text-[#666]">
        Member not found. <Link href="/portfolio" className="text-blue-400 hover:underline">Back to portfolios</Link>
      </div>
    )
  }

  const { member, portfolio } = data
  const totalBuyEstimate = portfolio.reduce((s, h) => s + h.estimatedBuyValue, 0)
  const holding = portfolio.filter(h => h.status === 'holding')
  const reduced = portfolio.filter(h => h.status === 'reduced')

  return (
    <div className="p-6 md:p-8">
      <Link href="/portfolio" className="text-[#555] text-sm hover:text-[#f4f4f4] transition-colors mb-6 inline-block">
        ← All Portfolios
      </Link>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-2xl font-bold text-[#f4f4f4]" style={{ fontFamily: 'var(--font-heading)' }}>
            {member.name}
          </h1>
          {member.party === 'D' && <span className="px-2 py-0.5 rounded text-xs bg-blue-400/10 text-blue-400">Democrat</span>}
          {member.party === 'R' && <span className="px-2 py-0.5 rounded text-xs bg-red-400/10 text-red-400">Republican</span>}
        </div>
        <p className="text-[#666] text-sm mt-1">
          {member.chamber === 'senate' ? 'Senator' : 'Representative'}{member.state && ` · ${member.state}`} · Estimated portfolio from STOCK Act disclosures
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Positions', value: portfolio.length },
          { label: 'Holding', value: holding.length },
          { label: 'Reduced/Sold', value: reduced.length },
          { label: 'Est. Buy Total', value: formatDollar(totalBuyEstimate) },
        ].map(s => (
          <div key={s.label} className="bg-[#111111] border border-[#1f1f1f] rounded-xl p-4">
            <div className="text-xl font-bold text-[#f4f4f4]" style={{ fontFamily: 'var(--font-heading)' }}>{s.value}</div>
            <div className="text-xs text-[#555] mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Holdings table */}
      {portfolio.length === 0 ? (
        <div className="text-[#444] text-sm py-12 text-center">No ticker data found for this member.</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[#1f1f1f]">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#1f1f1f]">
                {['Ticker', 'Asset', 'Status', 'Est. Buy Value', 'Buys', 'Sells', 'Last Activity', 'Source'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-[#555] uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {portfolio.map(h => (
                <tr key={h.ticker} className="border-b border-[#1a1a1a] hover:bg-[#111111] transition-colors">
                  <td className="px-4 py-3">
                    <Link href={`/ticker/${h.ticker}`} className="font-mono font-semibold text-[#f4f4f4] hover:text-blue-400 transition-colors text-sm">
                      {h.ticker}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sm text-[#999] max-w-[160px]">
                    <span className="truncate block" title={h.assetName}>{h.assetName}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      h.status === 'holding' ? 'bg-emerald-400/10 text-emerald-400' : 'bg-orange-400/10 text-orange-400'
                    }`}>
                      {h.status === 'holding' ? 'Holding' : 'Reduced'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-[#f4f4f4] font-mono">
                    {formatDollar(h.estimatedBuyValue)}
                  </td>
                  <td className="px-4 py-3 text-sm text-emerald-400">{h.buyCount}</td>
                  <td className="px-4 py-3 text-sm text-red-400">{h.sellCount}</td>
                  <td className="px-4 py-3 text-xs text-[#555]">
                    {h.lastActivity ? new Date(h.lastActivity).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    {h.docUrl ? (
                      <a href={h.docUrl} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
                        Gov Doc ↗
                      </a>
                    ) : (
                      <span className="text-xs text-[#333]">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-6 text-xs text-[#333] leading-relaxed">
        ⚠️ Values are estimates from midpoints of disclosed ranges. Members report ranges, not exact amounts. Not investment advice. All data from official STOCK Act filings.
      </div>
    </div>
  )
}
