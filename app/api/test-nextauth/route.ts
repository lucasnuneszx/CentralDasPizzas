import { NextResponse } from 'next/server'

export async function GET() {
  const checks = {
    hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
    hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
    nextAuthUrl: process.env.NEXTAUTH_URL || 'Não configurado',
    nextAuthSecretLength: process.env.NEXTAUTH_SECRET?.length || 0,
    nodeEnv: process.env.NODE_ENV,
    // Verificar se a URL é pública (não localhost)
    isPublicUrl: process.env.NEXTAUTH_URL?.startsWith('https://') && !process.env.NEXTAUTH_URL?.includes('localhost'),
    // Verificar se tem protocolo correto
    hasCorrectProtocol: process.env.NEXTAUTH_URL?.startsWith('https://') || process.env.NEXTAUTH_URL?.startsWith('http://'),
  }

  return NextResponse.json({
    success: true,
    message: 'Diagnóstico NextAuth',
    checks,
    recommendations: [
      !checks.hasNextAuthUrl && '❌ NEXTAUTH_URL não configurado - Configure no Railway',
      !checks.hasNextAuthSecret && '❌ NEXTAUTH_SECRET não configurado - Configure no Railway',
      !checks.isPublicUrl && '⚠️ NEXTAUTH_URL deve ser URL pública (https://...) e não localhost',
      checks.hasNextAuthUrl && checks.hasNextAuthSecret && checks.isPublicUrl && '✅ Configuração parece correta',
    ].filter(Boolean),
  })
}

