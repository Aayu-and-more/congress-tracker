'use client'

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

interface DataPoint {
  date: string
  value: number
}

export default function PerformanceChart({ data }: { data: DataPoint[] }) {
  if (!data || data.length === 0) {
    return <div className="h-32 flex items-center justify-center text-[#444] text-sm">No performance data</div>
  }
  return (
    <ResponsiveContainer width="100%" height={120}>
      <LineChart data={data}>
        <XAxis dataKey="date" tick={{ fill: '#444', fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: '#444', fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip
          contentStyle={{ background: '#111', border: '1px solid #1f1f1f', borderRadius: 8, color: '#f4f4f4' }}
          labelStyle={{ color: '#666' }}
        />
        <Line type="monotone" dataKey="value" stroke="#60a5fa" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  )
}
