import Link from 'next/link'

interface MemberCardProps {
  id: string
  name: string
  party: string | null
  chamber: string
  state: string | null
  slug: string
  tradeCount?: number
}

export default function MemberCard({ name, party, chamber, state, slug, tradeCount }: MemberCardProps) {
  return (
    <Link href={`/member/${slug}`} className="bg-[#111111] border border-[#1f1f1f] rounded-xl p-4 hover:bg-[#161616] hover:border-[#2a2a2a] transition-all block group">
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium text-[#f4f4f4] text-sm group-hover:text-white transition-colors truncate mr-2">{name}</span>
        {party === 'D' && <span className="px-2 py-0.5 rounded text-xs bg-blue-400/10 text-blue-400 flex-shrink-0">D</span>}
        {party === 'R' && <span className="px-2 py-0.5 rounded text-xs bg-red-400/10 text-red-400 flex-shrink-0">R</span>}
        {party !== 'D' && party !== 'R' && <span className="px-2 py-0.5 rounded text-xs bg-gray-400/10 text-gray-400 flex-shrink-0">I</span>}
      </div>
      <div className="flex items-center gap-2 text-xs text-[#555]">
        <span className={chamber === 'senate' ? 'text-purple-400' : 'text-yellow-400'}>
          {chamber === 'senate' ? 'Senate' : 'House'}
        </span>
        {state && <span>· {state}</span>}
        {tradeCount !== undefined && <span>· {tradeCount} trades</span>}
      </div>
    </Link>
  )
}
