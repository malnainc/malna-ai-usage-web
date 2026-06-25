import 'server-only'
import { google } from 'googleapis'
import type { UsageRow } from './types'
import { parseUsageRows } from './parseRows'

export async function readSheetRows(): Promise<UsageRow[]> {
  const rawJson = process.env.GOOGLE_SA_JSON
  const sheetId = process.env.SHEET_ID
  if (!rawJson) throw new Error('GOOGLE_SA_JSON is not set')
  if (!sheetId) throw new Error('SHEET_ID is not set')

  let creds: Record<string, unknown>
  try {
    creds = JSON.parse(rawJson)
  } catch {
    throw new Error('GOOGLE_SA_JSON is not valid JSON')
  }

  const auth = new google.auth.GoogleAuth({
    credentials: creds,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  })
  const sheets = google.sheets({ version: 'v4', auth })
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: 'raw!A1:Z',
    valueRenderOption: 'UNFORMATTED_VALUE',
  })
  return parseUsageRows((res.data.values ?? []) as unknown[][])
}
