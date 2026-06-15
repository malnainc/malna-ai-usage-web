import { fmtTokens, fmtCost } from '@/lib/format'
import { MODEL_LABELS as LABELS, MODEL_COLORS as COLORS } from '@/lib/modelMeta'
import type { ModelFamily, ModelFamilyUsage } from '@/lib/types'

export function ModelBreakdown({
  families,
  hasData,
  familiesPresent = [],
}: {
  families: ModelFamilyUsage[]
  hasData: boolean
  familiesPresent?: ModelFamily[]
}) {
  if (!hasData || families.length === 0) {
    return (
      <div>
        <p className="text-sm text-muted mb-3">
          この月にはモデル別の内訳データがありません。各メンバーが収集ツールを更新した翌日以降の月で表示されます。
        </p>
        {familiesPresent.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            <span className="text-xs text-muted mr-1">利用モデル:</span>
            {familiesPresent.map((f) => (
              <span
                key={f}
                className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium text-white"
                style={{ backgroundColor: COLORS[f] }}
              >
                {LABELS[f]}
              </span>
            ))}
          </div>
        )}
      </div>
    )
  }

  const total = families.reduce((s, f) => s + f.tokens, 0)
  const pct = (n: number) => (total > 0 ? (n / total) * 100 : 0)

  return (
    <div className="space-y-4">
      {/* 積み上げ横バー */}
      <div className="flex h-4 w-full overflow-hidden rounded-full bg-background/60">
        {families.map((f) => (
          <div
            key={f.family}
            className="h-full"
            style={{ width: `${pct(f.tokens)}%`, backgroundColor: COLORS[f.family] }}
            title={`${LABELS[f.family]} ${pct(f.tokens).toFixed(1)}%`}
          />
        ))}
      </div>

      {/* 凡例 */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {families.map((f) => (
          <div key={f.family} className="flex items-start gap-2">
            <span
              className="mt-1 inline-block h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: COLORS[f.family] }}
            />
            <div className="min-w-0">
              <div className="text-sm font-medium">
                {LABELS[f.family]}{' '}
                <span className="text-muted tabular-nums">{pct(f.tokens).toFixed(1)}%</span>
              </div>
              <div className="text-xs text-muted tabular-nums">
                {fmtTokens(f.tokens)} ／ {fmtCost(f.cost)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
