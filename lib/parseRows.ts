import type { UsageRow } from './types'

// 必須列（これが欠けるとシート構成が壊れているとみなす）
export const COLUMNS = [
  'timestamp_jst', 'date', 'member_name', 'member_email', 'team', 'hostname', 'month',
  'input', 'output', 'cache_create', 'cache_read', 'total_tokens', 'cost_usd',
  'claude_tokens', 'claude_cost', 'codex_tokens', 'codex_cost', 'models_used', 'ccusage_version',
] as const

// 任意列（収集側の改修より前の月には存在しないため、欠けても許容する）
export const OPTIONAL_COLUMNS = ['model_breakdown', 'fugu_tokens', 'fugu_cost'] as const

type Col = (typeof COLUMNS)[number] | (typeof OPTIONAL_COLUMNS)[number]

/** ヘッダー行の判定。timestamp_jst と member_email を両方含めばヘッダー。 */
export function isHeaderRow(row: unknown[]): boolean {
  const set = new Set(row.map((c) => String(c)))
  return set.has('timestamp_jst') && set.has('member_email')
}

/**
 * シートの生値（2次元配列）を UsageRow[] に変換する純関数。
 *
 * 収集ツールの履歴的バグでシート先頭にヘッダー行が複数積み重なることがあり、
 * しかも先頭の最古ヘッダーは model_breakdown 列を欠く旧版のことがある。
 * values[0] を盲目的にヘッダーとすると新しい列を取りこぼすため:
 *   1. 既知の列を最も多く含むヘッダー行を採用する（＝model_breakdown 入りを優先）
 *   2. データ行に紛れた重複ヘッダー行はスキップする
 * network も server-only も持たないので単体テスト可能。
 */
export function parseUsageRows(values: unknown[][]): UsageRow[] {
  if (values.length < 2) return []

  const KNOWN: readonly string[] = [...COLUMNS, ...OPTIONAL_COLUMNS]
  const headerScore = (row: unknown[]) => {
    const set = new Set(row.map((c) => String(c)))
    return KNOWN.filter((c) => set.has(c)).length
  }

  let header = values[0].map((h) => String(h))
  let best = headerScore(values[0])
  for (const row of values) {
    if (!isHeaderRow(row)) continue
    const s = headerScore(row)
    if (s > best) {
      best = s
      header = row.map((h) => String(h))
    }
  }

  const missing = COLUMNS.filter((c) => !header.includes(c))
  if (missing.length > 0) {
    throw new Error(`Sheet header is missing columns: ${missing.join(', ')}`)
  }

  // 収集ツールは毎回20列ヘッダー(model_breakdown 含む)を書く。ここで欠けているのは
  // 「列名のリネーム/タイポ」か「全マシンの収集コードが旧版」のサイン。例外にすると
  // 旧データ月を読めなくなるため落とさないが、率がサイレントに消えるのを防ぐため警告する。
  if (!header.includes('model_breakdown')) {
    console.warn(
      '[parseUsageRows] header に model_breakdown 列が見当たりません。' +
        'モデル別の率が表示されない可能性があります（列名変更/旧収集コードを確認）。',
    )
  }

  const idx = (c: Col) => header.indexOf(c)
  const num = (v: unknown) => (typeof v === 'number' ? v : Number(v ?? 0) || 0)
  const str = (v: unknown) => String(v ?? '')
  const optStr = (v: unknown[], c: (typeof OPTIONAL_COLUMNS)[number]) => {
    const i = header.indexOf(c)
    return i >= 0 ? String(v[i] ?? '') : ''
  }

  return values
    .filter((v) => !isHeaderRow(v))
    .map((v) => ({
      captured_at: str(v[idx('timestamp_jst')]),
      snapshot_date: str(v[idx('date')]),
      member_name: str(v[idx('member_name')]),
      member_email: str(v[idx('member_email')]),
      team: str(v[idx('team')]),
      hostname: str(v[idx('hostname')]),
      month: str(v[idx('month')]),
      input: num(v[idx('input')]),
      output: num(v[idx('output')]),
      cache_create: num(v[idx('cache_create')]),
      cache_read: num(v[idx('cache_read')]),
      total_tokens: num(v[idx('total_tokens')]),
      cost_usd: num(v[idx('cost_usd')]),
      claude_tokens: num(v[idx('claude_tokens')]),
      claude_cost: num(v[idx('claude_cost')]),
      codex_tokens: num(v[idx('codex_tokens')]),
      codex_cost: num(v[idx('codex_cost')]),
      fugu_tokens: num(v[idx('fugu_tokens')]),
      fugu_cost: num(v[idx('fugu_cost')]),
      models_used: str(v[idx('models_used')]),
      ccusage_version: str(v[idx('ccusage_version')]),
      model_breakdown: optStr(v, 'model_breakdown'),
    }))
}
