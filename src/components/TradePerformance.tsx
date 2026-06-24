'use client'

import { useEffect, useState } from 'react'

interface PerformanceData {
  available: boolean
  ticker?: string
  tradesAnalyzed?: number
  avgCurrentReturn?: number
  avg30dReturn?: number | null
  bestReturn?: number
  worstReturn?: number
  currentPrice?: number
  reason?: string
}

function formatReturn(value: number): string {
  const sign = value >= 0 ? '+' : ''
  return `${sign}${value.toFixed(1)}%`
}

function returnColor(value: number): string {
  return value >= 0 ? 'text-emerald-400' : 'text-red-400'
}

interface Props {
  ticker: string
}

export default function TradePerformance({ ticker }: Props) {
  const [data, setData] = useState<PerformanceData | null>(null)

  useEffect(() => {
    fetch(`/api/performance/${ticker}`)
      .then(r => r.json())
      .then(setData)
      .catch(() => {})
  }, [ticker])

  if (!data) return null
  if (!data.available) return null

  const { tradesAnalyzed, avgCurrentReturn, avg30dReturn, bestReturn, currentPrice } = data

  const stats = [
    {
      label: 'Avg Return Since Buy',
      value: avgCurrentReturn !== undefined ? formatReturn(avgCurrentReturn) : '—',
      color: avgCurrentReturn !== undefined ? returnColor(avgCurrentReturn) : 'text-[#666]',
    },
    {
      label: 'Avg 30-day Return',
      value: avg30dReturn !== null && avg30dReturn !== undefined ? formatReturn(avg30dReturn) : '—',
      color: avg30dReturn !== null && avg30dReturn !== undefined ? returnColor(avg30dReturn) : 'text-[#666]',
    },
    {
      label: 'Best Single Trade',
      value: bestReturn !== undefined ? formatReturn(bestReturn) : '—',
      color: bestReturn !== undefined ? returnColor(bestReturn) : 'text-[#666]',
    },
  ]

  return (
    <div className="mt-8 mb-6">
      <h2 className="text-lg font-semibold text-[#f4f4f4] mb-1" style={{ fontFamily: 'var(--font-heading)' }}>
        Congress Performance on {ticker}
      </h2>
      <p className="text-xs text-[#555] mb-4">Estimated returns based on buy dates vs current price</p>
      <div className="grid grid-cols-3 gap-4">
        {stats.map(s => (
          <div key={s.label} className="bg-[#111111] border border-[#1f1f1f] rounded-xl p-4">
            <div className={`text-2xl font-bold ${s.color}`} style={{ fontFamily: 'var(--font-heading)' }}>
              {s.value}
            </div>
            <div className="text-xs text-[#555] mt-1">{s.label}</div>
          </div>
        ))}
      </div>
      <p className="text-xs text-[#444] mt-3">
        Based on ~{tradesAnalyzed} buys · Current price ${currentPrice?.toFixed(2)}
      </p>
      <p className="text-xs text-[#333] mt-1">
        Returns estimated from disclosed trade dates vs Finnhub daily close. Not financial advice.
      </p>
    </div>
  )
}
