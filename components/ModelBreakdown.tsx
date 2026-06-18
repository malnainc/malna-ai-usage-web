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
import { fmtTokens, fmtCost } from '@/lib/format'
import { MODEL_LABELS as LABELS, MODEL_COLORS as COLORS } from '@/lib/modelMeta'
import type { ModelFamily, ModelFamilyUsage } from '@/lib/types'

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: Array<{ payload: { family: ModelFamily; tokens: number; cost: number } }>
}) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="rounded-xl border border-border bg-surface px-3 py-2 text-xs shadow-md">
      <div className="font-semibold mb-1">{LABELS[d.family]}</div>
      <div className="text-muted">{fmtTokens(d.tokens)}</div>
      <div className="text-muted">{fmtCost(d.cost)}</div>
    </div>
  )
}

export function ModelBreakdown({
  families,
  hasData,
  familiesPresent = [],
}: {
  families: ModelFamilyUsage[]
  hasData: boolean
  familiesPresent?: ModelFamily[]
}) {
  if (!hasData || families.length === 0) {
    return (
      <div>
        <p className="text-sm text-muted mb-3">
          この月にはモデル別の内訳データがありません。各メンバーが収集ツールを更新した翌日以降の月で表示されます。
        </p>
        {familiesPresent.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            <span className="text-xs text-muted mr-1">利用モデル:</span>
            {familiesPresent.map((f) => (
              <span
                key={f}
                className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium text-white"
                style={{ backgroundColor: COLORS[f] }}
              >
                {LABELS[f]}
              </span>
            ))}
          </div>
        )}
      </div>
    )
  }

  const total = families.reduce((s, f) => s + f.tokens, 0)
  const pct = (n: number) => (total > 0 ? (n / total) * 100 : 0)

  const chartData = families.map((f) => ({
    family: f.family,
    label: LABELS[f.family],
    tokens: f.tokens,
    cost: f.cost,
  }))

  return (
    <div className="space-y-4">
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }} barCategoryGap="28%">
          <XAxis dataKey="label" fontSize={12} stroke="#9aa0a6" tickLine={false} axisLine={false} />
          <YAxis
            fontSize={11}
            stroke="#9aa0a6"
            tickLine={false}
            axisLine={false}
            width={36}
            tickFormatter={(v: number) => {
              if (v >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(1)}B`
              if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(0)}M`
              if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K`
              return String(v)
            }}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
          <Bar dataKey="tokens" radius={[6, 6, 0, 0]}>
            {chartData.map((d) => (
              <Cell key={d.family} fill={COLORS[d.family]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* 凡例 */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {families.map((f) => (
          <div key={f.family} className="flex items-start gap-2">
            <span
              className="mt-1 inline-block h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: COLORS[f.family] }}
            />
            <div className="min-w-0">
              <div className="text-sm font-medium">
                {LABELS[f.family]}{' '}
                <span className="text-muted tabular-nums">{pct(f.tokens).toFixed(1)}%</span>
              </div>
              <div className="text-xs text-muted tabular-nums">
                {fmtTokens(f.tokens)} ／ {fmtCost(f.cost)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
