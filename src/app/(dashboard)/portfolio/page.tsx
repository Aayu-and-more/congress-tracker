export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/prisma'
import Link from 'next/link'

async function getFeaturedMembers() {
  // Get top 6 most-active traders
  const members = await prisma.member.findMany({
    include: { _count: { select: { trades: true } } },
    orderBy: { trades: { _count: 'desc' } },
    take: 6,
  })
  return members
}

function PartyDot({ party }: { party: string | null }) {
  const color = party === 'D' ? 'bg-blue-400' : party === 'R' ? 'bg-red-400' : 'bg-gray-400'
  return <span className={`w-2 h-2 rounded-full inline-block ${color}`} />
}

export default async function PortfolioPage() {
  const members = await getFeaturedMembers()

  return (
    <div className="p-6 md:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#f4f4f4]" style={{ fontFamily: 'var(--font-heading)' }}>
          Portfolios
        </h1>
        <p className="text-[#666] text-sm mt-1">
          Estimated stock holdings based on disclosed congressional trades
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {members.map(m => (
          <Link
            key={m.id}
            href={`/portfolio/${m.slug}`}
            className="bg-[#111111] border border-[#1f1f1f] rounded-xl p-5 hover:bg-[#161616] hover:border-[#2a2a2a] transition-all group"
          >
            <div className="flex items-center gap-2 mb-3">
              <PartyDot party={m.party} />
              <span className="font-semibold text-[#f4f4f4] text-sm group-hover:text-white transition-colors">
                {m.name}
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-[#555] mb-4">
              <span className={m.chamber === 'senate' ? 'text-purple-400' : 'text-yellow-400'}>
                {m.chamber === 'senate' ? 'Senate' : 'House'}
              </span>
              {m.state && <span>{m.state}</span>}
              <span>{m._count.trades} trades disclosed</span>
            </div>
            <div className="text-xs text-[#444]">
              View portfolio →
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-8 bg-[#0d0d0d] border border-[#1a1a1a] rounded-xl p-4">
        <p className="text-xs text-[#444] leading-relaxed">
          ⚠️ Portfolio values are <strong className="text-[#666]">estimates only</strong>, calculated from the midpoint of disclosed trade amount ranges. Members only disclose ranges (e.g. $1,001–$15,000), not exact amounts. This is not investment advice.
        </p>
      </div>
    </div>
  )
}
