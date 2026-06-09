export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { prisma } from '@/lib/prisma'

interface PageProps {
  params: Promise<{ slug: string }>
}

async function getMemberData(slug: string) {
  const [member, trades] = await Promise.all([
    prisma.member.findUnique({
      where: { slug },
    }),
    prisma.trade.findMany({
      where: { member: { slug } },
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
      take: 200,
    }),
  ])
  return { member, trades }
}

export default async function MemberPage({ params }: PageProps) {
  const { slug } = await params
  const { member, trades } = await getMemberData(slug)

  if (!member) {
    return (
      <div className="p-8 text-[#666]">
        Member not found or data not yet synced.{' '}
        <Link href="/" className="text-blue-400 hover:underline">Go back</Link>
      </div>
    )
  }

  const purchases = trades.filter((t: any) => t.tradeType === 'purchase').length
  const sales = trades.filter((t: any) => t.tradeType !== 'purchase').length
  const lateFilings = trades.filter((t: any) => t.filedLate).length

  return (
    <div className="p-6 md:p-8">
      <Link href="/members" className="text-[#555] text-sm hover:text-[#f4f4f4] transition-colors mb-6 inline-block">
        ← All Members
      </Link>

      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-2xl font-bold text-[#f4f4f4]" style={{ fontFamily: 'var(--font-heading)' }}>
            {member.name}
          </h1>
          {member.party === 'D' && <span className="px-2 py-0.5 rounded text-xs bg-blue-400/10 text-blue-400">Democrat</span>}
          {member.party === 'R' && <span className="px-2 py-0.5 rounded text-xs bg-red-400/10 text-red-400">Republican</span>}
        </div>
        <p className="text-[#666] text-sm">
          {member.chamber === 'senate' ? 'Senator' : 'Representative'}
          {member.state && ` · ${member.state}`}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Trades', value: trades.length },
          { label: 'Purchases', value: purchases },
          { label: 'Sales', value: sales },
          { label: 'Late Filings', value: lateFilings },
        ].map(stat => (
          <div key={stat.label} className="bg-[#111111] border border-[#1f1f1f] rounded-xl p-4">
            <div className="text-2xl font-bold text-[#f4f4f4]" style={{ fontFamily: 'var(--font-heading)' }}>{stat.value}</div>
            <div className="text-xs text-[#555] mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Trades list */}
      <h2 className="text-lg font-semibold text-[#f4f4f4] mb-4" style={{ fontFamily: 'var(--font-heading)' }}>
        Trade History
      </h2>
      {trades.length === 0 ? (
        <div className="text-[#444] text-sm">No trades found for this member.</div>
      ) : (
        <div className="space-y-2">
          {trades.map((trade: any) => (
            <div key={trade.id} className="bg-[#111111] border border-[#1f1f1f] rounded-lg p-4 flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-4">
                {trade.ticker ? (
                  <Link href={`/ticker/${trade.ticker}`} className="font-mono font-semibold text-[#f4f4f4] hover:text-blue-400 transition-colors w-16">
                    {trade.ticker}
                  </Link>
                ) : (
                  <span className="text-[#444] w-16 text-sm">—</span>
                )}
                <div>
                  <div className="text-sm text-[#999] truncate max-w-xs">{trade.assetName}</div>
                  <div className="text-xs text-[#555]">{trade.amount}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${trade.tradeType === 'purchase' ? 'bg-emerald-400/10 text-emerald-400' : 'bg-red-400/10 text-red-400'}`}>
                  {trade.tradeType === 'purchase' ? 'BUY' : 'SELL'}
                </span>
                <span className="text-xs text-[#555]">
                  {trade.transactionDate ? new Date(trade.transactionDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                </span>
                {trade.filedLate && (
                  <span className="px-1.5 py-0.5 rounded text-xs bg-orange-400/10 text-orange-400">LATE</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
