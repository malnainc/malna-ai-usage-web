// next-auth v4 configuration
import { type NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  pages: { signIn: '/signin' },
  callbacks: {
    async signIn({ profile }) {
      // TODO: 動作確認後に @malna.co.jp 制限を戻す
      const email = (profile?.email as string | undefined) ?? ''
      console.log('[signIn callback] email:', email)
      return true // 一時的に全員許可してOAuthフロー自体を確認
    },
  },
}
