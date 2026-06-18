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

const RANK_ACCENT = ['#f59e0b', '#94a3b8', '#b45309']

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
  const top = sorted[0]
  const top3 = sorted.slice(0, 3)

  const chartData = [...sorted].reverse().map((r) => {
    const row: Record<string, string | number> = { name: r.member_name }
    for (const f of r.model_families) row[f.family] = f.tokens
    return row
  })

  const familiesUsed = MODEL_FAMILY_ORDER.filter((f) =>
    sorted.some((r) => r.model_families.some((mf) => mf.family === f && mf.tokens > 0)),
  )

  const rankMap = Object.fromEntries(sorted.map((r, i) => [r.member_name, i]))

  return (
    <div className="space-y-5">
      {/* リーダーボード */}
      <div className="space-y-1.5">
        {top3.map((entry, i) => {
          const pct = top.total_tokens > 0 ? (entry.total_tokens / top.total_tokens) * 100 : 0
          const accent = RANK_ACCENT[i]
          return (
            <div key={entry.member_email} className="flex items-center gap-3">
              <span
                className="shrink-0 w-6 text-center text-sm font-black tabular-nums"
                style={{ color: accent }}
              >
                {i + 1}
              </span>
              <span className="w-24 shrink-0 text-sm font-semibold truncate">{entry.member_name}</span>
              <div className="flex-1 h-2 rounded-full bg-border overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${pct}%`, backgroundColor: accent }}
                />
              </div>
              <span className="shrink-0 text-xs tabular-nums text-muted w-16 text-right">
                {fmtTokens(entry.total_tokens)}
              </span>
            </div>
          )
        })}
      </div>

      {/* バーチャート */}
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }} barCategoryGap="28%">
          <defs>
            {[...sorted].reverse().map((r, i) => {
              const rank = rankMap[r.member_name] ?? 99
              const accent = RANK_ACCENT[rank] ?? '#60a5fa'
              const end = rank === 0 ? '#d97706' : rank === 1 ? '#64748b' : rank === 2 ? '#92400e' : '#2563eb'
              return (
                <linearGradient key={i} id={`g-${i}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={accent} stopOpacity={0.9} />
                  <stop offset="100%" stopColor={end} stopOpacity={1} />
                </linearGradient>
              )
            })}
          </defs>

          <XAxis dataKey="name" fontSize={11} stroke="#9aa0a6" tickLine={false} axisLine={false} />
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
            const isTop = fi === familiesUsed.length - 1
            return (
              <Bar key={f} dataKey={f} stackId="a" fill={COLORS[f]} radius={isTop ? [5, 5, 0, 0] : [0, 0, 0, 0]}>
                {isTop &&
                  [...sorted].reverse().map((r, i) => (
                    <Cell key={i} fill={`url(#g-${i})`} />
                  ))}
              </Bar>
            )
          })}
        </BarChart>
      </ResponsiveContainer>

      {/* 凡例 */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 px-1">
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
