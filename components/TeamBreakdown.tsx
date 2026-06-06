import { fmtTokens, fmtCost } from '@/lib/format'
import type { TeamRow } from '@/lib/aggregate'

export function TeamBreakdown({ teams }: { teams: TeamRow[] }) {
  if (teams.length === 0) {
    return <p className="text-sm text-gray-500">データなし。</p>
  }
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {teams.map((t) => (
        <div key={t.team || '_'} className="border border-gray-200 rounded-lg p-3">
          <div className="font-medium">{t.team || '(未設定)'}</div>
          <div className="text-2xl tabular-nums">{fmtTokens(t.total_tokens)}</div>
          <div className="text-sm text-gray-500 tabular-nums">
            {fmtCost(t.cost_usd)} ／ {t.members}名
          </div>
        </div>
      ))}
    </div>
  )
}
