import { NextRequest, NextResponse } from 'next/server'

/**
 * Endpoint para testar conexão com o banco de dados
 * Acesse: /api/setup/test-connection
 */
export async function GET(request: NextRequest) {
  try {
    const databaseUrl = process.env.DATABASE_URL || ''
    const databaseUrlTrimmed = databaseUrl.trim()
    
    // Informações sobre a URL
    const urlInfo = {
      exists: !!databaseUrlTrimmed,
      length: databaseUrlTrimmed.length,
      startsWith: databaseUrlTrimmed.substring(0, 20),
      preview: databaseUrlTrimmed.replace(/:[^:@]+@/, ':****@').substring(0, 100),
      firstChars: databaseUrlTrimmed.substring(0, 30).split('').map((c, i) => ({
        index: i,
        char: c,
        code: c.charCodeAt(0),
        isWhitespace: /\s/.test(c),
        isPrintable: c >= ' ' && c <= '~'
      })),
      hasPostgresql: databaseUrlTrimmed.startsWith('postgresql://'),
      hasPostgres: databaseUrlTrimmed.startsWith('postgres://'),
      isValidFormat: databaseUrlTrimmed.startsWith('postgresql://') || databaseUrlTrimmed.startsWith('postgres://')
    }
    
    // Tentar importar e conectar
    let connectionResult = {
      success: false,
      error: '',
      details: {} as any
    }
    
    if (urlInfo.isValidFormat) {
      try {
        // Tentar importar o Prisma
        const { prisma } = await import('@/lib/prisma')
        
        // Tentar conectar
        await prisma.$connect()
        
        // Testar uma query simples
        const result = await prisma.$queryRaw`SELECT 1 as test`
        
        // Desconectar
        await prisma.$disconnect()
        
        connectionResult = {
          success: true,
          error: '',
          details: {
            message: 'Conexão bem-sucedida!',
            testQuery: result
          }
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
        const errorStack = error instanceof Error ? error.stack : ''
        
        connectionResult = {
          success: false,
          error: errorMessage,
          details: {
            errorType: error instanceof Error ? error.constructor.name : 'Unknown',
            errorCode: error instanceof Error && 'code' in error ? (error as any).code : 'N/A',
            errorStack: errorStack?.substring(0, 500),
            // Detectar tipos específicos de erro
            isAuthError: errorMessage.toLowerCase().includes('password') || 
                        errorMessage.toLowerCase().includes('authentication') ||
                        errorMessage.toLowerCase().includes('auth'),
            isConnectionError: errorMessage.toLowerCase().includes('connect') ||
                             errorMessage.toLowerCase().includes('timeout') ||
                             errorMessage.toLowerCase().includes('refused'),
            isUrlError: errorMessage.toLowerCase().includes('url') ||
                       errorMessage.toLowerCase().includes('protocol')
          }
        }
      }
    } else {
      connectionResult = {
        success: false,
        error: 'URL não está no formato correto',
        details: {
          message: 'A URL deve começar com postgresql:// ou postgres://',
          receivedStart: urlInfo.startsWith
        }
      }
    }
    
    return NextResponse.json({
      success: connectionResult.success,
      message: connectionResult.success 
        ? '✅ Conexão com o banco de dados bem-sucedida!' 
        : '❌ Erro ao conectar com o banco de dados',
      urlInfo,
      connection: connectionResult,
      recommendations: !connectionResult.success ? {
        ifAuthError: 'Verifique se a senha na DATABASE_URL está correta. Compare com a senha em PGPASSWORD no serviço PostgreSQL.',
        ifConnectionError: 'Verifique se a URL pública está correta e o banco está online.',
        ifUrlError: 'Verifique se a URL começa com postgresql:// ou postgres:// e não tem espaços ou caracteres estranhos.',
        general: [
          '1. No Railway → Serviço PostgreSQL → Variables',
          '2. Copie o valor de DATABASE_PUBLIC_URL (não DATABASE_URL interna)',
          '3. No Railway → Serviço web → Variables',
          '4. Edite DATABASE_URL e cole a URL pública',
          '5. Certifique-se de que a senha está idêntica',
          '6. Faça redeploy do serviço web'
        ]
      } : null
    }, { status: connectionResult.success ? 200 : 500 })
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: 'Erro ao testar conexão',
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}

