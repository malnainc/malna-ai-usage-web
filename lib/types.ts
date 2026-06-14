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
  /** モデルファミリー別内訳のJSON文字列。例: {"opus":{"tokens":1,"cost":2}}。旧データでは空。 */
  model_breakdown: string
}

/** モデルファミリー（収集側 MODEL_FAMILIES と対応） */
export type ModelFamily = 'opus' | 'sonnet' | 'haiku' | 'fable' | 'codex' | 'other'

export type ModelFamilyUsage = {
  family: ModelFamily
  tokens: number
  cost: number
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
  /** このメンバーのモデルファミリー別内訳（旧データでは空配列） */
  model_families: ModelFamilyUsage[]
  delta_pct: number | null
}
