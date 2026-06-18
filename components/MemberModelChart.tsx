'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { fmtTokens } from '@/lib/format'
import { MODEL_LABELS as LABELS, MODEL_COLORS as COLORS } from '@/lib/modelMeta'
import { MODEL_FAMILY_ORDER } from '@/lib/aggregate'
import type { ModelFamily, RankingEntry } from '@/lib/types'

const PODIUM = [
  { rank: 1, label: '1st', bg: 'linear-gradient(135deg,#fbbf24,#d97706)', text: '#7c3a00', ring: '#f59e0b' },
  { rank: 2, label: '2nd', bg: 'linear-gradient(135deg,#e2e8f0,#94a3b8)', text: '#1e293b', ring: '#94a3b8' },
  { rank: 3, label: '3rd', bg: 'linear-gradient(135deg,#fde68a,#b45309)', text: '#451a03', ring: '#b45309' },
]

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ dataKey: string; value: number }>
  label?: string
}) {
  if (!active || !payload?.length) return null
  const total = payload.reduce((s, p) => s + (p.value ?? 0), 0)
  return (
    <div className="rounded-xl border border-border bg-surface px-3 py-2 text-xs shadow-lg min-w-[150px]">
      <div className="font-bold mb-2 text-sm">{label}</div>
      {[...payload]
        .filter((p) => p.value > 0)
        .reverse()
        .map((p) => (
          <div key={p.dataKey} className="flex items-center justify-between gap-4 py-0.5">
            <span className="flex items-center gap-1.5">
              <span
                className="inline-block w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: COLORS[p.dataKey as ModelFamily] }}
              />
              {LABELS[p.dataKey as ModelFamily]}
            </span>
            <span className="tabular-nums text-muted">{fmtTokens(p.value)}</span>
          </div>
        ))}
      <div className="border-t border-border mt-2 pt-2 flex justify-between gap-4 font-bold">
        <span>合計</span>
        <span className="tabular-nums">{fmtTokens(total)}</span>
      </div>
    </div>
  )
}

export function MemberModelChart({ ranking }: { ranking: RankingEntry[] }) {
  const hasBreakdown = ranking.some((r) => r.model_families.length > 0)
  if (!hasBreakdown) return null

  const sorted = [...ranking].filter((r) => r.total_tokens > 0)
  // sorted[0] = 1位（最多）, sorted[1] = 2位, ...

  const chartData = [...sorted].reverse().map((r) => {
    const row: Record<string, string | number> = { name: r.member_name }
    for (const f of r.model_families) {
      row[f.family] = f.tokens
    }
    return row
  })

  const familiesUsed = MODEL_FAMILY_ORDER.filter((f) =>
    sorted.some((r) => r.model_families.some((mf) => mf.family === f && mf.tokens > 0)),
  )

  const rankIndex = Object.fromEntries(sorted.map((r, i) => [r.member_name, i]))

  return (
    <div className="space-y-4">
      {/* ポジウム */}
      <div className="flex gap-3 justify-center flex-wrap">
        {PODIUM.map(({ rank, label, bg, text, ring }) => {
          const entry = sorted[rank - 1]
          if (!entry) return null
          return (
            <div
              key={rank}
              className="flex flex-col items-center gap-1 rounded-2xl px-4 py-3 min-w-[100px] shadow-md"
              style={{ background: bg, outline: `2px solid ${ring}`, outlineOffset: '1px' }}
            >
              <span
                className="text-2xl font-black tracking-tight"
                style={{ color: text }}
              >
                {label}
              </span>
              <span
                className="text-sm font-bold leading-tight text-center"
                style={{ color: text }}
              >
                {entry.member_name}
              </span>
              <span
                className="text-xs tabular-nums opacity-80"
                style={{ color: text }}
              >
                {fmtTokens(entry.total_tokens)}
              </span>
            </div>
          )
        })}
      </div>

      {/* バーチャート */}
      <ResponsiveContainer width="100%" height={260}>
        <BarChart
          data={chartData}
          margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
          barCategoryGap="28%"
        >
          <defs>
            {[...sorted].reverse().map((r, i) => {
              const rank = (rankIndex[r.member_name] ?? 99) + 1
              const id = `bg-${i}`
              const c1 = rank === 1 ? '#fbbf24' : rank === 2 ? '#e2e8f0' : rank === 3 ? '#fde68a' : '#60a5fa'
              const c2 = rank === 1 ? '#d97706' : rank === 2 ? '#94a3b8' : rank === 3 ? '#b45309' : '#2563eb'
              return (
                <linearGradient key={id} id={id} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={c1} stopOpacity={0.95} />
                  <stop offset="100%" stopColor={c2} stopOpacity={1} />
                </linearGradient>
              )
            })}
          </defs>

          <XAxis
            dataKey="name"
            fontSize={11}
            stroke="#9aa0a6"
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            fontSize={11}
            stroke="#9aa0a6"
            tickLine={false}
            axisLine={false}
            width={38}
            tickFormatter={(v: number) => {
              if (v >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(1)}B`
              if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(0)}M`
              if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K`
              return String(v)
            }}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.04)' }} />

          {familiesUsed.map((f, fi) => {
            const isTopStack = fi === familiesUsed.length - 1
            return (
              <Bar
                key={f}
                dataKey={f}
                stackId="a"
                fill={COLORS[f]}
                radius={isTopStack ? [5, 5, 0, 0] : [0, 0, 0, 0]}
              >
                {isTopStack &&
                  [...sorted].reverse().map((r, i) => (
                    <Cell key={i} fill={`url(#bg-${i})`} />
                  ))}
              </Bar>
            )
          })}
        </BarChart>
      </ResponsiveContainer>

      {/* 凡例 */}
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 px-1">
        {familiesUsed.map((f) => (
          <span key={f} className="flex items-center gap-1.5 text-xs text-muted">
            <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[f] }} />
            {LABELS[f]}
          </span>
        ))}
      </div>
    </div>
  )
}
