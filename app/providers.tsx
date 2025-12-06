'use client'

import { SessionProvider } from 'next-auth/react'
import { Toaster } from 'react-hot-toast'
import { ThemeProvider } from 'next-themes'

export function Providers({ children }: { children: React.ReactNode }) {
  // Obter a URL base correta (pública) para NextAuth
  const baseUrl = typeof window !== 'undefined' 
    ? window.location.origin 
    : process.env.NEXTAUTH_URL || 'https://centraldaspizzas.up.railway.app'

  return (
    <SessionProvider baseUrl={baseUrl}>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
        {children}
        <Toaster position="top-right" />
      </ThemeProvider>
    </SessionProvider>
  )
}


