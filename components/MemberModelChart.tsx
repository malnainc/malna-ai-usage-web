'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from 'recharts'
import { fmtTokens } from '@/lib/format'
import { MODEL_LABELS as LABELS, MODEL_COLORS as COLORS } from '@/lib/modelMeta'
import { MODEL_FAMILY_ORDER } from '@/lib/aggregate'
import type { ModelFamily, RankingEntry } from '@/lib/types'

const RANK_COLOR: Record<number, string> = {
  1: '#f59e0b',
  2: '#94a3b8',
  3: '#b45309',
}

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTick(props: any & { rankMap: Record<string, number> }) {
  const { rankMap } = props
  const x = Number(props.x ?? 0)
  const y = Number(props.y ?? 0)
  const payload = props.payload as { value: string } | undefined
  const name = payload?.value ?? ''
  const rank = rankMap[name]
  const medal = rank === 1 ? '1st' : rank === 2 ? '2nd' : rank === 3 ? '3rd' : null
  const color = rank ? (RANK_COLOR[rank] ?? '#9aa0a6') : '#9aa0a6'

  return (
    <g transform={`translate(${x},${y})`}>
      {medal && (
        <text
          x={0}
          y={-2}
          textAnchor="middle"
          fontSize={10}
          fontWeight="800"
          fill={color}
          letterSpacing={0.5}
        >
          {medal}
        </text>
      )}
      <text
        x={0}
        y={medal ? 12 : 6}
        textAnchor="middle"
        fontSize={11}
        fill={rank === 1 ? '#f59e0b' : rank === 2 ? '#64748b' : rank === 3 ? '#92400e' : '#9aa0a6'}
        fontWeight={rank && rank <= 3 ? '700' : '400'}
      >
        {name}
      </text>
    </g>
  )
}

export function MemberModelChart({ ranking }: { ranking: RankingEntry[] }) {
  const hasBreakdown = ranking.some((r) => r.model_families.length > 0)
  if (!hasBreakdown) return null

  const sorted = [...ranking].filter((r) => r.total_tokens > 0).reverse()

  // rank: 右端（一番高い）が1位
  const rankMap: Record<string, number> = {}
  sorted.forEach((r, i) => {
    rankMap[r.member_name] = sorted.length - i
  })

  const chartData = sorted.map((r) => {
    const row: Record<string, string | number> = { name: r.member_name }
    for (const f of r.model_families) {
      row[f.family] = f.tokens
    }
    return row
  })

  const familiesUsed = MODEL_FAMILY_ORDER.filter((f) =>
    ranking.some((r) => r.model_families.some((mf) => mf.family === f && mf.tokens > 0)),
  )

  // 1位のbar最大値（ReferenceLine用）
  const topEntry = sorted[sorted.length - 1]
  const topTotal = topEntry?.total_tokens ?? 0

  return (
    <div>
      <ResponsiveContainer width="100%" height={320}>
        <BarChart
          data={chartData}
          margin={{ top: 16, right: 8, bottom: 24, left: 0 }}
          barCategoryGap="28%"
        >
          <defs>
            {sorted.map((r, i) => {
              const rank = rankMap[r.member_name]
              const id = `bg-${i}`
              const c1 = rank === 1 ? '#fbbf24' : rank === 2 ? '#cbd5e1' : rank === 3 ? '#d97706' : '#60a5fa'
              const c2 = rank === 1 ? '#d97706' : rank === 2 ? '#94a3b8' : rank === 3 ? '#92400e' : '#2563eb'
              return (
                <linearGradient key={id} id={id} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={c1} stopOpacity={0.9} />
                  <stop offset="100%" stopColor={c2} stopOpacity={1} />
                </linearGradient>
              )
            })}
          </defs>

          {/* 1位の高さに薄いラインで「壁」を可視化 */}
          {topTotal > 0 && (
            <ReferenceLine
              y={topTotal}
              stroke="#f59e0b"
              strokeDasharray="4 4"
              strokeWidth={1.5}
              strokeOpacity={0.5}
            />
          )}

          <XAxis
            dataKey="name"
            tickLine={false}
            axisLine={false}
            tick={(props) => <CustomTick {...props} rankMap={rankMap} />}
            height={40}
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
            const isTop = fi === familiesUsed.length - 1
            return (
              <Bar
                key={f}
                dataKey={f}
                stackId="a"
                fill={COLORS[f]}
                radius={isTop ? [5, 5, 0, 0] : [0, 0, 0, 0]}
              >
                {isTop &&
                  sorted.map((r, i) => (
                    <Cell key={i} fill={`url(#bg-${i})`} />
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
            <span
              className="inline-block w-2 h-2 rounded-full"
              style={{ backgroundColor: COLORS[f] }}
            />
            {LABELS[f]}
          </span>
        ))}
      </div>
    </div>
  )
}
