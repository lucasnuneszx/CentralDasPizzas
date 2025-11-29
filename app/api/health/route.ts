import { NextResponse } from 'next/server'

export async function GET() {
  const envCheck = {
    hasDatabaseUrl: !!process.env.DATABASE_URL,
    hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
    hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
    nextAuthUrl: process.env.NEXTAUTH_URL || 'Não configurado',
    nodeEnv: process.env.NODE_ENV,
    isProduction: process.env.NODE_ENV === 'production',
  }

  return NextResponse.json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: envCheck,
    message: envCheck.hasNextAuthSecret && envCheck.hasNextAuthUrl 
      ? '✅ Variáveis de ambiente configuradas corretamente'
      : '⚠️ Algumas variáveis de ambiente podem estar faltando'
  })
}
