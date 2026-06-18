import { ImageResponse } from 'next/og'
import { getRows } from '@/lib/data'
import { buildRanking, listMonths, prevMonthOf } from '@/lib/aggregate'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const RANK_COLORS = ['#f59e0b', '#94a3b8', '#cd7f32']
const MODEL_COLORS: Record<string, string> = {
  opus: '#2563eb',
  sonnet: '#00c4cc',
  haiku: '#10b981',
  fable: '#a855f7',
  codex: '#f59e0b',
  other: '#94a3b8',
}

function fmtTokens(n: number): string {
  if (n >= 100_000_000) return `${(n / 100_000_000).toFixed(1)}億`
  if (n >= 10_000) return `${Math.round(n / 10_000)}万`
  return String(n)
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const rows = await getRows()
  const months = listMonths(rows)
  const month = searchParams.get('month') ?? months[0] ?? ''
  const prevMonth = prevMonthOf(month)
  const ranking = buildRanking(rows, month, prevMonth)
  const sorted = ranking.filter((r) => r.total_tokens > 0)
  const max = sorted[0]?.total_tokens ?? 1
  const total = sorted.reduce((s, r) => s + r.total_tokens, 0)

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: '#ffffff',
          display: 'flex',
          flexDirection: 'column',
          fontFamily: 'sans-serif',
          padding: '40px 48px',
        }}
      >
        {/* ヘッダー */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 32 }}>
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: '#00c4cc',
              marginRight: 10,
            }}
          />
          <div style={{ fontSize: 18, fontWeight: 700, color: '#111827' }}>
            malna AI活用量ランキング
          </div>
          <div
            style={{
              marginLeft: 'auto',
              fontSize: 13,
              color: '#6b7280',
              background: '#f3f4f6',
              padding: '4px 12px',
              borderRadius: 20,
            }}
          >
            {month}
          </div>
        </div>

        {/* ランキング行 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0, flex: 1 }}>
          {sorted.slice(0, 8).map((entry, i) => {
            const pct = (entry.total_tokens / max) * 100
            const accent = RANK_COLORS[i] ?? '#e5e7eb'
            const isTop3 = i < 3

            return (
              <div
                key={entry.member_email}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '10px 0',
                  borderBottom: '1px solid #f3f4f6',
                }}
              >
                {/* 順位 */}
                <div
                  style={{
                    width: 28,
                    fontSize: isTop3 ? 18 : 13,
                    fontWeight: 800,
                    color: accent,
                    textAlign: 'right',
                    marginRight: 16,
                    flexShrink: 0,
                  }}
                >
                  {i + 1}
                </div>

                {/* 名前 */}
                <div
                  style={{
                    width: 120,
                    fontSize: 13,
                    fontWeight: isTop3 ? 700 : 500,
                    color: isTop3 ? '#111827' : '#6b7280',
                    marginRight: 16,
                    flexShrink: 0,
                    overflow: 'hidden',
                  }}
                >
                  {entry.member_name}
                </div>

                {/* 積み上げバー */}
                <div
                  style={{
                    flex: 1,
                    height: isTop3 ? 16 : 10,
                    borderRadius: 8,
                    background: '#f3f4f6',
                    overflow: 'hidden',
                    display: 'flex',
                    marginRight: 16,
                  }}
                >
                  {entry.model_families.map((f) => (
                    <div
                      key={f.family}
                      style={{
                        width: `${(f.tokens / max) * 100}%`,
                        height: '100%',
                        background: MODEL_COLORS[f.family] ?? '#94a3b8',
                        minWidth: f.tokens > 0 ? 2 : 0,
                      }}
                    />
                  ))}
                  {/* fallback: solid bar if no breakdown */}
                  {entry.model_families.length === 0 && (
                    <div
                      style={{
                        width: `${pct}%`,
                        height: '100%',
                        background: accent,
                        borderRadius: 8,
                      }}
                    />
                  )}
                </div>

                {/* トークン数 */}
                <div
                  style={{
                    width: 72,
                    fontSize: 12,
                    fontWeight: isTop3 ? 700 : 400,
                    color: isTop3 ? accent : '#9ca3af',
                    textAlign: 'right',
                    flexShrink: 0,
                  }}
                >
                  {fmtTokens(entry.total_tokens)}
                </div>
              </div>
            )
          })}
        </div>

        {/* フッター */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            marginTop: 24,
            paddingTop: 16,
            borderTop: '1px solid #e5e7eb',
          }}
        >
          <div style={{ fontSize: 12, color: '#6b7280' }}>
            チーム合計
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#111827', marginLeft: 12 }}>
            {fmtTokens(total)}
          </div>
          <div style={{ fontSize: 12, color: '#6b7280', marginLeft: 6 }}>token</div>
          <div style={{ marginLeft: 'auto', fontSize: 11, color: '#d1d5db' }}>
            malna-ai-usage-web.vercel.app
          </div>
        </div>
      </div>
    ),
    {
      width: 700,
      height: 420,
    },
  )
}
