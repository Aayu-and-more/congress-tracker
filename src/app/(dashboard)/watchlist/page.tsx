'use client'

import { useEffect, useState } from 'react'
import { getWatchlist } from '@/lib/watchlist'
import TradeRow from '@/components/TradeRow'
import Link from 'next/link'

export default function WatchlistPage() {
  const [trades, setTrades] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [watchlist, setWatchlist] = useState<{ members: string[], tickers: string[] }>({ members: [], tickers: [] })

  useEffect(() => {
    const wl = getWatchlist()
    setWatchlist(wl)

    if (wl.members.length === 0 && wl.tickers.length === 0) {
      setLoading(false)
      return
    }

    // Fetch trades for all watched items
    const fetches: Promise<any[]>[] = []

    // Fetch by ticker
    for (const ticker of wl.tickers) {
      fetches.push(
        fetch(`/api/trades?ticker=${encodeURIComponent(ticker)}&limit=20`)
          .then(r => r.json())
          .then(d => d.trades ?? [])
          .catch(() => [])
      )
    }

    // Fetch by memberId — need to first get member IDs from slugs
    for (const slug of wl.members) {
      fetches.push(
        fetch(`/api/members?q=${encodeURIComponent(slug)}`)
          .then(r => r.json())
          .then(d => {
            const member = (d.members ?? []).find((m: any) => m.slug === slug)
            if (!member) return []
            return fetch(`/api/trades?memberId=${member.id}&limit=20`)
              .then(r => r.json())
              .then(d2 => d2.trades ?? [])
              .catch(() => [])
          })
          .catch(() => [])
      )
    }

    Promise.all(fetches).then(results => {
      // Flatten, dedupe by id, sort by date
      const all = results.flat()
      const seen = new Set<string>()
      const unique = all.filter(t => {
        if (seen.has(t.id)) return false
        seen.add(t.id)
        return true
      })
      unique.sort((a, b) => {
        const da = a.transactionDate ? new Date(a.transactionDate).getTime() : 0
        const db = b.transactionDate ? new Date(b.transactionDate).getTime() : 0
        return db - da
      })
      setTrades(unique)
      setLoading(false)
    })
  }, [])

  const isEmpty = watchlist.members.length === 0 && watchlist.tickers.length === 0

  return (
    <div className="p-6 md:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#f4f4f4]" style={{ fontFamily: 'var(--font-heading)' }}>
          Watchlist
        </h1>
        <p className="text-[#666] text-sm mt-1">
          {isEmpty
            ? 'No items watched yet'
            : `${watchlist.members.length} members · ${watchlist.tickers.length} tickers`}
        </p>
      </div>

      {isEmpty ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">☆</div>
          <div className="text-[#444] text-sm mb-4">Your watchlist is empty</div>
          <p className="text-[#333] text-xs max-w-xs mx-auto">
            Star members on the <Link href="/members" className="text-blue-400 hover:underline">Members</Link> page or
            tickers on any <Link href="/" className="text-blue-400 hover:underline">trade row</Link> to track them here.
          </p>
        </div>
      ) : loading ? (
        <div className="text-[#444] text-sm py-12 text-center">Loading watchlist trades...</div>
      ) : trades.length === 0 ? (
        <div className="text-[#444] text-sm py-12 text-center">No trades found for your watched items.</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[#1f1f1f]">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#1f1f1f]">
                {['Ticker', 'Asset', 'Type', 'Amount', 'Member', 'Chamber', 'Date'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-[#555] uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {trades.map(trade => <TradeRow key={trade.id} trade={trade} />)}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
