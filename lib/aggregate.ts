import type { UsageRow, RankingEntry } from './types'

export function latestSnapshots(rows: UsageRow[]): Map<string, UsageRow> {
  const best = new Map<string, UsageRow>()
  for (const r of rows) {
    const key = `${r.member_email}|${r.month}`
    const cur = best.get(key)
    const newer =
      !cur ||
      r.snapshot_date > cur.snapshot_date ||
      (r.snapshot_date === cur.snapshot_date && r.captured_at > cur.captured_at)
    if (newer) best.set(key, r)
  }
  return best
}

function snapshotsForMonth(rows: UsageRow[], month: string): UsageRow[] {
  const snaps = latestSnapshots(rows)
  return [...snaps.values()].filter((r) => r.month === month)
}

export function buildRanking(rows: UsageRow[], month: string, prevMonth: string): RankingEntry[] {
  const snaps = latestSnapshots(rows)
  const cur = [...snaps.values()].filter((r) => r.month === month)
  const prev = new Map(
    [...snaps.values()].filter((r) => r.month === prevMonth).map((r) => [r.member_email, r]),
  )
  const ranking: RankingEntry[] = cur.map((r) => {
    const p = prev.get(r.member_email)
    const delta_pct =
      p && p.total_tokens
        ? Math.round(((r.total_tokens - p.total_tokens) / p.total_tokens) * 1000) / 10
        : null
    return {
      member_name: r.member_name,
      member_email: r.member_email,
      team: r.team,
      total_tokens: r.total_tokens,
      cost_usd: r.cost_usd,
      claude_tokens: r.claude_tokens,
      claude_cost: r.claude_cost,
      codex_tokens: r.codex_tokens,
      codex_cost: r.codex_cost,
      delta_pct,
    }
  })
  ranking.sort((a, b) => b.total_tokens - a.total_tokens)
  return ranking
}

export type TeamRow = { team: string; total_tokens: number; cost_usd: number; members: number }

export function teamBreakdown(rows: UsageRow[], month: string): TeamRow[] {
  const cur = snapshotsForMonth(rows, month)
  const map = new Map<string, TeamRow>()
  for (const r of cur) {
    const t = map.get(r.team) ?? { team: r.team, total_tokens: 0, cost_usd: 0, members: 0 }
    t.total_tokens += r.total_tokens
    t.cost_usd += r.cost_usd
    t.members += 1
    map.set(r.team, t)
  }
  return [...map.values()].sort((a, b) => b.total_tokens - a.total_tokens)
}

export type TrendRow = { month: string; total_tokens: number; cost_usd: number }

export function monthlyTrend(rows: UsageRow[]): TrendRow[] {
  const snaps = latestSnapshots(rows)
  const map = new Map<string, TrendRow>()
  for (const r of snaps.values()) {
    const m = map.get(r.month) ?? { month: r.month, total_tokens: 0, cost_usd: 0 }
    m.total_tokens += r.total_tokens
    m.cost_usd += r.cost_usd
    map.set(r.month, m)
  }
  return [...map.values()].sort((a, b) => a.month.localeCompare(b.month))
}

export function listMonths(rows: UsageRow[]): string[] {
  return [...new Set(rows.map((r) => r.month))].filter(Boolean).sort((a, b) => b.localeCompare(a))
}

export function prevMonthOf(month: string): string {
  const [y, m] = month.split('-').map(Number)
  const d = new Date(Date.UTC(y, m - 1, 1))
  d.setUTCMonth(d.getUTCMonth() - 1)
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
}
