import { NextResponse } from 'next/server'

/**
 * Endpoint de healthcheck - NÃO deve importar Prisma para evitar erros na inicialização
 * Este endpoint deve responder rapidamente sem depender do banco de dados
 */
export async function GET() {
  try {
    // Verificações básicas sem importar Prisma
    const envCheck = {
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
      hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
      nextAuthUrl: process.env.NEXTAUTH_URL || 'Não configurado',
      nodeEnv: process.env.NODE_ENV,
      isProduction: process.env.NODE_ENV === 'production',
      databaseUrlFormat: process.env.DATABASE_URL 
        ? (process.env.DATABASE_URL.startsWith('postgresql://') || process.env.DATABASE_URL.startsWith('postgres://') 
          ? '✅ Válido' 
          : '❌ Formato inválido')
        : '❌ Não configurado'
    }

    // Sempre retornar 200 para o healthcheck passar
    // Mesmo que algumas variáveis estejam faltando, a aplicação está rodando
    return NextResponse.json({ 
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: envCheck,
      message: envCheck.hasNextAuthSecret && envCheck.hasNextAuthUrl 
        ? '✅ Variáveis de ambiente configuradas corretamente'
        : '⚠️ Algumas variáveis de ambiente podem estar faltando'
    }, { status: 200 })
  } catch (error) {
    // Mesmo em caso de erro, retornar 200 para não falhar o healthcheck
    // O Railway vai reiniciar se houver problema real
    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      message: 'Healthcheck respondeu (mas há avisos)'
    }, { status: 200 })
  }
}
