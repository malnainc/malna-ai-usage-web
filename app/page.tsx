import { readSheetRows } from '@/lib/sheets'
import {
  buildRanking,
  teamBreakdown,
  monthlyTrend,
  listMonths,
  prevMonthOf,
} from '@/lib/aggregate'
import { RankingTable } from '@/components/RankingTable'
import { TeamBreakdown } from '@/components/TeamBreakdown'
import { TrendChart } from '@/components/TrendChart'
import { MonthPicker } from '@/components/MonthPicker'
import { fmtTokens, fmtCost } from '@/lib/format'

export const dynamic = 'force-dynamic'

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-surface border border-border rounded-2xl p-5 md:p-6 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
      <h2 className="text-sm font-semibold text-muted mb-4 tracking-wide">{title}</h2>
      {children}
    </section>
  )
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>
}) {
  const rows = await readSheetRows()
  const months = listMonths(rows)
  const sp = await searchParams
  const month = sp.month && months.includes(sp.month) ? sp.month : months[0] ?? ''
  const ranking = buildRanking(rows, month, prevMonthOf(month))
  const teams = teamBreakdown(rows, month)
  const trend = monthlyTrend(rows)

  const teamTotalTokens = teams.reduce((s, t) => s + t.total_tokens, 0)
  const teamTotalCost = teams.reduce((s, t) => s + t.cost_usd, 0)
  const memberCount = ranking.length
  const topName = ranking[0]?.member_name ?? ''

  return (
    <div className="min-h-full">
      <header className="bg-surface border-b border-border">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-brand" />
            <h1 className="text-base md:text-lg font-bold">malna AI活用量ダッシュボード</h1>
          </div>
          <MonthPicker months={months} current={month} />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        {/* ヒーロー */}
        <div className="rounded-3xl p-7 md:p-8 text-white bg-gradient-to-br from-[#00c4cc] via-[#1aa3c4] to-[#2563eb] shadow-lg shadow-brand/20">
          <div className="text-sm/relaxed opacity-90">チーム全体のAI活用量（{month || '—'}）</div>
          <div className="mt-1 flex items-end gap-3 flex-wrap">
            <div className="text-5xl md:text-6xl font-extrabold tabular-nums tracking-tight">
              {fmtTokens(teamTotalTokens)}
            </div>
            <div className="text-lg font-semibold opacity-95 mb-1">トークン</div>
          </div>
          <div className="mt-3 flex gap-6 text-sm">
            <div>
              <span className="opacity-80">換算コスト </span>
              <span className="font-bold tabular-nums">{fmtCost(teamTotalCost)}</span>
            </div>
            <div>
              <span className="opacity-80">参加 </span>
              <span className="font-bold tabular-nums">{memberCount}</span>
              <span className="opacity-80"> 名</span>
            </div>
            {topName && (
              <div>
                <span className="opacity-80">トップ </span>
                <span className="font-bold">{topName}</span>
              </div>
            )}
          </div>
        </div>

        <Card title={`メンバー別ランキング（${month || '—'}）`}>
          <RankingTable ranking={ranking} />
        </Card>

        <Card title="チーム別">
          <TeamBreakdown teams={teams} />
        </Card>

        <Card title="月推移（チーム合計・億トークン）">
          <TrendChart data={trend} />
        </Card>

        <p className="text-xs text-muted pt-2">
          指標: ccusage API換算値（定額プランの実請求とは別物です）。利用量の傾向把握用。
        </p>
      </main>
    </div>
  )
}
