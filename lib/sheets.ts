import 'server-only'
import { google } from 'googleapis'
import type { UsageRow } from './types'

// 必須列（これが欠けるとシート構成が壊れているとみなす）
const COLUMNS = [
  'timestamp_jst', 'date', 'member_name', 'member_email', 'team', 'hostname', 'month',
  'input', 'output', 'cache_create', 'cache_read', 'total_tokens', 'cost_usd',
  'claude_tokens', 'claude_cost', 'codex_tokens', 'codex_cost', 'models_used', 'ccusage_version',
] as const

// 任意列（収集側の改修より前の月には存在しないため、欠けても許容する）
const OPTIONAL_COLUMNS = ['model_breakdown'] as const

export async function readSheetRows(): Promise<UsageRow[]> {
  const rawJson = process.env.GOOGLE_SA_JSON
  const sheetId = process.env.SHEET_ID
  if (!rawJson) throw new Error('GOOGLE_SA_JSON is not set')
  if (!sheetId) throw new Error('SHEET_ID is not set')

  let creds: Record<string, unknown>
  try {
    creds = JSON.parse(rawJson)
  } catch {
    throw new Error('GOOGLE_SA_JSON is not valid JSON')
  }

  const auth = new google.auth.GoogleAuth({
    credentials: creds,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  })
  const sheets = google.sheets({ version: 'v4', auth })
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: 'raw!A1:Z',
    valueRenderOption: 'UNFORMATTED_VALUE',
  })
  const values = res.data.values ?? []
  if (values.length < 2) return []

  // ヘッダー行は重複・旧版が混在しうる（収集ツールの履歴的バグで、先頭に
  // model_breakdown 列を欠く旧ヘッダーが残ることがある）。values[0] を盲目的に
  // 使うと新しい列を取りこぼすため、既知の列を最も多く含むヘッダー行を採用する。
  const KNOWN: readonly string[] = [...COLUMNS, ...OPTIONAL_COLUMNS]
  const isHeaderRow = (row: unknown[]) => {
    const set = new Set(row.map((c) => String(c)))
    return set.has('timestamp_jst') && set.has('member_email')
  }
  const headerScore = (row: unknown[]) => {
    const set = new Set(row.map((c) => String(c)))
    return KNOWN.filter((c) => set.has(c)).length
  }
  let header = (values[0] as unknown[]).map((h) => String(h))
  let best = headerScore(values[0] as unknown[])
  for (const row of values) {
    if (!isHeaderRow(row as unknown[])) continue
    const s = headerScore(row as unknown[])
    if (s > best) {
      best = s
      header = (row as unknown[]).map((h) => String(h))
    }
  }

  const missing = COLUMNS.filter((c) => !header.includes(c))
  if (missing.length > 0) {
    throw new Error(`Sheet header is missing columns: ${missing.join(', ')}`)
  }
  const idx = (c: (typeof COLUMNS)[number] | (typeof OPTIONAL_COLUMNS)[number]) =>
    header.indexOf(c)
  const num = (v: unknown) => (typeof v === 'number' ? v : Number(v ?? 0) || 0)
  const str = (v: unknown) => String(v ?? '')
  const optStr = (v: unknown[], c: (typeof OPTIONAL_COLUMNS)[number]) => {
    const i = header.indexOf(c)
    return i >= 0 ? String(v[i] ?? '') : ''
  }

  // データ行に紛れた重複ヘッダー行はスキップする。
  return values.filter((v) => !isHeaderRow(v as unknown[])).map((v) => ({
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
    models_used: str(v[idx('models_used')]),
    ccusage_version: str(v[idx('ccusage_version')]),
    model_breakdown: optStr(v, 'model_breakdown'),
  }))
}
