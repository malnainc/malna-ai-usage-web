// Next.js 16: proxy.ts replaces middleware.ts
// next-auth v4: use JWT token check (lightweight, no DB call)
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 認証不要パス
  const isPublic =
    pathname.startsWith('/signin') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/api/sync') ||
    pathname.startsWith('/api/og') ||
    pathname.startsWith('/api/cron') ||
    pathname.startsWith('/api/debug') ||
    pathname.startsWith('/_next')

  if (isPublic) return NextResponse.next()

  // JWT token確認（next-auth v4）
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET!,
  })

  if (!token) {
    const url = request.nextUrl.clone()
    url.pathname = '/signin'
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const proxyConfig = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
