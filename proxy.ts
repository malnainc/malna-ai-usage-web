// Next.js 16: proxy.ts replaces middleware.ts
// next-auth v5: auth can be used directly as a proxy handler
import { auth } from '@/auth'

// auth handles authentication and redirects for protected routes
export { auth as proxy }

export const proxyConfig = {
  matcher: ['/((?!api/auth|api/sync|signin|_next/static|_next/image|favicon.ico).*)'],
}
