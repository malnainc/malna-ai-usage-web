export function fmtTokens(n: number): string {
  if (n >= 100_000_000) return `${(n / 100_000_000).toFixed(2)}億`
  if (n >= 10_000) return `${(n / 10_000).toFixed(2)}万`
  return n.toLocaleString('en-US')
}

export function fmtCost(n: number): string {
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function fmtDelta(d: number | null): string {
  if (d === null) return '—'
  return `${d >= 0 ? '+' : ''}${d}%`
}
