import { describe, it, expect } from 'vitest'
import { parseUsageRows, isHeaderRow, COLUMNS } from '@/lib/parseRows'
import { modelBreakdown } from '@/lib/aggregate'

// 19列の旧ヘッダー（model_breakdown を欠く・実シートの1行目と同じ形）
const LEGACY_HEADER = [...COLUMNS]
// 20列の新ヘッダー
const NEW_HEADER = [...COLUMNS, 'model_breakdown']

// 1メンバー1月のデータ行を組み立てる（20列）
function dataRow(opts: {
  email: string
  month: string
  total: number
  cost: number
  modelsUsed: string
  breakdown?: Record<string, { tokens: number; cost: number }>
}) {
  return [
    '2026-06-05T10:00:00+09:00', '2026-06-05', opts.email.split('@')[0], opts.email,
    'team-a', 'host', opts.month, 1, 2, 3, 4, opts.total, opts.cost,
    opts.total, opts.cost, 0, 0, opts.modelsUsed, 'ccusage@1',
    opts.breakdown ? JSON.stringify(opts.breakdown) : '',
  ]
}

describe('isHeaderRow', () => {
  it('detects header rows by the timestamp_jst + member_email signature', () => {
    expect(isHeaderRow(LEGACY_HEADER)).toBe(true)
    expect(isHeaderRow(NEW_HEADER)).toBe(true)
  })
  it('does not flag real data rows', () => {
    expect(isHeaderRow(dataRow({ email: 'a@x.co', month: '2026-06', total: 10, cost: 1, modelsUsed: 'opus' }))).toBe(false)
  })
})

describe('parseUsageRows — 出戻り防止（複数ヘッダー積み重なり）', () => {
  // 実シートで起きた壊れ方の再現:
  // 1行目=旧19列ヘッダー（model_breakdown なし）、続いて20列ヘッダーが重複、その後データ。
  const breakdown = { opus: { tokens: 800, cost: 8 }, sonnet: { tokens: 200, cost: 2 } }
  const values = [
    LEGACY_HEADER,                                  // 1行目: 旧ヘッダー（罠）
    NEW_HEADER,                                      // 重複ヘッダー
    NEW_HEADER,                                      // 重複ヘッダー
    dataRow({ email: 'a@x.co', month: '2026-06', total: 1000, cost: 10, modelsUsed: 'opus,sonnet', breakdown }),
    dataRow({ email: 'b@x.co', month: '2026-06', total: 500, cost: 5, modelsUsed: 'opus', breakdown: { opus: { tokens: 500, cost: 5 } } }),
  ]

  it('旧19列ヘッダーが1行目でも model_breakdown を取りこぼさない', () => {
    const rows = parseUsageRows(values)
    expect(rows.map((r) => r.member_email).sort()).toEqual(['a@x.co', 'b@x.co'])
    expect(rows[0].model_breakdown).toContain('opus')
  })

  it('重複ヘッダー行はデータとして紛れ込まない', () => {
    const rows = parseUsageRows(values)
    expect(rows.some((r) => r.member_email === 'member_email')).toBe(false)
    expect(rows).toHaveLength(2)
  })

  it('modelBreakdown が率を出せる（hasData=true）— これが消えていた症状', () => {
    const rows = parseUsageRows(values)
    const mb = modelBreakdown(rows, '2026-06')
    expect(mb.hasData).toBe(true)
    const fams = mb.families.map((f) => f.family)
    expect(fams).toContain('opus')
    expect(fams).toContain('sonnet')
    const total = mb.families.reduce((s, f) => s + f.tokens, 0)
    expect(total).toBe(1500)
  })
})

describe('parseUsageRows — 旧データ（model_breakdown 列が存在しない月）', () => {
  it('19列ヘッダー単独でもエラーにならず model_breakdown は空', () => {
    const values = [
      LEGACY_HEADER,
      [
        '2026-03-01T10:00:00+09:00', '2026-03-01', 'old', 'old@x.co', 'team', 'host',
        '2026-03', 1, 2, 3, 4, 100, 1, 100, 1, 0, 0, 'opus', 'ccusage@0',
      ],
    ]
    const rows = parseUsageRows(values)
    expect(rows).toHaveLength(1)
    expect(rows[0].model_breakdown).toBe('')
    expect(rows[0].models_used).toBe('opus')
  })
})

describe('parseUsageRows — Sheets API の癖（Fugu レビュー由来）', () => {
  it('右端の空セルが切り詰められた短い行(19要素)でも壊れない', () => {
    // Sheets API は行末の空セルを返さない。model_breakdown が空の行は19要素で返る。
    const shortRow = [
      '2026-06-02T00:00:00+09:00', '2026-06-02', 'c', 'c@x.co', 't', 'h', '2026-06',
      1, 2, 3, 4, 100, 1, 100, 1, 0, 0, 'opus', 'v', // 19要素・model_breakdown セル無し
    ]
    const rows = parseUsageRows([NEW_HEADER, shortRow])
    expect(rows).toHaveLength(1)
    expect(rows[0].member_email).toBe('c@x.co')
    expect(rows[0].total_tokens).toBe(100)
    expect(rows[0].model_breakdown).toBe('')
  })

  it('列順が入れ替わっても indexOf ベースで値がズレない', () => {
    const header = ['model_breakdown', 'member_email', ...COLUMNS.filter((c) => c !== 'member_email')]
    const all: Record<string, unknown> = {
      timestamp_jst: '2026-06-01T00:00:00+09:00', date: '2026-06-01', member_name: 'z',
      member_email: 'z@x.co', team: 't', hostname: 'h', month: '2026-06',
      input: 1, output: 1, cache_create: 0, cache_read: 0, total_tokens: 300, cost_usd: 3,
      claude_tokens: 300, claude_cost: 3, codex_tokens: 0, codex_cost: 0, models_used: 'opus',
      ccusage_version: 'v', model_breakdown: JSON.stringify({ opus: { tokens: 300, cost: 3 } }),
    }
    const rows = parseUsageRows([header, header.map((c) => all[c])])
    expect(rows[0].member_email).toBe('z@x.co')
    expect(rows[0].total_tokens).toBe(300)
    expect(rows[0].model_breakdown).toContain('opus')
  })
})

describe('parseUsageRows — 異常系', () => {
  it('必須列が欠けたヘッダーは例外を投げる', () => {
    const broken = COLUMNS.filter((c) => c !== 'total_tokens')
    expect(() => parseUsageRows([broken, broken.map(() => 'x')])).toThrow(/missing columns/)
  })
  it('空・ヘッダーのみは空配列', () => {
    expect(parseUsageRows([])).toEqual([])
    expect(parseUsageRows([NEW_HEADER])).toEqual([])
  })
})
