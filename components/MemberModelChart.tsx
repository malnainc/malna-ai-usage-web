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

const RANK_MEDALS: Record<number, string> = { 1: '1st', 2: '2nd', 3: '3rd' }

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
      {payload
        .filter((p) => p.value > 0)
        .reverse()
        .map((p) => (
          <div key={p.dataKey} className="flex items-center justify-between gap-4 py-0.5">
            <span className="flex items-center gap-1.5">
              <span
                className="inline-block w-2 h-2 rounded-full"
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

function RankLabel(props: {
  x?: number
  y?: number
  width?: number
  value?: number
  rank?: number
  isTop?: boolean
}) {
  const { x = 0, y = 0, width = 0, rank, isTop } = props
  if (!rank) return null
  const cx = x + width / 2
  const medal = RANK_MEDALS[rank]
  return (
    <g>
      {isTop && (
        <text x={cx} y={y - 22} textAnchor="middle" fontSize={18} dominantBaseline="middle">
          👑
        </text>
      )}
      {medal && (
        <text
          x={cx}
          y={y - 6}
          textAnchor="middle"
          fontSize={10}
          fontWeight="700"
          fill={rank === 1 ? '#d97706' : rank === 2 ? '#64748b' : '#92400e'}
        >
          {medal}
        </text>
      )}
    </g>
  )
}

export function MemberModelChart({ ranking }: { ranking: RankingEntry[] }) {
  const hasBreakdown = ranking.some((r) => r.model_families.length > 0)
  if (!hasBreakdown) return null

  const sorted = [...ranking].filter((r) => r.total_tokens > 0).reverse()

  const chartData = sorted.map((r, i) => {
    const rank = sorted.length - i
    const row: Record<string, string | number> = { name: r.member_name, rank }
    for (const f of r.model_families) {
      row[f.family] = f.tokens
    }
    return row
  })

  const familiesUsed = MODEL_FAMILY_ORDER.filter((f) =>
    ranking.some((r) => r.model_families.some((mf) => mf.family === f && mf.tokens > 0)),
  )

  const topFamily = familiesUsed[familiesUsed.length - 1]

  return (
    <div>
      <ResponsiveContainer width="100%" height={320}>
        <BarChart
          data={chartData}
          margin={{ top: 40, right: 8, bottom: 0, left: 0 }}
          barCategoryGap="28%"
        >
          <defs>
            {chartData.map((d, i) => {
              const rank = d.rank as number
              const isTop = rank === 1
              const id = `bar-grad-${i}`
              return (
                <linearGradient key={id} id={id} x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="0%"
                    stopColor={isTop ? '#fbbf24' : rank === 2 ? '#94a3b8' : rank === 3 ? '#b45309' : '#00c4cc'}
                    stopOpacity={isTop ? 0.9 : 0.7}
                  />
                  <stop
                    offset="100%"
                    stopColor={isTop ? '#f59e0b' : rank === 2 ? '#64748b' : rank === 3 ? '#92400e' : '#2563eb'}
                    stopOpacity={1}
                  />
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

          {familiesUsed.map((f) => {
            const isTopStack = f === topFamily
            return (
              <Bar
                key={f}
                dataKey={f}
                stackId="a"
                radius={isTopStack ? [6, 6, 0, 0] : [0, 0, 0, 0]}
                label={
                  isTopStack
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    ? (props: any) => {
                        const d = chartData[props.index ?? 0]
                        return (
                          <RankLabel
                            x={Number(props.x)}
                            y={Number(props.y)}
                            width={Number(props.width)}
                            rank={d?.rank as number}
                            isTop={(d?.rank as number) === 1}
                          />
                        )
                      }
                    : false
                }
              >
                {chartData.map((d, i) => (
                  <Cell
                    key={i}
                    fill={
                      isTopStack
                        ? `url(#bar-grad-${i})`
                        : COLORS[f]
                    }
                    opacity={isTopStack ? 1 : 0.85}
                  />
                ))}
              </Bar>
            )
          })}
        </BarChart>
      </ResponsiveContainer>

      {/* 凡例 */}
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-1 px-1">
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
