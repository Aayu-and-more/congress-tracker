'use client'

import Link from 'next/link'

interface BipartisanRow {
  ticker: string
  dBuys: number
  rBuys: number
  total: number
}

export default function BipartisanTable({ data }: { data: BipartisanRow[] }) {
  if (!data || data.length === 0) {
    return <div className="text-[#444] text-sm py-8 text-center">No bipartisan data</div>
  }
  return (
    <div className="overflow-x-auto rounded-xl border border-[#1f1f1f]">
      <table className="w-full">
        <thead>
          <tr className="border-b border-[#1f1f1f]">
            {['Ticker', 'D Buys', 'R Buys', 'Total'].map(h => (
              <th key={h} className="px-4 py-3 text-left text-xs font-medium text-[#555] uppercase tracking-wider">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map(row => (
            <tr key={row.ticker} className="border-b border-[#1a1a1a] hover:bg-[#111111] transition-colors">
              <td className="px-4 py-3">
                <Link href={`/ticker/${row.ticker}`} className="font-mono font-semibold text-[#f4f4f4] hover:text-blue-400 transition-colors text-sm">
                  {row.ticker}
                </Link>
              </td>
              <td className="px-4 py-3 text-sm text-blue-400">{row.dBuys}</td>
              <td className="px-4 py-3 text-sm text-red-400">{row.rBuys}</td>
              <td className="px-4 py-3 text-sm text-[#f4f4f4] font-medium">{row.total}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
