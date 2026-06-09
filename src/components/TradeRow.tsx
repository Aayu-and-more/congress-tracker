import Link from 'next/link'

interface Trade {
  id: string
  ticker: string | null
  assetName: string
  tradeType: string
  amount: string
  transactionDate: string | Date | null
  filedLate: boolean
  source: string
  member: {
    name: string
    party: string | null
    chamber: string
    slug: string
  }
}

function formatDate(d: string | Date | null): string {
  if (!d) return '—'
  const date = typeof d === 'string' ? new Date(d) : d
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function tradeTypeBadge(type: string) {
  const isPurchase = type === 'purchase'
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
      isPurchase ? 'bg-emerald-400/10 text-emerald-400' : 'bg-red-400/10 text-red-400'
    }`}>
      {isPurchase ? 'BUY' : 'SELL'}
    </span>
  )
}

function partyColor(party: string | null): string {
  if (party === 'D') return 'bg-blue-400'
  if (party === 'R') return 'bg-red-400'
  return 'bg-gray-400'
}

function chamberBadge(chamber: string) {
  const isSenate = chamber === 'senate'
  return (
    <span className={`px-1.5 py-0.5 rounded text-xs ${
      isSenate ? 'bg-purple-400/10 text-purple-400' : 'bg-yellow-400/10 text-yellow-400'
    }`}>
      {isSenate ? 'SEN' : 'REP'}
    </span>
  )
}

export default function TradeRow({ trade }: { trade: Trade }) {
  return (
    <tr className="border-b border-[#1a1a1a] hover:bg-[#111111] transition-colors">
      <td className="px-4 py-3">
        {trade.ticker ? (
          <Link href={`/ticker/${trade.ticker}`} className="font-mono font-semibold text-[#f4f4f4] hover:text-blue-400 transition-colors text-sm">
            {trade.ticker}
          </Link>
        ) : (
          <span className="text-[#444] text-sm">—</span>
        )}
      </td>
      <td className="px-4 py-3 max-w-[200px]">
        <span className="text-sm text-[#999] truncate block" title={trade.assetName}>
          {trade.assetName}
        </span>
      </td>
      <td className="px-4 py-3">{tradeTypeBadge(trade.tradeType)}</td>
      <td className="px-4 py-3 text-sm text-[#999]">{trade.amount}</td>
      <td className="px-4 py-3">
        <Link href={`/member/${trade.member.slug}`} className="flex items-center gap-2 hover:text-blue-400 transition-colors">
          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${partyColor(trade.member.party)}`} />
          <span className="text-sm text-[#f4f4f4] truncate max-w-[140px]">{trade.member.name}</span>
        </Link>
      </td>
      <td className="px-4 py-3">{chamberBadge(trade.member.chamber)}</td>
      <td className="px-4 py-3 text-sm text-[#666]">
        <span>{formatDate(trade.transactionDate)}</span>
        {trade.filedLate && (
          <span className="ml-2 px-1.5 py-0.5 rounded text-xs bg-orange-400/10 text-orange-400">LATE</span>
        )}
      </td>
    </tr>
  )
}
