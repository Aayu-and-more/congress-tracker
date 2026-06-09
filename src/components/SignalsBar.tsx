'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface SignalData {
  topBought: { ticker: string; count: number }[]
  topSold: { ticker: string; count: number }[]
  sentiment: { ticker: string; buys: number; sells: number; buyVolume: number; sellVolume: number; sentiment: string }[]
}

export default function SignalsBar() {
  const [data, setData] = useState<SignalData | null>(null)

  useEffect(() => {
    fetch('/api/signals?days=90')
      .then(r => r.json())
      .then(setData)
      .catch(() => {})
  }, [])

  if (!data) return null

  return (
    <div className="mb-6 space-y-3">
      {/* Top Bought */}
      <div className="bg-[#0d1a0d] border border-emerald-900/40 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-emerald-400 text-xs font-semibold uppercase tracking-wider">🟢 Congress Buying (90 days)</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {data.topBought.slice(0, 10).map(t => (
            <Link key={t.ticker} href={`/ticker/${t.ticker}`}
              className="flex items-center gap-1.5 bg-emerald-400/10 hover:bg-emerald-400/20 border border-emerald-900/50 rounded-lg px-2.5 py-1 transition-colors">
              <span className="font-mono text-sm font-semibold text-emerald-300">{t.ticker}</span>
              <span className="text-xs text-emerald-600">{t.count}×</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Top Sold */}
      <div className="bg-[#1a0d0d] border border-red-900/40 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-red-400 text-xs font-semibold uppercase tracking-wider">🔴 Congress Selling (90 days)</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {data.topSold.slice(0, 10).map(t => (
            <Link key={t.ticker} href={`/ticker/${t.ticker}`}
              className="flex items-center gap-1.5 bg-red-400/10 hover:bg-red-400/20 border border-red-900/50 rounded-lg px-2.5 py-1 transition-colors">
              <span className="font-mono text-sm font-semibold text-red-300">{t.ticker}</span>
              <span className="text-xs text-red-700">{t.count}×</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Sentiment table for top 8 tickers */}
      <div className="bg-[#111111] border border-[#1f1f1f] rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-[#1a1a1a]">
          <span className="text-xs font-semibold text-[#666] uppercase tracking-wider">Buy/Sell Pressure — Most Traded Stocks</span>
        </div>
        <div className="divide-y divide-[#1a1a1a]">
          {data.sentiment.slice(0, 8).map(s => {
            const total = s.buys + s.sells
            const buyPct = total > 0 ? Math.round((s.buys / total) * 100) : 50
            const isLong = s.sentiment === 'bullish'
            const isShort = s.sentiment === 'bearish'
            return (
              <div key={s.ticker} className="px-4 py-2.5 flex items-center gap-4">
                <Link href={`/ticker/${s.ticker}`} className="font-mono font-semibold text-sm text-[#f4f4f4] hover:text-blue-400 transition-colors w-14 flex-shrink-0">
                  {s.ticker}
                </Link>
                {/* Buy/sell bar */}
                <div className="flex-1 flex items-center gap-2 min-w-0">
                  <div className="flex-1 h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-400 rounded-full transition-all"
                      style={{ width: `${buyPct}%` }}
                    />
                  </div>
                  <span className="text-xs text-[#555] flex-shrink-0">{buyPct}% buy</span>
                </div>
                <div className="flex items-center gap-3 text-xs flex-shrink-0">
                  <span className="text-emerald-400">{s.buys} buys</span>
                  <span className="text-red-400">{s.sells} sells</span>
                  <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                    isLong ? 'bg-emerald-400/10 text-emerald-400' :
                    isShort ? 'bg-red-400/10 text-red-400' :
                    'bg-[#1a1a1a] text-[#555]'
                  }`}>
                    {isLong ? 'Bullish' : isShort ? 'Bearish' : 'Neutral'}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
