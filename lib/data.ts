import 'server-only'
import { readSheetRows } from './sheets'
import { fetchAllRows, supabaseConfigured } from './supabaseAdmin'
import type { UsageRow } from './types'

// Supabaseが設定されていればSupabaseを正とし、無ければスプレッドシート直読みにフォールバック。
// これによりSupabase未整備でも稼働でき、整備後は自動で切り替わる。
export async function getRows(): Promise<UsageRow[]> {
  if (supabaseConfigured()) return fetchAllRows()
  return readSheetRows()
}
