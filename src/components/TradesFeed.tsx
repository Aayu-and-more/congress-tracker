'use client'

import { useState, useEffect, useCallback } from 'react'
import TradeRow from './TradeRow'

interface FiltersState {
  party: string
  chamber: string
  type: string
  ticker: string
  search: string
  from: string
  to: string
  filedLate: boolean
}

export default function TradesFeed() {
  const [trades, setTrades] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<FiltersState>({ party: '', chamber: '', type: '', ticker: '', search: '', from: '', to: '', filedLate: false })

  const buildParams = useCallback((extraPage?: number) => {
    const params = new URLSearchParams({ page: String(extraPage ?? page), limit: '50' })
    if (filters.party) params.set('party', filters.party)
    if (filters.chamber) params.set('chamber', filters.chamber)
    if (filters.type) params.set('type', filters.type)
    if (filters.ticker) params.set('ticker', filters.ticker)
    if (filters.search) params.set('search', filters.search)
    if (filters.from) params.set('from', filters.from)
    if (filters.to) params.set('to', filters.to)
    if (filters.filedLate) params.set('filedLate', 'true')
    return params
  }, [page, filters])

  const fetchTrades = useCallback(async () => {
    setLoading(true)
    const params = buildParams()
    const res = await fetch(`/api/trades?${params}`)
    const data = await res.json()
    setTrades(data.trades ?? [])
    setTotal(data.total ?? 0)
    setLoading(false)
  }, [buildParams])

  useEffect(() => { fetchTrades() }, [fetchTrades])

  const filterSelect = (key: keyof Pick<FiltersState, 'party' | 'chamber' | 'type'>, options: { value: string; label: string }[]) => (
    <select
      value={filters[key]}
      onChange={e => { setFilters(f => ({ ...f, [key]: e.target.value })); setPage(1) }}
      className="bg-[#111111] border border-[#2a2a2a] text-[#f4f4f4] text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-[#444]"
    >
      <option value="">{options[0].label}</option>
      {options.slice(1).map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  )

  function handleExport() {
    const params = buildParams(1)
    window.location.href = `/api/export?${params}`
  }

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        {filterSelect('party', [
          { value: '', label: 'All Parties' },
          { value: 'D', label: 'Democrat' },
          { value: 'R', label: 'Republican' },
        ])}
        {filterSelect('chamber', [
          { value: '', label: 'All Chambers' },
          { value: 'senate', label: 'Senate' },
          { value: 'house', label: 'House' },
        ])}
        {filterSelect('type', [
          { value: '', label: 'All Types' },
          { value: 'purchase', label: 'Purchases' },
          { value: 'sale_full', label: 'Sales (Full)' },
          { value: 'sale_partial', label: 'Sales (Partial)' },
        ])}
        <input
          type="text"
          placeholder="Filter by ticker..."
          value={filters.ticker}
          onChange={e => { setFilters(f => ({ ...f, ticker: e.target.value })); setPage(1) }}
          className="bg-[#111111] border border-[#2a2a2a] text-[#f4f4f4] placeholder-[#444] text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-[#444] w-40"
        />
        <input
          type="text"
          placeholder="Search member..."
          value={filters.search}
          onChange={e => { setFilters(f => ({ ...f, search: e.target.value })); setPage(1) }}
          className="bg-[#111111] border border-[#2a2a2a] text-[#f4f4f4] placeholder-[#444] text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-[#444] w-40"
        />
        <input
          type="date"
          value={filters.from}
          onChange={e => { setFilters(f => ({ ...f, from: e.target.value })); setPage(1) }}
          className="bg-[#111111] border border-[#2a2a2a] text-[#f4f4f4] text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-[#444] [color-scheme:dark]"
        />
        <input
          type="date"
          value={filters.to}
          onChange={e => { setFilters(f => ({ ...f, to: e.target.value })); setPage(1) }}
          className="bg-[#111111] border border-[#2a2a2a] text-[#f4f4f4] text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-[#444] [color-scheme:dark]"
        />
        <label className="flex items-center gap-2 text-sm text-[#666] cursor-pointer select-none">
          <input
            type="checkbox"
            checked={filters.filedLate}
            onChange={e => { setFilters(f => ({ ...f, filedLate: e.target.checked })); setPage(1) }}
            className="accent-orange-400 w-3.5 h-3.5"
          />
          Late only
        </label>
        <span className="text-[#444] text-sm self-center">{total.toLocaleString()} trades</span>
        <button
          onClick={handleExport}
          className="ml-auto bg-[#111111] border border-[#2a2a2a] text-[#666] hover:text-[#f4f4f4] hover:border-[#444] text-sm rounded-lg px-3 py-1.5 transition-colors"
        >
          Export CSV
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-[#444] text-sm py-12 text-center">Loading trades...</div>
      ) : trades.length === 0 ? (
        <div className="text-[#444] text-sm py-12 text-center">
          No trades found. Run <code className="bg-[#1a1a1a] px-1 rounded">POST /api/sync</code> to fetch data.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[#1f1f1f]">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#1f1f1f]">
                {['Ticker', 'Asset', 'Type', 'Amount', 'Member', 'Chamber', 'Date', 'Source'].map(h => (
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

      {/* Pagination */}
      {total > 50 && (
        <div className="flex items-center justify-between mt-4 text-sm text-[#666]">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 rounded bg-[#111111] border border-[#1f1f1f] disabled:opacity-30 hover:bg-[#1a1a1a] transition-colors"
          >← Prev</button>
          <span>Page {page} of {Math.ceil(total / 50)}</span>
          <button
            onClick={() => setPage(p => p + 1)}
            disabled={page >= Math.ceil(total / 50)}
            className="px-3 py-1.5 rounded bg-[#111111] border border-[#1f1f1f] disabled:opacity-30 hover:bg-[#1a1a1a] transition-colors"
          >Next →</button>
        </div>
      )}
    </div>
  )
}
