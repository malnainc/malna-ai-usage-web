import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export function GET() {
  return NextResponse.json({
    AUTH_GOOGLE_ID: process.env.AUTH_GOOGLE_ID ? `set(${process.env.AUTH_GOOGLE_ID.slice(0,20)}...)` : 'MISSING',
    AUTH_GOOGLE_SECRET: process.env.AUTH_GOOGLE_SECRET ? `set(${process.env.AUTH_GOOGLE_SECRET.length}chars)` : 'MISSING',
    AUTH_SECRET: process.env.AUTH_SECRET ? `set(${process.env.AUTH_SECRET.length}chars)` : 'MISSING',
    AUTH_URL: process.env.AUTH_URL || 'MISSING',
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'MISSING',
  })
}
