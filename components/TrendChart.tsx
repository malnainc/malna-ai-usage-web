'use client'

import {
  LineChart,
  Line,
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
    return <p className="text-sm text-gray-500">データなし。</p>
  }
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={chart} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
        <XAxis dataKey="month" fontSize={12} />
        <YAxis fontSize={12} />
        <Tooltip />
        <Line type="monotone" dataKey="億" stroke="#2563eb" strokeWidth={2} dot />
      </LineChart>
    </ResponsiveContainer>
  )
}
