import { google } from 'googleapis'
import type { UsageRow } from './types'

const COLUMNS = [
  'timestamp_jst', 'date', 'member_name', 'member_email', 'team', 'hostname', 'month',
  'input', 'output', 'cache_create', 'cache_read', 'total_tokens', 'cost_usd',
  'claude_tokens', 'claude_cost', 'codex_tokens', 'codex_cost', 'models_used', 'ccusage_version',
] as const

export async function readSheetRows(): Promise<UsageRow[]> {
  const creds = JSON.parse(process.env.GOOGLE_SA_JSON as string)
  const auth = new google.auth.GoogleAuth({
    credentials: creds,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  })
  const sheets = google.sheets({ version: 'v4', auth })
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.SHEET_ID as string,
    range: 'raw!A1:S',
  })
  const values = res.data.values ?? []
  if (values.length < 2) return []
  const header = values[0] as string[]
  const idx = (c: (typeof COLUMNS)[number]) => header.indexOf(c)
  const num = (v: unknown) => Number(v ?? 0) || 0
  const str = (v: unknown) => String(v ?? '')
  return values.slice(1).map((v) => ({
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
  }))
}
