export type UsageRow = {
  captured_at: string
  snapshot_date: string
  member_name: string
  member_email: string
  team: string
  hostname: string
  month: string
  input: number
  output: number
  cache_create: number
  cache_read: number
  total_tokens: number
  cost_usd: number
  claude_tokens: number
  claude_cost: number
  codex_tokens: number
  codex_cost: number
  models_used: string
  ccusage_version: string
}

export type RankingEntry = {
  member_name: string
  member_email: string
  team: string
  total_tokens: number
  cost_usd: number
  claude_tokens: number
  claude_cost: number
  codex_tokens: number
  codex_cost: number
  /** raw token breakdown for percentage display */
  input_tokens: number
  output_tokens: number
  cache_create_tokens: number
  cache_read_tokens: number
  delta_pct: number | null
}
