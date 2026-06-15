import type { UsageRow, RankingEntry, ModelFamily, ModelFamilyUsage } from './types'

// 収集側 MODEL_FAMILIES と対応する正準順序
export const MODEL_FAMILY_ORDER: ModelFamily[] = [
  'opus',
  'sonnet',
  'haiku',
  'fable',
  'codex',
  'other',
]

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
      input_tokens: r.input,
      output_tokens: r.output,
      cache_create_tokens: r.cache_create,
      cache_read_tokens: r.cache_read,
      model_families: familiesFromRow(r),
      model_families_present: familiesUsedFromStr(r.models_used),
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

/** models_used の文字列（カンマ区切りモデル名）からファミリー存在リストを返す。量なし・旧データでも動く。 */
function familiesUsedFromStr(modelsUsed: string): ModelFamily[] {
  if (!modelsUsed) return []
  const found = new Set<ModelFamily>()
  for (const raw of modelsUsed.split(',')) {
    const n = raw.trim().toLowerCase()
    if (!n) continue
    if (n.includes('opus')) found.add('opus')
    else if (n.includes('sonnet')) found.add('sonnet')
    else if (n.includes('haiku')) found.add('haiku')
    else if (n.includes('fable')) found.add('fable')
    else if (n.startsWith('gpt') || n.startsWith('codex')) found.add('codex')
    else found.add('other')
  }
  return MODEL_FAMILY_ORDER.filter((f) => found.has(f))
}

/**
 * model_breakdown のJSON文字列を安全にパースし、形状を検証する。
 * 旧データ（空・null・壊れたJSON）・配列・非有限値・負値はスキップして空を返す。
 */
function parseBreakdown(raw: string | null | undefined): Record<string, { tokens: number; cost: number }> {
  if (!raw) return {}
  try {
    const v = JSON.parse(raw)
    if (!v || typeof v !== 'object' || Array.isArray(v)) return {}
    const out: Record<string, { tokens: number; cost: number }> = {}
    for (const [k, entry] of Object.entries(v)) {
      if (!entry || typeof entry !== 'object' || Array.isArray(entry)) continue
      const t = Number((entry as Record<string, unknown>).tokens ?? 0)
      const c = Number((entry as Record<string, unknown>).cost ?? 0)
      if (!isFinite(t) || t < 0 || !isFinite(c) || c < 0) continue
      out[k] = { tokens: Math.floor(t), cost: c }
    }
    return out
  } catch {
    return {}
  }
}

/** 1行(=1メンバー1月)の model_breakdown をファミリー別配列に変換する（正準順序）。 */
export function familiesFromRow(row: UsageRow): ModelFamilyUsage[] {
  const acc = new Map<ModelFamily, { tokens: number; cost: number }>()
  const bd = parseBreakdown(row.model_breakdown)
  for (const [fam, v] of Object.entries(bd)) {
    const family = (MODEL_FAMILY_ORDER as string[]).includes(fam)
      ? (fam as ModelFamily)
      : 'other'
    const a = acc.get(family) ?? { tokens: 0, cost: 0 }
    a.tokens += v.tokens
    a.cost += v.cost
    acc.set(family, a)
  }
  return MODEL_FAMILY_ORDER.filter((f) => acc.has(f)).map((f) => ({
    family: f,
    tokens: acc.get(f)!.tokens,
    cost: acc.get(f)!.cost,
  }))
}

export type ModelBreakdownResult = {
  families: ModelFamilyUsage[]
  /** 当月にモデル別内訳データを1件でも持つメンバーがいたか（無ければ旧データのみ） */
  hasData: boolean
  /** models_used から導いたファミリー存在一覧（量なし・旧データでも埋まる） */
  familiesPresent: ModelFamily[]
}

/** 当月のチーム合計をモデルファミリー別のトークン/コストに集計する。 */
export function modelBreakdown(rows: UsageRow[], month: string): ModelBreakdownResult {
  const cur = snapshotsForMonth(rows, month)
  const acc = new Map<ModelFamily, { tokens: number; cost: number }>()
  const presentSet = new Set<ModelFamily>()
  let hasData = false
  for (const r of cur) {
    for (const f of familiesUsedFromStr(r.models_used)) {
      presentSet.add(f)
    }
    for (const f of familiesFromRow(r)) {
      if (f.tokens || f.cost) hasData = true
      const a = acc.get(f.family) ?? { tokens: 0, cost: 0 }
      a.tokens += f.tokens
      a.cost += f.cost
      acc.set(f.family, a)
    }
  }
  const families = MODEL_FAMILY_ORDER.filter((f) => acc.has(f)).map((f) => ({
    family: f,
    tokens: acc.get(f)!.tokens,
    cost: acc.get(f)!.cost,
  }))
  const familiesPresent = MODEL_FAMILY_ORDER.filter((f) => presentSet.has(f))
  return { families, hasData, familiesPresent }
}

export type CoverageMember = { member_name: string; team: string; member_email: string }
export type CoverageResult = {
  active: CoverageMember[]
  /** 先月は記録があったが当月は記録がないメンバー（離脱・休眠の可能性） */
  dormant: CoverageMember[]
  /** 先月のベースラインデータが存在するか（falseなら "全員アクティブ" は表示しない） */
  hasPrevData: boolean
}

/** 稼働カバレッジ: 当月アクティブ／先月いたが当月いない休眠メンバーを抽出する。 */
export function coverage(rows: UsageRow[], month: string, prevMonth: string): CoverageResult {
  const cur = snapshotsForMonth(rows, month)
  const curEmails = new Set(cur.map((r) => r.member_email))
  const prev = snapshotsForMonth(rows, prevMonth)
  const active = cur
    .map((r) => ({ member_name: r.member_name, team: r.team, member_email: r.member_email }))
    .sort((a, b) => a.member_name.localeCompare(b.member_name, 'ja'))
  const dormant = prev
    .filter((r) => !curEmails.has(r.member_email))
    .map((r) => ({ member_name: r.member_name, team: r.team, member_email: r.member_email }))
    .sort((a, b) => a.member_name.localeCompare(b.member_name, 'ja'))
  return { active, dormant, hasPrevData: prev.length > 0 }
}

export function listMonths(rows: UsageRow[]): string[] {
  return [...new Set(rows.map((r) => r.month))].filter(Boolean).sort((a, b) => b.localeCompare(a))
}

export function prevMonthOf(month: string): string {
  if (!month || !/^\d{4}-\d{2}$/.test(month)) return ''
  const [y, m] = month.split('-').map(Number)
  const d = new Date(Date.UTC(y, m - 1, 1))
  d.setUTCMonth(d.getUTCMonth() - 1)
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
}
