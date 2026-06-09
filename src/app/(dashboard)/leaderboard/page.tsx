export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { prisma } from '@/lib/prisma'

async function getLeaderboardData() {
  const members = await prisma.member.findMany({
    include: { _count: { select: { trades: true } } },
    orderBy: { name: 'asc' },
  })
  return members.sort((a, b) => (b._count?.trades ?? 0) - (a._count?.trades ?? 0))
}

export default async function LeaderboardPage() {
  const members = await getLeaderboardData()

  return (
    <div className="p-6 md:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#f4f4f4]" style={{ fontFamily: 'var(--font-heading)' }}>
          Leaderboard
        </h1>
        <p className="text-[#666] text-sm mt-1">Most active traders in Congress, ranked by disclosure count</p>
      </div>

      {members.length === 0 ? (
        <div className="text-[#444] text-sm py-12 text-center">No data yet — sync first.</div>
      ) : (
        <div className="space-y-2">
          {members.map((m: any, i: number) => (
            <Link
              key={m.id}
              href={`/member/${m.slug}`}
              className="flex items-center gap-4 bg-[#111111] border border-[#1f1f1f] rounded-xl p-4 hover:bg-[#161616] hover:border-[#2a2a2a] transition-all group"
            >
              <span className={`text-lg font-bold w-8 text-right flex-shrink-0 ${i < 3 ? 'text-yellow-400' : 'text-[#333]'}`} style={{ fontFamily: 'var(--font-heading)' }}>
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-[#f4f4f4] text-sm group-hover:text-white transition-colors">{m.name}</span>
                  {m.party === 'D' && <span className="px-1.5 py-0.5 rounded text-xs bg-blue-400/10 text-blue-400">D</span>}
                  {m.party === 'R' && <span className="px-1.5 py-0.5 rounded text-xs bg-red-400/10 text-red-400">R</span>}
                  <span className={`text-xs ${m.chamber === 'senate' ? 'text-purple-400' : 'text-yellow-400'}`}>
                    {m.chamber === 'senate' ? 'Senate' : 'House'}
                  </span>
                </div>
                {m.state && <div className="text-xs text-[#555] mt-0.5">{m.state}</div>}
              </div>
              <div className="flex-shrink-0 text-right">
                <div className="text-lg font-bold text-[#f4f4f4]" style={{ fontFamily: 'var(--font-heading)' }}>{m._count?.trades ?? 0}</div>
                <div className="text-xs text-[#555]">trades</div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
