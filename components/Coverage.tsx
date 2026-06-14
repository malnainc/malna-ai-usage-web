import type { CoverageResult } from '@/lib/aggregate'

export function Coverage({
  coverage,
  prevMonth,
}: {
  coverage: CoverageResult
  prevMonth: string
}) {
  const { active, dormant } = coverage
  return (
    <div className="space-y-4">
      <div className="flex gap-6">
        <div>
          <div className="text-3xl font-bold tabular-nums text-pos">{active.length}</div>
          <div className="text-xs text-muted mt-0.5">今月アクティブ</div>
        </div>
        <div>
          <div
            className={`text-3xl font-bold tabular-nums ${dormant.length > 0 ? 'text-neg' : 'text-muted'}`}
          >
            {dormant.length}
          </div>
          <div className="text-xs text-muted mt-0.5">休眠（先月→今月で記録なし）</div>
        </div>
      </div>

      {dormant.length > 0 ? (
        <div className="rounded-xl border border-[#f3c7c7] bg-[#fdf2f2] px-4 py-3">
          <div className="text-xs font-semibold text-[#b42318] mb-1.5">
            先月（{prevMonth}）は使っていたが、今月まだ記録がないメンバー
          </div>
          <div className="flex flex-wrap gap-1.5">
            {dormant.map((m) => (
              <span
                key={m.member_email}
                className="text-xs bg-white border border-[#f3c7c7] rounded-full px-2.5 py-0.5"
              >
                {m.member_name}
                {m.team ? <span className="text-muted">（{m.team}）</span> : null}
              </span>
            ))}
          </div>
        </div>
      ) : coverage.hasPrevData ? (
        <p className="text-sm text-muted">休眠メンバーはいません。全員が今月も活用しています。</p>
      ) : (
        <p className="text-sm text-muted">前月の比較データがありません。</p>
      )}
    </div>
  )
}
