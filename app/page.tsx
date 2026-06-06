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

export const dynamic = 'force-dynamic'

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

  return (
    <main className="max-w-5xl mx-auto p-6 space-y-8">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-bold">malna AI活用量ダッシュボード</h1>
        <MonthPicker months={months} current={month} />
      </header>
      <p className="text-xs text-gray-500">
        指標: ccusage API換算値（定額プランの実請求とは別物）
      </p>

      <section>
        <h2 className="font-semibold mb-2">メンバー別ランキング（{month || '—'}）</h2>
        <RankingTable ranking={ranking} />
      </section>

      <section>
        <h2 className="font-semibold mb-2">チーム別</h2>
        <TeamBreakdown teams={teams} />
      </section>

      <section>
        <h2 className="font-semibold mb-2">月推移（チーム合計・億トークン）</h2>
        <TrendChart data={trend} />
      </section>
    </main>
  )
}
