'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface DumpTicker {
  ticker: string
  score: number
  uniqueSellers: number
  bipartisan: boolean
  recentCount: number
  avgAmount: number
  exiting: boolean
  topSellers: { name: string; party: string | null; slug: string; chamber: string }[]
}

interface DumpWatchData {
  tickers: DumpTicker[]
  generatedAt: string
}

function formatAmount(n: number): string {
  if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`
  if (n >= 1000) return `$${(n / 1000).toFixed(0)}K`
  return `$${n}`
}

export default function DumpWatch() {
  const [data, setData] = useState<DumpWatchData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dump-watch')
      .then(r => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <p className="text-[#444] text-sm text-center py-8">Loading dump watch...</p>
    )
  }

  if (!data || data.tickers.length === 0) {
    return (
      <p className="text-[#444] text-sm text-center py-8">No significant sell clusters in the last 30 days.</p>
    )
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-red-900/30">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-red-900/20">
            <th className="text-left px-4 py-3 text-red-400/70 font-medium text-xs uppercase tracking-wider">Rank</th>
            <th className="text-left px-4 py-3 text-red-400/70 font-medium text-xs uppercase tracking-wider">Ticker</th>
            <th className="text-left px-4 py-3 text-red-400/70 font-medium text-xs uppercase tracking-wider">Dump Score</th>
            <th className="text-left px-4 py-3 text-red-400/70 font-medium text-xs uppercase tracking-wider">Sellers</th>
            <th className="text-left px-4 py-3 text-red-400/70 font-medium text-xs uppercase tracking-wider">Bipartisan</th>
            <th className="text-left px-4 py-3 text-red-400/70 font-medium text-xs uppercase tracking-wider">Recent (14d)</th>
            <th className="text-left px-4 py-3 text-red-400/70 font-medium text-xs uppercase tracking-wider">Avg Amount</th>
            <th className="text-left px-4 py-3 text-red-400/70 font-medium text-xs uppercase tracking-wider">Status</th>
            <th className="text-left px-4 py-3 text-red-400/70 font-medium text-xs uppercase tracking-wider">Top Sellers</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#1a1a1a]">
          {data.tickers.map((t, i) => (
            <tr key={t.ticker} className="hover:bg-[#161616] transition-colors">
              <td className="px-4 py-3 text-[#333] font-bold">{i + 1}</td>
              <td className="px-4 py-3">
                <Link
                  href={`/ticker/${t.ticker}`}
                  className="font-mono font-semibold text-[#f4f4f4] hover:text-red-400 transition-colors"
                >
                  {t.ticker}
                </Link>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2 min-w-[120px]">
                  <span className="text-[#f4f4f4] font-medium w-7 text-right flex-shrink-0">{t.score}</span>
                  <div className="flex-1 h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-red-400 rounded-full"
                      style={{ width: `${t.score}%` }}
                    />
                  </div>
                </div>
              </td>
              <td className="px-4 py-3 text-[#f4f4f4]">{t.uniqueSellers}</td>
              <td className="px-4 py-3">
                {t.bipartisan ? (
                  <span className="bg-red-400/10 text-red-400 text-xs font-medium px-2 py-0.5 rounded">
                    Bipartisan
                  </span>
                ) : (
                  <span className="text-[#444] text-xs">—</span>
                )}
              </td>
              <td className="px-4 py-3 text-[#f4f4f4]">{t.recentCount}</td>
              <td className="px-4 py-3 text-[#f4f4f4]">{formatAmount(t.avgAmount)}</td>
              <td className="px-4 py-3">
                {t.exiting ? (
                  <span className="bg-orange-400/10 text-orange-400 text-xs font-medium px-2 py-0.5 rounded">
                    EXITING
                  </span>
                ) : (
                  <span className="text-[#555]">Selling</span>
                )}
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-x-1.5 gap-y-0.5">
                  {t.topSellers.map((s, j) => (
                    <span key={s.slug}>
                      <Link
                        href={`/member/${s.slug}`}
                        className="text-[#666] hover:text-[#f4f4f4] transition-colors text-xs"
                      >
                        {s.name}
                      </Link>
                      {j < t.topSellers.length - 1 && (
                        <span className="text-[#333]">,</span>
                      )}
                    </span>
                  ))}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
