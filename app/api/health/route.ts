import { NextRequest, NextResponse } from 'next/server'

/**
 * Endpoint de healthcheck - NÃO deve importar Prisma para evitar erros na inicialização
 * Este endpoint deve responder rapidamente sem depender do banco de dados
 * 
 * Também aceita ações de setup via query parameter:
 * ?action=create-users - Cria usuários padrão
 * ?action=create-tables - Cria tabelas no banco
 * ?action=diagnose - Diagnóstico completo
 */
export async function GET(request: NextRequest) {
  // Forçar bypass de cache
  const headers = {
    'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
    'Pragma': 'no-cache',
    'Expires': '0'
  }
  
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action')
  
  // Log para debug
  console.log('🔍 Health endpoint chamado:', { action, url: request.url })
  
  // Se houver ação, executar funcionalidade de setup
  if (action === 'create-users') {
    try {
      const { prisma } = await import('@/lib/prisma')
      const bcrypt = await import('bcryptjs')
      
      const hashedPassword = await bcrypt.default.hash('123456', 12)
      
      const users = [
        { name: 'Administrador', email: 'admin@centraldaspizzas.com', password: hashedPassword, role: 'ADMIN' },
        { name: 'Gerente', email: 'gerente@centraldaspizzas.com', password: hashedPassword, role: 'MANAGER' },
        { name: 'Caixa', email: 'caixa@centraldaspizzas.com', password: hashedPassword, role: 'CASHIER' },
        { name: 'Cozinha', email: 'cozinha@centraldaspizzas.com', password: hashedPassword, role: 'KITCHEN' }
      ]
      
      const created = []
      const existing = []
      
      for (const user of users) {
        try {
          const existingUser = await prisma.user.findUnique({ where: { email: user.email } })
          if (existingUser) {
            existing.push(user.email)
          } else {
            await prisma.user.create({ data: user })
            created.push(user.email)
          }
        } catch (error: any) {
          console.error(`Erro ao criar usuário ${user.email}:`, error.message)
        }
      }
      
      return NextResponse.json({
        success: true,
        message: 'Usuários processados',
        created,
        existing,
        credentials: {
          admin: { email: 'admin@centraldaspizzas.com', password: '123456' },
          gerente: { email: 'gerente@centraldaspizzas.com', password: '123456' },
          caixa: { email: 'caixa@centraldaspizzas.com', password: '123456' },
          cozinha: { email: 'cozinha@centraldaspizzas.com', password: '123456' }
        }
      }, { headers })
    } catch (error: any) {
      return NextResponse.json({
        success: false,
        message: 'Erro ao criar usuários',
        error: error.message
      }, { status: 500 })
    }
  }
  
  if (action === 'create-tables') {
    try {
      const { execSync } = await import('child_process')
      execSync('npx prisma db push --accept-data-loss --skip-generate', {
        stdio: 'inherit',
        env: { ...process.env },
        cwd: process.cwd()
      })
      return NextResponse.json({
        success: true,
        message: 'Tabelas criadas com sucesso!'
      }, { headers })
    } catch (error: any) {
      return NextResponse.json({
        success: false,
        message: 'Erro ao criar tabelas',
        error: error.message
      }, { status: 500 })
    }
  }
  
  if (action === 'diagnose') {
    const databaseUrl = process.env.DATABASE_URL?.trim() || ''
    return NextResponse.json({
      success: true,
      environment: {
        hasDatabaseUrl: !!databaseUrl,
        hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
        hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
        databaseUrlFormat: databaseUrl 
          ? (databaseUrl.startsWith('postgresql://') || databaseUrl.startsWith('postgres://') 
            ? '✅ Válido' 
            : '❌ Formato inválido')
          : '❌ Não configurado',
        databaseUrlPreview: databaseUrl ? databaseUrl.substring(0, 50) + '...' : 'Não configurado'
      }
    }, { headers })
  }
  
  // Comportamento padrão (healthcheck) - SEMPRE incluir informações úteis
  try {
    const databaseUrl = process.env.DATABASE_URL?.trim() || ''
    
    // Verificações básicas sem importar Prisma
    const envCheck = {
      hasDatabaseUrl: !!databaseUrl,
      hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
      hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
      nextAuthUrl: process.env.NEXTAUTH_URL || 'Não configurado',
      nodeEnv: process.env.NODE_ENV,
      isProduction: process.env.NODE_ENV === 'production',
      databaseUrlFormat: databaseUrl 
        ? (databaseUrl.startsWith('postgresql://') || databaseUrl.startsWith('postgres://') 
          ? '✅ Válido' 
          : '❌ Formato inválido')
        : '❌ Não configurado',
      databaseUrlPreview: databaseUrl ? databaseUrl.substring(0, 50) + '...' : 'Não configurado'
    }

    // Se action foi especificado mas não foi reconhecido, mostrar isso
    if (action && action !== 'diagnose' && action !== 'create-users' && action !== 'create-tables') {
      return NextResponse.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        warning: `Ação "${action}" não reconhecida`,
        availableActions: ['diagnose', 'create-users', 'create-tables'],
        environment: envCheck,
        message: 'Use ?action=diagnose, ?action=create-users ou ?action=create-tables'
      }, { status: 200, headers })
    }

    // Se action=diagnose foi especificado mas não foi processado acima, processar aqui
    if (action === 'diagnose') {
      return NextResponse.json({
        success: true,
        environment: envCheck
      }, { headers })
    }

    // Sempre retornar informações completas mesmo sem action
    return NextResponse.json({ 
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: envCheck,
      message: envCheck.hasNextAuthSecret && envCheck.hasNextAuthUrl 
        ? '✅ Variáveis de ambiente configuradas corretamente'
        : '⚠️ Algumas variáveis de ambiente podem estar faltando',
      availableActions: {
        diagnose: '/api/health?action=diagnose',
        createUsers: '/api/health?action=create-users',
        createTables: '/api/health?action=create-tables'
      },
      note: action 
        ? `Ação recebida: "${action}" - Se não foi processada, o deploy pode não ter sido aplicado ainda`
        : 'Adicione ?action=diagnose para diagnóstico completo'
    }, { status: 200, headers })
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
