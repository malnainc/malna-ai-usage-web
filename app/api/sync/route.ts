import { NextRequest, NextResponse } from 'next/server'
import { readSheetRows } from '@/lib/sheets'
import { upsertSnapshots, supabaseConfigured } from '@/lib/supabaseAdmin'
import { notifyFailure } from '@/lib/notify'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const isVercelCron = req.headers.get('x-vercel-cron') === '1'
  const authHeader = req.headers.get('authorization')
  if (!isVercelCron && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  if (!supabaseConfigured()) {
    return NextResponse.json({ ok: false, error: 'supabase not configured' }, { status: 503 })
  }
  try {
    const rows = await readSheetRows()
    const n = await upsertSnapshots(rows)
    return NextResponse.json({ ok: true, upserted: n })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    await notifyFailure(`[ai-usage web sync] 失敗: ${msg}`)
    return NextResponse.json({ ok: false, error: msg }, { status: 500 })
  }
}
