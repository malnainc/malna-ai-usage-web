'use client'

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'
import type { TrendRow } from '@/lib/aggregate'

export function TrendChart({ data }: { data: TrendRow[] }) {
  const chart = data.map((d) => ({
    month: d.month,
    億: Math.round((d.total_tokens / 100_000_000) * 100) / 100,
  }))
  if (chart.length === 0) {
    return <p className="text-sm text-muted">データなし。</p>
  }
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={chart} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
        <defs>
          <linearGradient id="brandFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#00c4cc" stopOpacity={0.25} />
            <stop offset="100%" stopColor="#00c4cc" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#eef1f3" vertical={false} />
        <XAxis dataKey="month" fontSize={12} stroke="#9aa0a6" tickLine={false} axisLine={false} />
        <YAxis fontSize={12} stroke="#9aa0a6" tickLine={false} axisLine={false} width={32} />
        <Tooltip
          contentStyle={{ borderRadius: 12, border: '1px solid #e6e8eb', fontSize: 12 }}
        />
        <Area type="monotone" dataKey="億" stroke="#00c4cc" strokeWidth={2.5} fill="url(#brandFill)" dot={{ r: 3, fill: '#00c4cc' }} />
      </AreaChart>
    </ResponsiveContainer>
  )
}
