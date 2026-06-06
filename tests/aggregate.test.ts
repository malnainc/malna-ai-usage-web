import { describe, it, expect } from 'vitest'
import { latestSnapshots, buildRanking, teamBreakdown, monthlyTrend, prevMonthOf } from '@/lib/aggregate'
import type { UsageRow } from '@/lib/types'

function row(p: Partial<UsageRow>): UsageRow {
  return {
    captured_at: p.captured_at ?? '2026-05-31T09:00:00+09:00',
    snapshot_date: p.snapshot_date ?? '2026-05-31',
    member_name: p.member_name ?? 'A',
    member_email: p.member_email ?? 'a@malna.co.jp',
    team: p.team ?? 'X',
    hostname: 'h',
    month: p.month ?? '2026-05',
    input: 0, output: 0, cache_create: 0, cache_read: 0,
    total_tokens: p.total_tokens ?? 0, cost_usd: p.cost_usd ?? 0,
    claude_tokens: p.claude_tokens ?? 0, claude_cost: p.claude_cost ?? 0,
    codex_tokens: p.codex_tokens ?? 0, codex_cost: p.codex_cost ?? 0,
    models_used: '', ccusage_version: '',
  }
}

describe('latestSnapshots', () => {
  it('keeps newest snapshot_date per member/month', () => {
    const rows = [
      row({ member_email: 'a@x', month: '2026-05', snapshot_date: '2026-05-30', total_tokens: 100 }),
      row({ member_email: 'a@x', month: '2026-05', snapshot_date: '2026-05-31', total_tokens: 150 }),
    ]
    const s = latestSnapshots(rows)
    expect(s.get('a@x|2026-05')!.total_tokens).toBe(150)
  })
})

describe('buildRanking', () => {
  it('ranks by tokens desc and computes delta', () => {
    const rows = [
      row({ member_email: 'a@x', member_name: 'A', month: '2026-05', snapshot_date: '2026-05-31', total_tokens: 100, cost_usd: 1 }),
      row({ member_email: 'b@x', member_name: 'B', month: '2026-05', snapshot_date: '2026-05-31', total_tokens: 300, cost_usd: 3 }),
      row({ member_email: 'b@x', member_name: 'B', month: '2026-04', snapshot_date: '2026-04-30', total_tokens: 100 }),
    ]
    const r = buildRanking(rows, '2026-05', '2026-04')
    expect(r.map((x) => x.member_name)).toEqual(['B', 'A'])
    expect(r[0].delta_pct).toBe(200)
    expect(r[1].delta_pct).toBeNull()
  })
})

describe('teamBreakdown', () => {
  it('sums by team', () => {
    const rows = [
      row({ member_email: 'a@x', team: 'AD', month: '2026-05', snapshot_date: '2026-05-31', total_tokens: 100, cost_usd: 1 }),
      row({ member_email: 'b@x', team: 'AD', month: '2026-05', snapshot_date: '2026-05-31', total_tokens: 200, cost_usd: 2 }),
      row({ member_email: 'c@x', team: 'MG', month: '2026-05', snapshot_date: '2026-05-31', total_tokens: 50, cost_usd: 1 }),
    ]
    const t = teamBreakdown(rows, '2026-05')
    expect(t.find((x) => x.team === 'AD')!.total_tokens).toBe(300)
    expect(t.find((x) => x.team === 'AD')!.members).toBe(2)
  })
})

describe('monthlyTrend', () => {
  it('returns per-month team totals sorted', () => {
    const rows = [
      row({ member_email: 'a@x', month: '2026-04', snapshot_date: '2026-04-30', total_tokens: 50 }),
      row({ member_email: 'a@x', month: '2026-05', snapshot_date: '2026-05-31', total_tokens: 100 }),
    ]
    const tr = monthlyTrend(rows)
    expect(tr.map((x) => x.month)).toEqual(['2026-04', '2026-05'])
    expect(tr[1].total_tokens).toBe(100)
  })
})

describe('prevMonthOf', () => {
  it('handles year boundary', () => {
    expect(prevMonthOf('2026-01')).toBe('2025-12')
    expect(prevMonthOf('2026-06')).toBe('2026-05')
  })
})
