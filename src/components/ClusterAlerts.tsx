'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface ClusterMember {
  name: string
  party: string | null
  slug: string
}

interface Cluster {
  ticker: string
  type: 'buy' | 'sell' | 'mixed'
  memberCount: number
  tradeCount: number
  windowStart: string
  windowEnd: string
  members: ClusterMember[]
  daysAgo: number
}

export default function ClusterAlerts() {
  const [clusters, setClusters] = useState<Cluster[] | null>(null)

  useEffect(() => {
    fetch('/api/clusters')
      .then(r => r.json())
      .then(d => setClusters(d.clusters))
      .catch(() => setClusters([]))
  }, [])

  if (!clusters || clusters.length === 0) return null

  return (
    <div className="mb-6 bg-[#0d0d0d] border border-[#1a1a1a] rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-[#1a1a1a] flex items-center justify-between">
        <span className="text-xs font-semibold text-[#f4f4f4] uppercase tracking-wider">⚡ Trading Clusters</span>
        <span className="text-xs text-[#555]">3+ members in the same stock within 14 days</span>
      </div>
      {clusters.map((cluster, i) => {
        const dotColor =
          cluster.type === 'buy'
            ? 'bg-emerald-400'
            : cluster.type === 'sell'
            ? 'bg-red-400'
            : 'bg-purple-400'

        const badgeClass =
          cluster.type === 'buy'
            ? 'bg-emerald-400/10 text-emerald-400'
            : cluster.type === 'sell'
            ? 'bg-red-400/10 text-red-400'
            : 'bg-purple-400/10 text-purple-400'

        const badgeLabel =
          cluster.type === 'buy'
            ? 'BUY CLUSTER'
            : cluster.type === 'sell'
            ? 'SELL CLUSTER'
            : 'MIXED'

        const displayNames = cluster.members.slice(0, 3).map(m => m.name)
        const remaining = cluster.memberCount - displayNames.length
        const membersLabel =
          remaining > 0
            ? displayNames.join(', ') + ` & ${remaining} more`
            : displayNames.join(', ')

        return (
          <div
            key={`${cluster.ticker}-${i}`}
            className="px-4 py-2.5 flex items-center gap-3 border-b border-[#1a1a1a] last:border-0 flex-wrap"
          >
            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${dotColor}`} />
            <Link
              href={`/ticker/${cluster.ticker}`}
              className="font-mono font-semibold text-sm text-[#f4f4f4] hover:text-blue-400 transition-colors flex-shrink-0"
            >
              {cluster.ticker}
            </Link>
            <span className="text-xs text-[#666] bg-[#1a1a1a] px-2 py-0.5 rounded flex-shrink-0">
              {cluster.memberCount} members
            </span>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded flex-shrink-0 ${badgeClass}`}>
              {badgeLabel}
            </span>
            <span className="text-xs text-[#555] min-w-0 truncate flex-1">{membersLabel}</span>
            <span className="text-xs text-[#555] flex-shrink-0">{cluster.daysAgo}d ago</span>
          </div>
        )
      })}
    </div>
  )
}
