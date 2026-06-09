'use client'

import { useEffect, useState } from 'react'

interface PriceData {
  available: boolean
  current?: number
  prevClose?: number
  changePercent?: number
}

export default function PriceBadge({ ticker }: { ticker: string }) {
  const [data, setData] = useState<PriceData | null>(null)

  useEffect(() => {
    if (!ticker) return
    fetch(`/api/price/${encodeURIComponent(ticker)}`)
      .then(r => r.json())
      .then(setData)
      .catch(() => {})
  }, [ticker])

  if (!data || !data.available) return null

  const isUp = (data.changePercent ?? 0) >= 0
  return (
    <span className={`ml-2 text-xs font-mono px-1.5 py-0.5 rounded ${
      isUp ? 'bg-emerald-400/10 text-emerald-400' : 'bg-red-400/10 text-red-400'
    }`}>
      ${data.current?.toFixed(2)} {isUp ? '▲' : '▼'}{Math.abs(data.changePercent ?? 0)}%
    </span>
  )
}
