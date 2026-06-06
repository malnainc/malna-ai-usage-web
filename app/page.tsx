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
        {/* サマリー */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="bg-surface border border-border rounded-2xl p-5">
            <div className="text-xs text-muted">チーム合計トークン（{month || '—'}）</div>
            <div className="text-3xl font-bold mt-1 tabular-nums">{fmtTokens(teamTotalTokens)}</div>
          </div>
          <div className="bg-surface border border-border rounded-2xl p-5">
            <div className="text-xs text-muted">換算コスト</div>
            <div className="text-3xl font-bold mt-1 tabular-nums text-brand-dark">{fmtCost(teamTotalCost)}</div>
          </div>
          <div className="bg-surface border border-border rounded-2xl p-5 col-span-2 md:col-span-1">
            <div className="text-xs text-muted">参加メンバー</div>
            <div className="text-3xl font-bold mt-1 tabular-nums">{memberCount}<span className="text-base font-normal text-muted ml-1">名</span></div>
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
