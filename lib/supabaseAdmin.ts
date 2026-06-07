import 'server-only'
import { createClient } from '@supabase/supabase-js'
import type { UsageRow } from './types'

function admin() {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are not set')
  return createClient(url, key, { auth: { persistSession: false } })
}

export function supabaseConfigured(): boolean {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY)
}

export async function upsertSnapshots(rows: UsageRow[]): Promise<number> {
  if (rows.length === 0) return 0
  const payload = rows.map((r) => ({
    captured_at: r.captured_at || null,
    snapshot_date: r.snapshot_date,
    member_name: r.member_name,
    member_email: r.member_email,
    team: r.team,
    hostname: r.hostname,
    month: r.month,
    input: r.input,
    output: r.output,
    cache_create: r.cache_create,
    cache_read: r.cache_read,
    total_tokens: r.total_tokens,
    cost_usd: r.cost_usd,
    claude_tokens: r.claude_tokens,
    claude_cost: r.claude_cost,
    codex_tokens: r.codex_tokens,
    codex_cost: r.codex_cost,
    models_used: r.models_used,
    ccusage_version: r.ccusage_version,
  }))
  const { error } = await admin()
    .from('usage_snapshots')
    .upsert(payload, { onConflict: 'member_email,month,snapshot_date' })
  if (error) throw new Error(error.message)
  return payload.length
}

export async function fetchAllRows(): Promise<UsageRow[]> {
  const { data, error } = await admin().from('usage_snapshots').select('*')
  if (error) throw new Error(error.message)
  return (data ?? []) as unknown as UsageRow[]
}
