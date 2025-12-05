import { NextRequest, NextResponse } from 'next/server'

/**
 * Endpoint de diagnóstico para verificar configuração do ambiente
 * Acesse: /api/setup/diagnose
 */
export async function GET(request: NextRequest) {
  try {
    const databaseUrl = process.env.DATABASE_URL?.trim() || ''
    const databaseUrlTrimmed = databaseUrl.trim()
    
    // Diagnóstico detalhado da DATABASE_URL
    let databaseUrlStatus = '❌ Não configurado'
    let databaseUrlIssue = ''
    let databaseUrlFix = ''
    let canConnect = false
    
    if (!databaseUrlTrimmed) {
      databaseUrlStatus = '❌ Não configurado'
      databaseUrlIssue = 'A variável DATABASE_URL está vazia ou não existe'
      databaseUrlFix = 'Adicione DATABASE_URL no Railway → Serviço "web" → Variables'
    } else if (!databaseUrlTrimmed.startsWith('postgresql://') && !databaseUrlTrimmed.startsWith('postgres://')) {
      databaseUrlStatus = '❌ Formato inválido'
      databaseUrlIssue = `A URL não começa com "postgresql://" ou "postgres://". Início recebido: "${databaseUrlTrimmed.substring(0, 30)}"`
      databaseUrlFix = 'A URL deve começar com "postgresql://" ou "postgres://". Verifique se copiou a URL completa do banco PostgreSQL no Railway.'
    } else if (databaseUrlTrimmed.includes('postgres.railway.internal')) {
      databaseUrlStatus = '❌ URL INTERNA (não funciona)'
      databaseUrlIssue = 'A URL usa "postgres.railway.internal" que é uma URL interna e não funciona para o serviço web'
      databaseUrlFix = 'Use a URL pública do banco. No Railway → Banco PostgreSQL → Variables, procure por uma URL com domínio público (ex: "trolley.proxy.rlwy.net" ou similar)'
    } else {
      databaseUrlStatus = '✅ URL válida'
      canConnect = true
    }
    
    // Tentar conectar ao banco (sem mostrar erros detalhados)
    let connectionTest = { success: false, error: '', details: {} as any }
    if (canConnect) {
      try {
        const { prisma } = await import('@/lib/prisma')
        await prisma.$connect()
        // Testar uma query simples
        await prisma.$queryRaw`SELECT 1`
        await prisma.$disconnect()
        connectionTest = { success: true, error: '', details: { message: 'Conexão bem-sucedida' } }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido ao conectar'
        connectionTest = {
          success: false,
          error: errorMessage,
          details: {
            errorType: error instanceof Error ? error.constructor.name : 'Unknown',
            errorCode: error instanceof Error && 'code' in error ? (error as any).code : 'N/A',
            fullError: errorMessage.substring(0, 500) // Limitar tamanho
          }
        }
      }
    }
    
    const envCheck = {
      hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
      hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
      hasDatabaseUrl: !!databaseUrlTrimmed,
      nextAuthUrl: process.env.NEXTAUTH_URL || 'Não configurado',
      nextAuthSecretPreview: process.env.NEXTAUTH_SECRET 
        ? `${process.env.NEXTAUTH_SECRET.substring(0, 10)}...` 
        : 'Não configurado',
      databaseUrlStatus,
      databaseUrlIssue,
      databaseUrlFix,
      databaseUrlPreview: databaseUrlTrimmed
        ? databaseUrlTrimmed.replace(/:[^:@]+@/, ':****@').substring(0, 80) + (databaseUrlTrimmed.length > 80 ? '...' : '')
        : 'Não configurado',
      databaseUrlLength: databaseUrlTrimmed.length,
      databaseUrlStartsWith: databaseUrlTrimmed.substring(0, 30),
      databaseUrlFirstChars: databaseUrlTrimmed.substring(0, 20).split('').map(c => ({
        char: c,
        code: c.charCodeAt(0),
        isWhitespace: /\s/.test(c)
      })),
      databaseUrlRaw: databaseUrlTrimmed.replace(/:[^:@]+@/, ':****@'),
      connectionTest,
      allDatabaseVars: Object.keys(process.env).filter(k => k.includes('DATABASE')).map(k => ({
        key: k,
        hasValue: !!process.env[k],
        preview: process.env[k]?.substring(0, 50) + (process.env[k] && process.env[k].length > 50 ? '...' : '')
      }))
    }
    
    const allOk = envCheck.hasNextAuthSecret && 
                  envCheck.hasNextAuthUrl && 
                  envCheck.databaseUrlStatus === '✅ URL válida' &&
                  connectionTest.success
    
    return NextResponse.json({
      success: allOk,
      message: allOk 
        ? '✅ Todas as configurações estão corretas!' 
        : '⚠️ Algumas configurações precisam ser corrigidas',
      environment: envCheck,
      instructions: {
        message: 'Para corrigir problemas, siga os passos abaixo:',
        steps: envCheck.databaseUrlStatus !== '✅ URL válida' ? [
          '1. Acesse Railway Dashboard → Seu projeto',
          '2. Clique no serviço PostgreSQL (banco de dados)',
          '3. Vá na aba "Variables"',
          '4. Procure por DATABASE_URL ou URL pública (deve começar com postgresql://)',
          '5. Copie a URL completa',
          '6. Volte para o serviço "web" (aplicação)',
          '7. Vá em "Variables" → Edite ou crie DATABASE_URL',
          '8. Cole a URL copiada do banco',
          '9. Salve e faça Redeploy do serviço "web"',
          '10. Aguarde 2-3 minutos e teste novamente'
        ] : connectionTest.success ? [
          '✅ Tudo configurado corretamente!',
          'Você pode criar usuários acessando: /api/setup/create-users'
        ] : [
          '⚠️ DATABASE_URL está no formato correto, mas não consegue conectar',
          'Verifique se:',
          '- A senha na URL está correta',
          '- O banco está ativo no Railway',
          '- A URL pública está acessível'
        ]
      }
    }, { status: allOk ? 200 : 500 })
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: 'Erro ao diagnosticar ambiente',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}

