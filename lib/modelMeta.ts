import type { ModelFamily } from './types'

/** モデルファミリーの表示名（UI共通） */
export const MODEL_LABELS: Record<ModelFamily, string> = {
  opus: 'Opus',
  sonnet: 'Sonnet',
  haiku: 'Haiku',
  fable: 'Fable',
  codex: 'Codex (GPT)',
  other: 'その他',
}

/** モデルファミリーの表示色（積み上げバー・凡例で共通） */
export const MODEL_COLORS: Record<ModelFamily, string> = {
  opus: '#2563eb',
  sonnet: '#00c4cc',
  haiku: '#10b981',
  fable: '#a855f7',
  codex: '#f59e0b',
  other: '#94a3b8',
}
