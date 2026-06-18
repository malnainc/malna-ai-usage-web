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

const RANK_STYLE = [
  { num: '#f59e0b', bar: 'linear-gradient(90deg,#f59e0b,#fbbf24)', label: 'TOP' },
  { num: '#cbd5e1', bar: 'linear-gradient(90deg,#94a3b8,#cbd5e1)', label: '2ND' },
  { num: '#cd7f32', bar: 'linear-gradient(90deg,#92400e,#d97706)', label: '3RD' },
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
              <span className="inline-block w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[p.dataKey as ModelFamily] }} />
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
  const maxTokens = sorted[0]?.total_tokens ?? 1

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
    <div className="space-y-6">

      {/* ダークリーダーボード */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: 'linear-gradient(135deg,#0f172a 0%,#1e293b 100%)' }}
      >
        {sorted.slice(0, 3).map((entry, i) => {
          const style = RANK_STYLE[i]
          const pct = (entry.total_tokens / maxTokens) * 100
          const isFirst = i === 0
          return (
            <div
              key={entry.member_email}
              className="relative px-5 py-4 flex items-center gap-4"
              style={isFirst ? { borderBottom: '1px solid rgba(255,255,255,0.06)' } : { borderBottom: '1px solid rgba(255,255,255,0.06)' }}
            >
              {/* 左アクセントライン */}
              <div
                className="absolute left-0 top-0 bottom-0 w-1 rounded-r"
                style={{ background: style.bar }}
              />

              {/* ランク番号 */}
              <span
                className="shrink-0 font-black tabular-nums leading-none"
                style={{
                  fontSize: isFirst ? 36 : 24,
                  color: style.num,
                  minWidth: 36,
                  textAlign: 'right',
                }}
              >
                {i + 1}
              </span>

              {/* 名前＋バー */}
              <div className="flex-1 min-w-0 space-y-1.5">
                <div className="flex items-baseline justify-between gap-2">
                  <span
                    className="font-bold truncate"
                    style={{
                      color: isFirst ? '#f8fafc' : '#94a3b8',
                      fontSize: isFirst ? 16 : 13,
                    }}
                  >
                    {entry.member_name}
                  </span>
                  <span
                    className="shrink-0 tabular-nums font-semibold"
                    style={{ color: style.num, fontSize: isFirst ? 15 : 12 }}
                  >
                    {fmtTokens(entry.total_tokens)}
                  </span>
                </div>
                <div className="h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.07)' }}>
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${pct}%`, background: style.bar }}
                  />
                </div>
              </div>

              {/* ラベル */}
              {isFirst && (
                <span
                  className="shrink-0 text-[10px] font-black tracking-widest px-2 py-0.5 rounded-full"
                  style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b', letterSpacing: '0.15em' }}
                >
                  {style.label}
                </span>
              )}
            </div>
          )
        })}
      </div>

      {/* バーチャート */}
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }} barCategoryGap="28%">
          <defs>
            {[...sorted].reverse().map((r, i) => {
              const rank = rankMap[r.member_name] ?? 99
              const s = RANK_STYLE[rank]
              const from = s ? s.bar.match(/#[0-9a-f]{6}/gi)?.[0] ?? '#60a5fa' : '#60a5fa'
              const to   = s ? s.bar.match(/#[0-9a-f]{6}/gi)?.[1] ?? '#2563eb' : '#2563eb'
              return (
                <linearGradient key={i} id={`g-${i}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={from} stopOpacity={0.9} />
                  <stop offset="100%" stopColor={to} stopOpacity={1} />
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
            const isTopStack = fi === familiesUsed.length - 1
            return (
              <Bar key={f} dataKey={f} stackId="a" fill={COLORS[f]} radius={isTopStack ? [5, 5, 0, 0] : [0, 0, 0, 0]}>
                {isTopStack && [...sorted].reverse().map((r, i) => (
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
