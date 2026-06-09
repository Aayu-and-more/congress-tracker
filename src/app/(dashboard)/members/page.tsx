export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import WatchButton from '@/components/WatchButton'

async function getMembers(chamber?: string, party?: string) {
  return prisma.member.findMany({
    include: { _count: { select: { trades: true } } },
    orderBy: { name: 'asc' },
    where: {
      ...(chamber && { chamber }),
      ...(party && { party }),
    },
  })
}

function PartyBadge({ party }: { party: string | null }) {
  if (party === 'D') return <span className="px-2 py-0.5 rounded text-xs bg-blue-400/10 text-blue-400">D</span>
  if (party === 'R') return <span className="px-2 py-0.5 rounded text-xs bg-red-400/10 text-red-400">R</span>
  return <span className="px-2 py-0.5 rounded text-xs bg-gray-400/10 text-gray-400">I</span>
}

export default async function MembersPage() {
  const members = await getMembers()
  const senators = members.filter((m: any) => m.chamber === 'senate')
  const reps = members.filter((m: any) => m.chamber === 'house')

  return (
    <div className="p-6 md:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#f4f4f4]" style={{ fontFamily: 'var(--font-heading)' }}>
          Members
        </h1>
        <p className="text-[#666] text-sm mt-1">
          {members.length} members · {senators.length} senators · {reps.length} representatives
        </p>
      </div>

      {members.length === 0 ? (
        <div className="text-[#444] text-sm py-12 text-center">
          No data yet — run <code className="bg-[#1a1a1a] px-1 rounded">POST /api/sync</code> to fetch data.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {members.map((m: any) => (
            <Link
              key={m.id}
              href={`/member/${m.slug}`}
              className="bg-[#111111] border border-[#1f1f1f] rounded-xl p-4 hover:bg-[#161616] hover:border-[#2a2a2a] transition-all group"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-[#f4f4f4] text-sm group-hover:text-white transition-colors truncate mr-2">
                  {m.name}
                </span>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <WatchButton type="member" id={m.slug} />
                  <PartyBadge party={m.party} />
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-[#555]">
                <span className={m.chamber === 'senate' ? 'text-purple-400' : 'text-yellow-400'}>
                  {m.chamber === 'senate' ? 'Senate' : 'House'}
                </span>
                {m.state && <span>· {m.state}</span>}
                <span>· {m._count?.trades ?? 0} trades</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
