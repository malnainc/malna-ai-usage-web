import { signIn } from '@/auth'

export default function SignIn() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="bg-surface border border-border rounded-2xl p-10 w-full max-w-sm text-center shadow-sm space-y-6">
        <div className="flex items-center justify-center gap-2.5">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-brand" />
          <h1 className="text-base font-bold">malna AI活用量ダッシュボード</h1>
        </div>
        <p className="text-sm text-muted">
          malnaのGoogleアカウント（@malna.co.jp）でログインしてください。
        </p>
        <form
          action={async () => {
            'use server'
            await signIn('google', { redirectTo: '/' })
          }}
        >
          <button
            type="submit"
            className="w-full border border-border rounded-xl px-4 py-2.5 text-sm font-medium hover:bg-brand-soft transition-colors"
          >
            Googleでログイン
          </button>
        </form>
        <p className="text-xs text-muted">
          @malna.co.jp 以外のアカウントはアクセスできません。
        </p>
      </div>
    </div>
  )
}
