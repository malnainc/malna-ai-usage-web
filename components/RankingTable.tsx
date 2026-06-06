import type { RankingEntry } from '@/lib/types'
import { fmtTokens, fmtCost, fmtDelta } from '@/lib/format'

export function RankingTable({ ranking }: { ranking: RankingEntry[] }) {
  if (ranking.length === 0) {
    return <p className="text-sm text-gray-500">この月のデータはまだありません。</p>
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="text-left border-b border-gray-200 text-gray-500">
            <th className="py-2 pr-2">#</th>
            <th className="pr-2">メンバー</th>
            <th className="pr-2">チーム</th>
            <th className="pr-2 text-right">総トークン</th>
            <th className="pr-2 text-right">換算コスト</th>
            <th className="pr-2 text-right">前月比</th>
            <th className="text-right">Claude / Codex</th>
          </tr>
        </thead>
        <tbody>
          {ranking.map((r, i) => (
            <tr key={r.member_email} className="border-b border-gray-100">
              <td className="py-2 pr-2 tabular-nums">{i + 1}</td>
              <td className="pr-2 font-medium">{r.member_name}</td>
              <td className="pr-2 text-gray-500">{r.team || '—'}</td>
              <td className="pr-2 text-right tabular-nums">{fmtTokens(r.total_tokens)}</td>
              <td className="pr-2 text-right tabular-nums">{fmtCost(r.cost_usd)}</td>
              <td className="pr-2 text-right tabular-nums">{fmtDelta(r.delta_pct)}</td>
              <td className="text-right text-gray-500 tabular-nums">
                {fmtCost(r.claude_cost)} / {fmtCost(r.codex_cost)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
