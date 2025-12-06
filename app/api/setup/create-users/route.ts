import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'

/**
 * Endpoint para criar usuários padrão no banco de dados
 * 
 * IMPORTANTE: Este endpoint deve ser protegido em produção!
 * Recomendado: Adicionar token de autenticação ou remover após uso
 */
export async function GET(request: NextRequest) {
  try {
    // Verificar token de segurança (opcional, mas recomendado)
    const authHeader = request.headers.get('authorization')
    const expectedToken = process.env.SETUP_TOKEN || 'setup-secret-token-change-me'
    
    // Descomente para proteger o endpoint:
    // if (authHeader !== `Bearer ${expectedToken}`) {
    //   return NextResponse.json({ message: 'Não autorizado' }, { status: 401 })
    // }

    console.log('🔧 Criando usuários padrão...')
    
    // Validar DATABASE_URL antes de tentar usar o Prisma
    const databaseUrl = process.env.DATABASE_URL?.trim() || ''
    if (!databaseUrl) {
      return NextResponse.json({
        success: false,
        message: 'DATABASE_URL não configurada',
        error: 'A variável DATABASE_URL está vazia ou não existe no Railway',
        fix: 'Adicione DATABASE_URL no Railway → Serviço "web" → Variables → New Variable'
      }, { status: 500 })
    }
    
    if (!databaseUrl.startsWith('postgresql://') && !databaseUrl.startsWith('postgres://')) {
      return NextResponse.json({
        success: false,
        message: 'DATABASE_URL em formato inválido',
        error: `A URL deve começar com "postgresql://" ou "postgres://". Valor recebido: "${databaseUrl.substring(0, 50)}..."`,
        fix: 'Copie a URL completa do banco PostgreSQL no Railway. Ela deve começar com "postgresql://"',
        currentValue: databaseUrl.substring(0, 100)
      }, { status: 500 })
    }

    // CRÍTICO: Garantir que process.env.DATABASE_URL está correto ANTES de importar Prisma
    // Isso garante que o Prisma use a URL validada
    process.env.DATABASE_URL = databaseUrl.trim()
    
    // Importar Prisma DEPOIS de garantir que DATABASE_URL está correto
    const { prisma } = await import('@/lib/prisma')

    const hashedPassword = await bcrypt.hash('123456', 12)

    const users = [
      {
        name: 'Administrador',
        email: 'admin@centraldaspizzas.com',
        password: hashedPassword,
        role: 'ADMIN',
        phone: '(71) 99156-5893',
        isActive: true
      },
      {
        name: 'Gerente',
        email: 'gerente@centraldaspizzas.com',
        password: hashedPassword,
        role: 'MANAGER',
        phone: '(71) 99156-5894',
        isActive: true
      },
      {
        name: 'Caixa',
        email: 'caixa@centraldaspizzas.com',
        password: hashedPassword,
        role: 'CASHIER',
        phone: '(71) 99156-5895',
        isActive: true
      },
      {
        name: 'Cozinha',
        email: 'cozinha@centraldaspizzas.com',
        password: hashedPassword,
        role: 'KITCHEN',
        phone: '(71) 99156-5896',
        isActive: true
      }
    ]

    const createdUsers = []
    const existingUsers = []
    const errors = []

    for (const userData of users) {
      try {
        const existingUser = await prisma.user.findUnique({
          where: { email: userData.email }
        })

        if (!existingUser) {
          const user = await prisma.user.create({
            data: userData
          })
          createdUsers.push({
            name: user.name,
            email: user.email,
            role: user.role
          })
          console.log(`✅ Usuário criado: ${user.name} (${user.email})`)
        } else {
          existingUsers.push({
            name: existingUser.name,
            email: existingUser.email,
            role: existingUser.role
          })
          console.log(`⚠️ Usuário já existe: ${userData.email}`)
        }
      } catch (error) {
        let errorMessage = 'Erro desconhecido'
        if (error instanceof Error) {
          errorMessage = error.message
          // Detectar erros específicos de conexão
          if (error.message.includes('the URL must start with the protocol postgresql:// or postgres://')) {
            errorMessage = 'DATABASE_URL em formato inválido. A URL deve começar com "postgresql://" ou "postgres://"'
          } else if (error.message.includes('P1001') || error.message.includes('Can\'t reach database server')) {
            errorMessage = 'Não foi possível conectar ao banco de dados. Verifique se a URL está correta e o banco está ativo.'
          } else if (error.message.includes('P1000') || error.message.includes('Authentication failed')) {
            errorMessage = 'Falha na autenticação. Verifique se a senha na DATABASE_URL está correta.'
          }
        }
        errors.push({
          email: userData.email,
          error: errorMessage
        })
        console.error(`❌ Erro ao criar ${userData.email}:`, error)
      }
    }

    // Verificar variáveis de ambiente (já validado acima, mas vamos usar para diagnóstico)
    const databaseUrlTrimmed = databaseUrl.trim()
    
    // Diagnóstico detalhado da DATABASE_URL
    let databaseUrlStatus = '❌ Não configurado'
    let databaseUrlIssue = ''
    let databaseUrlFix = ''
    
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
    }
    
    const envCheck = {
      hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
      hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
      hasDatabaseUrl: !!databaseUrlTrimmed,
      nextAuthUrl: process.env.NEXTAUTH_URL || 'Não configurado',
      databaseUrlStatus,
      databaseUrlIssue,
      databaseUrlFix,
      databaseUrlPreview: databaseUrlTrimmed
        ? databaseUrlTrimmed.replace(/:[^:@]+@/, ':****@').substring(0, 80) + (databaseUrlTrimmed.length > 80 ? '...' : '')
        : 'Não configurado',
      databaseUrlLength: databaseUrlTrimmed.length,
      databaseUrlStartsWith: databaseUrlTrimmed.substring(0, 30),
      allDatabaseVars: Object.keys(process.env).filter(k => k.includes('DATABASE')).map(k => ({
        key: k,
        hasValue: !!process.env[k],
        preview: process.env[k]?.substring(0, 50) + (process.env[k] && process.env[k].length > 50 ? '...' : '')
      }))
    }

    return NextResponse.json({
      success: true,
      message: 'Processo de criação de usuários concluído',
      created: createdUsers,
      existing: existingUsers,
      errors: errors,
      credentials: {
        admin: {
          email: 'admin@centraldaspizzas.com',
          password: '123456'
        },
        gerente: {
          email: 'gerente@centraldaspizzas.com',
          password: '123456'
        },
        caixa: {
          email: 'caixa@centraldaspizzas.com',
          password: '123456'
        },
        cozinha: {
          email: 'cozinha@centraldaspizzas.com',
          password: '123456'
        }
      },
      environmentCheck: envCheck,
      loginInstructions: {
        message: 'Para fazer login, verifique se todas as variáveis estão configuradas:',
        required: [
          `NEXTAUTH_SECRET: ${envCheck.hasNextAuthSecret ? '✅ Configurado' : '❌ FALTANDO'}`,
          `NEXTAUTH_URL: ${envCheck.hasNextAuthUrl ? `✅ ${envCheck.nextAuthUrl}` : '❌ FALTANDO'}`,
          `DATABASE_URL: ${envCheck.databaseUrlStatus}`
        ],
        databaseUrlDetails: {
          status: envCheck.databaseUrlStatus,
          issue: envCheck.databaseUrlIssue,
          fix: envCheck.databaseUrlFix,
          preview: envCheck.databaseUrlPreview
        },
        howToFix: envCheck.databaseUrlStatus !== '✅ URL válida' ? {
          step1: 'Acesse Railway Dashboard → Seu projeto',
          step2: 'Clique no serviço PostgreSQL (banco de dados)',
          step3: 'Vá na aba "Variables"',
          step4: 'Procure por DATABASE_URL ou URL pública',
          step5: 'Copie a URL completa (deve começar com postgresql://)',
          step6: 'Volte para o serviço "web" (aplicação)',
          step7: 'Vá em "Variables" → Edite ou crie DATABASE_URL',
          step8: 'Cole a URL copiada do banco',
          step9: 'Salve e faça Redeploy do serviço "web"',
          step10: 'Aguarde 2-3 minutos e teste novamente'
        } : null
      }
    }, { status: 200 })

  } catch (error) {
    console.error('❌ Erro ao criar usuários:', error)
    return NextResponse.json({
      success: false,
      message: 'Erro ao criar usuários',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}

