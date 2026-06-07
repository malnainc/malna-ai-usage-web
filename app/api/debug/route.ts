import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export function GET() {
  return NextResponse.json({
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? `set(${process.env.GOOGLE_CLIENT_ID.slice(0, 15)}...)` : 'MISSING',
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ? `set(${process.env.GOOGLE_CLIENT_SECRET.length}chars)` : 'MISSING',
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? `set(${process.env.NEXTAUTH_SECRET.length}chars)` : 'MISSING',
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'MISSING',
    AUTH_URL: process.env.AUTH_URL || 'MISSING',
  })
}
