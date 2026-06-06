import type { RankingEntry } from '@/lib/types'
import { fmtTokens, fmtCost, fmtDelta } from '@/lib/format'

const MEDAL = ['#f5b301', '#aab1bd', '#cd7f32'] // gold / silver / bronze

function RankBadge({ i }: { i: number }) {
  const color = MEDAL[i]
  if (color) {
    return (
      <span
        className="inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold text-white shadow-sm"
        style={{ background: color }}
      >
        {i + 1}
      </span>
    )
  }
  return (
    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-brand-soft text-brand-dark text-xs font-semibold tabular-nums">
      {i + 1}
    </span>
  )
}

function Delta({ d }: { d: number | null }) {
  if (d === null) return <span className="text-muted text-xs">新規</span>
  const up = d >= 0
  const big = Math.abs(d) >= 1000
  const label = big ? (up ? '急増' : '急減') : fmtDelta(d)
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-medium tabular-nums ${up ? 'text-pos' : 'text-neg'}`}>
      <span aria-hidden>{up ? '▲' : '▼'}</span>
      {label}
    </span>
  )
}

export function RankingTable({ ranking }: { ranking: RankingEntry[] }) {
  if (ranking.length === 0) {
    return <p className="text-sm text-muted">この月のデータはまだありません。</p>
  }
  const max = Math.max(...ranking.map((r) => r.total_tokens), 1)

  return (
    <ul className="space-y-2">
      {ranking.map((r, i) => {
        const pct = Math.max(2, Math.round((r.total_tokens / max) * 100))
        return (
          <li
            key={r.member_email}
            className="relative rounded-xl border border-border px-4 py-3 overflow-hidden hover:border-brand/50 transition-colors"
          >
            {/* 実績バー（背景） */}
            <div
              className="absolute inset-y-0 left-0 bg-brand-soft"
              style={{ width: `${pct}%` }}
              aria-hidden
            />
            <div className="relative flex items-center gap-3">
              <RankBadge i={i} />
              <div className="min-w-0 flex-1">
                <div className="font-semibold truncate">{r.member_name}</div>
                <div className="text-xs text-muted truncate">
                  {r.team || '—'}　Claude {fmtCost(r.claude_cost)} / Codex {fmtCost(r.codex_cost)}
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="font-bold tabular-nums leading-tight">{fmtTokens(r.total_tokens)}</div>
                <div className="text-xs text-muted tabular-nums">{fmtCost(r.cost_usd)}</div>
              </div>
              <div className="w-20 text-right shrink-0">
                <Delta d={r.delta_pct} />
              </div>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
