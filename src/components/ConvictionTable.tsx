'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

type ConvictionTicker = {
  ticker: string
  score: number
  uniqueMembers: number
  bipartisan: boolean
  recentCount: number
  avgAmount: number
  topBuyers: { name: string; party: string; slug: string }[]
}

type ApiResponse = {
  tickers: ConvictionTicker[]
  generatedAt: string
}

export default function ConvictionTable() {
  const [data, setData] = useState<ApiResponse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/conviction')
      .then(r => r.json())
      .then(d => {
        setData(d)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="text-[#444] text-sm text-center py-8">Calculating signals...</div>
    )
  }

  if (!data || data.tickers.length === 0) {
    return (
      <div className="text-[#444] text-sm text-center py-8">No buy signals in the last 30 days.</div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-[#1f1f1f]">
      <table className="w-full">
        <thead>
          <tr className="border-b border-[#1f1f1f]">
            <th className="px-4 py-3 text-left text-xs font-medium text-[#555] uppercase tracking-wider">Rank</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-[#555] uppercase tracking-wider">Ticker</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-[#555] uppercase tracking-wider">Score</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-[#555] uppercase tracking-wider">Members</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-[#555] uppercase tracking-wider">Bipartisan</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-[#555] uppercase tracking-wider">Recent (14d)</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-[#555] uppercase tracking-wider">Top Buyers</th>
          </tr>
        </thead>
        <tbody>
          {data.tickers.map((t, i) => (
            <tr key={t.ticker} className="border-b border-[#1a1a1a] hover:bg-[#111111] transition-colors">
              <td className="px-4 py-3 text-sm text-[#555]">{i + 1}</td>
              <td className="px-4 py-3 text-sm">
                <Link
                  href={`/ticker/${t.ticker}`}
                  className="font-mono font-semibold text-[#f4f4f4] hover:text-blue-400 transition-colors"
                >
                  {t.ticker}
                </Link>
              </td>
              <td className="px-4 py-3 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-[#f4f4f4] w-8 text-right tabular-nums">{t.score}</span>
                  <div className="flex-1 min-w-[80px] h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-400 rounded-full"
                      style={{ width: `${t.score}%` }}
                    />
                  </div>
                </div>
              </td>
              <td className="px-4 py-3 text-sm text-[#f4f4f4]">{t.uniqueMembers}</td>
              <td className="px-4 py-3 text-sm">
                {t.bipartisan && (
                  <span className="px-2 py-0.5 rounded text-xs bg-purple-400/10 text-purple-400">
                    🟣 Bipartisan
                  </span>
                )}
              </td>
              <td className="px-4 py-3 text-sm text-[#f4f4f4]">{t.recentCount}</td>
              <td className="px-4 py-3 text-sm text-[#666]">
                {t.topBuyers.map((b, idx) => (
                  <span key={b.slug}>
                    {idx > 0 && ', '}
                    <Link
                      href={`/member/${b.slug}`}
                      className="hover:text-[#f4f4f4] transition-colors"
                    >
                      {b.name}
                    </Link>
                  </span>
                ))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
