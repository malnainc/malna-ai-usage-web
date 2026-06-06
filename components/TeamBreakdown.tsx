import { fmtTokens, fmtCost } from '@/lib/format'
import type { TeamRow } from '@/lib/aggregate'

export function TeamBreakdown({ teams }: { teams: TeamRow[] }) {
  if (teams.length === 0) {
    return <p className="text-sm text-muted">データなし。</p>
  }
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {teams.map((t) => (
        <div key={t.team || '_'} className="border border-border rounded-xl p-4 bg-background/40">
          <div className="text-sm font-medium">{t.team || '(未設定)'}</div>
          <div className="text-2xl font-bold mt-1 tabular-nums">{fmtTokens(t.total_tokens)}</div>
          <div className="text-xs text-muted mt-0.5 tabular-nums">
            {fmtCost(t.cost_usd)} ／ {t.members}名
          </div>
        </div>
      ))}
    </div>
  )
}
