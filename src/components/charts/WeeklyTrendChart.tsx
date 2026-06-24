'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface WeeklyTrendData {
  week: string
  purchases: number
  sales: number
}

export default function WeeklyTrendChart({ data }: { data: WeeklyTrendData[] }) {
  if (!data || data.length === 0) {
    return <div className="h-[200px] flex items-center justify-center text-[#444] text-sm">No weekly data</div>
  }
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} barGap={2}>
        <XAxis dataKey="week" tick={{ fill: '#444', fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: '#444', fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip
          contentStyle={{ background: '#111', border: '1px solid #1f1f1f', borderRadius: 8, color: '#f4f4f4' }}
          labelStyle={{ color: '#666' }}
          cursor={{ fill: '#1a1a1a' }}
        />
        <Legend wrapperStyle={{ fontSize: 12, color: '#666' }} />
        <Bar dataKey="purchases" name="Purchases" fill="#34d399" radius={[3, 3, 0, 0]} />
        <Bar dataKey="sales" name="Sales" fill="#f87171" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
