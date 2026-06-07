// 信頼できるデータの開始月。
// Claude Codeのローカルログは保持期間があり、計測開始(2026-06)前の古い月は
// ログが消えており過少表示になる。ログが存命のうちに日次スナップショットを
// 取り始めた最初の月=2026-05 以降を「正データ」とする。
export const RELIABLE_FROM = '2026-05'

export function isReliableMonth(month: string): boolean {
  return month >= RELIABLE_FROM
}
