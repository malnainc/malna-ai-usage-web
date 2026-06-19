import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { getRows } from '@/lib/data'
import { buildRanking, listMonths, prevMonthOf } from '@/lib/aggregate'

export const dynamic = 'force-dynamic'

function fmtTokens(n: number): string {
  if (n >= 100_000_000) return `${(n / 100_000_000).toFixed(1)}億`
  if (n >= 10_000) return `${Math.round(n / 10_000)}万`
  return String(n)
}

async function generateMessage(data: {
  month: string
  ranking: Array<{
    name: string
    tokens: number
    delta_pct: number | null
    rank: number
  }>
  totalTokens: number
  prevTotalTokens: number
}): Promise<string> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const rankingText = data.ranking
    .slice(0, 8)
    .map((r) => {
      const delta = r.delta_pct !== null ? `先月比${r.delta_pct >= 0 ? '+' : ''}${r.delta_pct}%` : '初登場'
      return `${r.rank}位: ${r.name} — ${fmtTokens(r.tokens)} (${delta})`
    })
    .join('\n')

  const totalDelta =
    data.prevTotalTokens > 0
      ? Math.round(((data.totalTokens - data.prevTotalTokens) / data.prevTotalTokens) * 100)
      : null

  const prompt = `あなたはmalna（AIネイティブな会社を目指すマーケティング会社）の社内Slackに毎週投稿するAI活用量レポートの文章を書くアシスタントです。

以下のランキングデータを元に、社内向けの週次レポートメッセージを日本語で書いてください。

【今月: ${data.month}】
${rankingText}

チーム合計: ${fmtTokens(data.totalTokens)}${totalDelta !== null ? `（先月比${totalDelta >= 0 ? '+' : ''}${totalDelta}%）` : ''}

【ルール】
- 絵文字を積極的に使う（🤖🥇🔥💡📈など）
- 1位の人を具体的に褒める（トークン数・伸び率など事実ベースで）
- 他のメンバーにも個別コメントを1〜2人入れる（急上昇した人、モデルを使い分けていそうな人など、データから読み取れる特徴を褒める）
- 「malnaはAIネイティブな会社を目指している」というメッセージを自然に入れる
- 「AIを日常業務に使おう」という前向きな呼びかけで締める
- 毎回違う言い回しになるよう工夫する（今週のテーマ感を出す）
- 全体で200〜280文字程度
- Slack mrkdwn形式（*太字*、箇条書きは使わず文章で）
- ランキング表は含めない（画像で別途共有するため）

メッセージ本文のみ出力してください。`

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 512,
    messages: [{ role: 'user', content: prompt }],
  })

  const content = response.content[0]
  return content.type === 'text' ? content.text.trim() : ''
}

export async function GET(req: NextRequest) {
  const isVercelCron = req.headers.get('x-vercel-cron') === '1'
  const authHeader = req.headers.get('authorization')
  if (!isVercelCron && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  const isTest = new URL(req.url).searchParams.get('test') === '1'

  const slackToken = process.env.SLACK_BOT_TOKEN
  const channel = 'C034LBMLRGE'
  const baseUrl = process.env.NEXTAUTH_URL ?? 'https://malna-ai-usage-web.vercel.app'

  if (!slackToken) {
    return NextResponse.json({ error: 'SLACK_BOT_TOKEN not set' }, { status: 500 })
  }

  const rows = await getRows()
  const months = listMonths(rows)
  const month = months[0] ?? ''
  const prevMonth = prevMonthOf(month)
  const ranking = buildRanking(rows, month, prevMonth)
  const prevRanking = buildRanking(rows, prevMonth, prevMonthOf(prevMonth))

  const sorted = ranking.filter((r) => r.total_tokens > 0)
  const totalTokens = sorted.reduce((s, r) => s + r.total_tokens, 0)
  const prevTotalTokens = prevRanking.reduce((s, r) => s + r.total_tokens, 0)

  const rankingForPrompt = sorted.map((r, i) => ({
    name: r.member_name,
    tokens: r.total_tokens,
    delta_pct: r.delta_pct,
    rank: i + 1,
  }))

  let message = await generateMessage({
    month,
    ranking: rankingForPrompt,
    totalTokens,
    prevTotalTokens,
  })
  if (isTest) message = `【テスト】\n${message}`

  const imageUrl = `${baseUrl}/api/og/leaderboard?month=${encodeURIComponent(month)}`

  const body = {
    channel,
    blocks: [
      {
        type: 'section',
        text: { type: 'mrkdwn', text: message },
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
      Authorization: `Bearer ${slackToken}`,
    },
    body: JSON.stringify(body),
  })
  const json = await res.json() as { ok: boolean; error?: string }

  if (!json.ok) {
    return NextResponse.json({ error: json.error }, { status: 500 })
  }

  return NextResponse.json({ ok: true, month, members: sorted.length })
}
