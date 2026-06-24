'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface PartyBreakdownData {
  D: { buys: number; sells: number }
  R: { buys: number; sells: number }
  other: { buys: number; sells: number }
}

export default function PartyBreakdownChart({ data }: { data: PartyBreakdownData }) {
  const chartData = [
    { party: 'Democrat', buys: data.D.buys, sells: data.D.sells },
    { party: 'Republican', buys: data.R.buys, sells: data.R.sells },
    { party: 'Other', buys: data.other.buys, sells: data.other.sells },
  ]

  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={chartData} barGap={2}>
        <XAxis dataKey="party" tick={{ fill: '#444', fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: '#444', fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip
          contentStyle={{ background: '#111', border: '1px solid #1f1f1f', borderRadius: 8, color: '#f4f4f4' }}
          labelStyle={{ color: '#666' }}
          cursor={{ fill: '#1a1a1a' }}
        />
        <Legend wrapperStyle={{ fontSize: 12, color: '#666' }} />
        <Bar dataKey="buys" name="Buys" fill="#60a5fa" radius={[3, 3, 0, 0]} />
        <Bar dataKey="sells" name="Sells" fill="#f87171" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
