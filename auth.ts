import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'

export const { handlers, auth, signIn, signOut } = NextAuth(() => ({
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
  ],
  pages: { signIn: '/signin' },
  callbacks: {
    signIn({ profile }) {
      const email = (profile?.email as string | undefined) ?? ''
      return email.endsWith('@malna.co.jp')
    },
    authorized({ auth: session, request }) {
      if (session?.user) return true
      const url = new URL('/signin', request.url)
      return Response.redirect(url)
    },
  },
}))
