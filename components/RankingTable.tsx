import type { RankingEntry } from '@/lib/types'
import { fmtTokens, fmtCost, fmtDelta } from '@/lib/format'

function DeltaBadge({ d }: { d: number | null }) {
  if (d === null) return <span className="text-muted">—</span>
  const cls = d >= 0 ? 'text-pos' : 'text-neg'
  return <span className={`${cls} tabular-nums`}>{fmtDelta(d)}</span>
}

export function RankingTable({ ranking }: { ranking: RankingEntry[] }) {
  if (ranking.length === 0) {
    return <p className="text-sm text-muted">この月のデータはまだありません。</p>
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-muted">
            <th className="py-2 pr-3 font-medium">#</th>
            <th className="pr-3 font-medium">メンバー</th>
            <th className="pr-3 font-medium">チーム</th>
            <th className="pr-3 font-medium text-right">総トークン</th>
            <th className="pr-3 font-medium text-right">換算コスト</th>
            <th className="pr-3 font-medium text-right">前月比</th>
            <th className="font-medium text-right">Claude / Codex</th>
          </tr>
        </thead>
        <tbody>
          {ranking.map((r, i) => (
            <tr key={r.member_email} className="border-t border-border hover:bg-brand-soft/40 transition-colors">
              <td className="py-3 pr-3">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-brand-soft text-brand-dark text-xs font-semibold tabular-nums">
                  {i + 1}
                </span>
              </td>
              <td className="pr-3 font-medium">{r.member_name}</td>
              <td className="pr-3 text-muted">{r.team || '—'}</td>
              <td className="pr-3 text-right tabular-nums font-medium">{fmtTokens(r.total_tokens)}</td>
              <td className="pr-3 text-right tabular-nums">{fmtCost(r.cost_usd)}</td>
              <td className="pr-3 text-right"><DeltaBadge d={r.delta_pct} /></td>
              <td className="text-right text-muted tabular-nums text-xs">
                {fmtCost(r.claude_cost)} / {fmtCost(r.codex_cost)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
