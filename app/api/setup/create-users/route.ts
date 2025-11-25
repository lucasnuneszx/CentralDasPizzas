import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
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
        errors.push({
          email: userData.email,
          error: error instanceof Error ? error.message : 'Erro desconhecido'
        })
        console.error(`❌ Erro ao criar ${userData.email}:`, error)
      }
    }

    // Verificar variáveis de ambiente
    const envCheck = {
      hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
      hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      nextAuthUrl: process.env.NEXTAUTH_URL || 'Não configurado',
      databaseUrlPreview: process.env.DATABASE_URL 
        ? (process.env.DATABASE_URL.includes('postgres.railway.internal') 
          ? '❌ URL INTERNA (errado!)' 
          : '✅ URL pública')
        : 'Não configurado'
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
          `DATABASE_URL: ${envCheck.hasDatabaseUrl ? envCheck.databaseUrlPreview : '❌ FALTANDO'}`
        ]
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

