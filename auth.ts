import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google],
  pages: { signIn: '/signin' },
  callbacks: {
    // OAuth成功時: @malna.co.jp ドメインのみ許可
    signIn({ profile }) {
      const email = (profile?.email as string | undefined) ?? ''
      return email.endsWith('@malna.co.jp')
    },
    // middlewareでの保護: 未認証はsigninにリダイレクト
    authorized({ auth, request }) {
      if (auth?.user) return true
      const url = new URL('/signin', request.url)
      return Response.redirect(url)
    },
  },
})
