'use client'

import { fmtTokens } from '@/lib/format'
import { MODEL_COLORS as COLORS } from '@/lib/modelMeta'
import { MODEL_FAMILY_ORDER } from '@/lib/aggregate'
import type { ModelFamily, RankingEntry } from '@/lib/types'

export function MemberModelChart({ ranking }: { ranking: RankingEntry[] }) {
  const hasBreakdown = ranking.some((r) => r.model_families.length > 0)
  if (!hasBreakdown) return null

  const sorted = [...ranking].filter((r) => r.total_tokens > 0)
  const max = sorted[0]?.total_tokens ?? 1

  const familiesUsed = MODEL_FAMILY_ORDER.filter((f) =>
    sorted.some((r) => r.model_families.some((mf) => mf.family === f && mf.tokens > 0)),
  )

  return (
    <div className="space-y-2">
      {sorted.map((entry, i) => {
        const pct = (entry.total_tokens / max) * 100
        const rank = i + 1
        const isFirst = rank === 1

        return (
          <div key={entry.member_email} className="flex items-center gap-3 group">
            {/* 順位 */}
            <span
              className="w-5 shrink-0 text-right tabular-nums text-xs font-bold"
              style={{ color: rank === 1 ? '#f59e0b' : rank === 2 ? '#94a3b8' : rank === 3 ? '#cd7f32' : '#d1d5db' }}
            >
              {rank}
            </span>

            {/* 名前 */}
            <span
              className="w-28 shrink-0 truncate text-sm"
              style={{ fontWeight: isFirst ? 700 : 500, color: isFirst ? 'var(--color-foreground)' : 'var(--color-muted)' }}
            >
              {entry.member_name}
            </span>

            {/* 積み上げバー */}
            <div className="flex-1 flex h-5 rounded overflow-hidden bg-transparent">
              {familiesUsed.map((f) => {
                const fEntry = entry.model_families.find((mf) => mf.family === f)
                if (!fEntry || fEntry.tokens === 0) return null
                const w = (fEntry.tokens / max) * 100
                return (
                  <div
                    key={f}
                    style={{ width: `${w}%`, backgroundColor: COLORS[f as ModelFamily], minWidth: 2 }}
                    title={f}
                  />
                )
              })}
              {/* 残り空白 */}
              <div style={{ width: `${100 - pct}%` }} />
            </div>

            {/* トークン数 */}
            <span
              className="w-16 shrink-0 text-right tabular-nums text-xs"
              style={{ color: isFirst ? '#f59e0b' : 'var(--color-muted)', fontWeight: isFirst ? 700 : 400 }}
            >
              {fmtTokens(entry.total_tokens)}
            </span>
          </div>
        )
      })}

      {/* 凡例 */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 pt-3 pl-8">
        {familiesUsed.map((f) => (
          <span key={f} className="flex items-center gap-1.5 text-xs text-muted">
            <span className="inline-block w-2 h-2 rounded-sm" style={{ backgroundColor: COLORS[f as ModelFamily] }} />
            {f}
          </span>
        ))}
      </div>
    </div>
  )
}
