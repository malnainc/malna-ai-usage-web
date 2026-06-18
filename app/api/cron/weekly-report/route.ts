import { NextRequest, NextResponse } from 'next/server'
import { getRows } from '@/lib/data'
import { buildRanking, listMonths, prevMonthOf } from '@/lib/aggregate'

export const dynamic = 'force-dynamic'

function fmtTokens(n: number): string {
  if (n >= 100_000_000) return `${(n / 100_000_000).toFixed(1)}億`
  if (n >= 10_000) return `${Math.round(n / 10_000)}万`
  return String(n)
}

function fmtDelta(delta: number | null): string {
  if (delta === null) return ''
  const sign = delta >= 0 ? '+' : ''
  return ` (${sign}${delta}%)`
}

export async function GET(req: NextRequest) {
  const isVercelCron = req.headers.get('x-vercel-cron') === '1'
  const authHeader = req.headers.get('authorization')
  if (!isVercelCron && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const token = process.env.SLACK_BOT_TOKEN
  const channel = 'C034LBMLRGE'
  const baseUrl = process.env.NEXTAUTH_URL ?? 'https://malna-ai-usage-web.vercel.app'

  if (!token) {
    return NextResponse.json({ error: 'SLACK_BOT_TOKEN not set' }, { status: 500 })
  }

  const rows = await getRows()
  const months = listMonths(rows)
  const month = months[0] ?? ''
  const prevMonth = prevMonthOf(month)
  const ranking = buildRanking(rows, month, prevMonth)
  const sorted = ranking.filter((r) => r.total_tokens > 0)
  const total = sorted.reduce((s, r) => s + r.total_tokens, 0)

  // テキストサマリー
  const lines: string[] = [
    `*AI活用量 週次レポート — ${month}*`,
    '',
    '*ランキング*',
    ...sorted.slice(0, 5).map((r, i) => {
      const delta = fmtDelta(r.delta_pct)
      return `${i + 1}位  ${r.member_name}　${fmtTokens(r.total_tokens)}${delta}`
    }),
    '',
    `チーム合計: *${fmtTokens(total)} token*`,
    `${sorted.length}名参加`,
  ]
  const text = lines.join('\n')

  // 画像URL（公開エンドポイント）
  const imageUrl = `${baseUrl}/api/og/leaderboard?month=${encodeURIComponent(month)}`

  // Slack に投稿
  const body = {
    channel,
    blocks: [
      {
        type: 'section',
        text: { type: 'mrkdwn', text },
      },
      {
        type: 'image',
        image_url: imageUrl,
        alt_text: `AI活用量ランキング ${month}`,
      },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `<${baseUrl}|詳細はダッシュボードで>`,
          },
        ],
      },
    ],
  }

  const res = await fetch('https://slack.com/api/chat.postMessage', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  })
  const json = await res.json() as { ok: boolean; error?: string }

  if (!json.ok) {
    return NextResponse.json({ error: json.error }, { status: 500 })
  }

  return NextResponse.json({ ok: true, month, members: sorted.length })
}
