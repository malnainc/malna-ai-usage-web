export { auth as middleware } from '@/auth'

export const config = {
  // /signin・認証API・cron同期・静的ファイルは保護対象外
  matcher: ['/((?!api/auth|api/sync|signin|_next/static|_next/image|favicon.ico).*)'],
}
