import { NextAuthOptions } from "next-auth"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"
import { verifyPassword } from "@/lib/auth"

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
  useSecureCookies: process.env.NEXTAUTH_URL?.startsWith('https://'),
  cookies: {
    sessionToken: {
      name: 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax', // 'lax' é mais compatível com navegadores antigos que 'strict'
        path: '/',
        secure: process.env.NEXTAUTH_URL?.startsWith('https://') ?? false,
        domain: undefined,
        // Remover maxAge para compatibilidade com navegadores antigos
      },
    },
    callbackUrl: {
      name: 'next-auth.callback-url',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NEXTAUTH_URL?.startsWith('https://') ?? false,
        domain: undefined,
      },
    },
    csrfToken: {
      name: 'next-auth.csrf-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NEXTAUTH_URL?.startsWith('https://') ?? false,
        domain: undefined,
      },
    },
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            console.log('❌ Credenciais incompletas')
            return null
          }

          const user = await prisma.user.findUnique({
            where: {
              email: credentials.email
            }
          })

          if (!user) {
            console.log(`❌ Usuário não encontrado: ${credentials.email}`)
            return null
          }

          if (!user.password) {
            console.log(`❌ Usuário sem senha: ${credentials.email}`)
            return null
          }

          if (!user.isActive) {
            console.log(`❌ Usuário inativo: ${credentials.email}`)
            return null
          }

          const isPasswordValid = await verifyPassword(
            credentials.password,
            user.password
          )

          if (!isPasswordValid) {
            console.log(`❌ Senha inválida para: ${credentials.email}`)
            return null
          }

          console.log(`✅ Login bem-sucedido: ${user.email} (${user.role})`)

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          }
        } catch (error) {
          console.error('❌ Erro na autenticação:', error)
          return null
        }
      }
    })
  ],
  session: {
    strategy: "jwt"
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!
        session.user.role = token.role as string
      }
      return session
    },
    async redirect({ url, baseUrl }) {
      // Garantir que redirecionamentos sempre usam a URL pública correta
      const publicUrl = process.env.NEXTAUTH_URL || baseUrl
      if (url.startsWith('/')) return `${publicUrl}${url}`
      if (new URL(url).origin === publicUrl) return url
      return publicUrl
    }
  },
  pages: {
    signIn: "/auth/signin",
  }
}



