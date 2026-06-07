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

function Move({ cur, prev }: { cur: number; prev: number | undefined }) {
  if (prev === undefined) {
    return <span className="text-[10px] font-semibold text-brand-dark bg-brand-soft rounded px-1.5 py-0.5">NEW</span>
  }
  const diff = prev - cur
  if (diff > 0) return <span className="text-[10px] font-semibold text-pos">▲{diff}</span>
  if (diff < 0) return <span className="text-[10px] font-semibold text-neg">▼{-diff}</span>
  return <span className="text-[10px] text-muted">→</span>
}

export function RankingTable({
  ranking,
  prevRanks,
}: {
  ranking: RankingEntry[]
  prevRanks?: Record<string, number>
}) {
  if (ranking.length === 0) {
    return <p className="text-sm text-muted">この月のデータはまだありません。</p>
  }
  const max = Math.max(...ranking.map((r) => r.total_tokens), 1)

  return (
    <ul className="space-y-2">
      {ranking.map((r, i) => {
        const pct = Math.max(2, Math.round((r.total_tokens / max) * 100))
        const isTop = i === 0
        return (
          <li
            key={r.member_email}
            className={`relative rounded-xl px-4 py-3 overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-md ${
              isTop
                ? 'border-2 border-[#f5b301] shadow-[0_0_0_3px_rgba(245,179,1,0.12)] bg-[#fffdf5]'
                : 'border border-border'
            }`}
          >
            {/* 実績バー（背景・アニメ） */}
            <div
              className="anim-bar absolute inset-y-0 left-0 bg-brand-soft"
              style={{ width: `${pct}%`, animationDelay: `${i * 80}ms` }}
              aria-hidden
            />
            <div className="relative flex items-center gap-3">
              <RankBadge i={i} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold truncate">{r.member_name}</span>
                  {isTop && (
                    <span className="text-[10px] font-bold text-white bg-[#f5b301] rounded-full px-2 py-0.5 anim-pop">
                      TOP
                    </span>
                  )}
                  <Move cur={i} prev={prevRanks?.[r.member_email]} />
                </div>
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
