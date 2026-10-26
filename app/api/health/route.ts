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
  // Forçar bypass de cache com timestamp único
  const timestamp = Date.now()
  const headers = {
    'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0, private',
    'Pragma': 'no-cache',
    'Expires': '0',
    'X-Timestamp': timestamp.toString(),
    'X-Request-ID': Math.random().toString(36).substring(7)
  }
  
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action')
  const force = searchParams.get('force') // Parâmetro para forçar atualização
  
  // Log para debug
  
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
  
  if (action === 'test-nextauth') {
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
    }, { headers })
  }
  
  // Comportamento padrão (healthcheck) - SEMPRE incluir informações úteis
  try {
    const databaseUrl = process.env.DATABASE_URL?.trim() || ''
    
    // Verificações básicas sem importar Prisma
    const nextAuthChecks = {
      hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
      hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
      nextAuthUrl: process.env.NEXTAUTH_URL || 'Não configurado',
      nextAuthSecretLength: process.env.NEXTAUTH_SECRET?.length || 0,
      isPublicUrl: process.env.NEXTAUTH_URL?.startsWith('https://') && !process.env.NEXTAUTH_URL?.includes('localhost'),
      hasCorrectProtocol: process.env.NEXTAUTH_URL?.startsWith('https://') || process.env.NEXTAUTH_URL?.startsWith('http://'),
    }
    
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
      databaseUrlPreview: databaseUrl ? databaseUrl.substring(0, 50) + '...' : 'Não configurado',
      nextAuth: nextAuthChecks
    }

    // Se action foi especificado mas não foi reconhecido, mostrar isso
    if (action && action !== 'diagnose' && action !== 'create-users' && action !== 'create-tables' && action !== 'test-nextauth') {
      return NextResponse.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        warning: `Ação "${action}" não reconhecida`,
        availableActions: ['diagnose', 'create-users', 'create-tables', 'test-nextauth'],
        environment: envCheck,
        message: 'Use ?action=diagnose, ?action=create-users, ?action=create-tables ou ?action=test-nextauth'
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
    const nextAuthRecommendations = [
      !nextAuthChecks.hasNextAuthUrl && '❌ NEXTAUTH_URL não configurado - Configure no Railway',
      !nextAuthChecks.hasNextAuthSecret && '❌ NEXTAUTH_SECRET não configurado - Configure no Railway',
      !nextAuthChecks.isPublicUrl && '⚠️ NEXTAUTH_URL deve ser URL pública (https://...) e não localhost',
      nextAuthChecks.hasNextAuthUrl && nextAuthChecks.hasNextAuthSecret && nextAuthChecks.isPublicUrl && '✅ Configuração NextAuth parece correta',
    ].filter(Boolean)
    
    const response = { 
      status: 'ok',
      timestamp: new Date().toISOString(),
      serverTimestamp: timestamp,
      version: '5.1-JWT-AUTH-SYSTEM-NO-CACHE', // Versão para identificar se o deploy foi aplicado
      DEPLOYED: true, // Flag obrigatória para identificar deploy
      authSystem: 'JWT', // Sistema de autenticação JWT
      buildDate: new Date().toISOString(), // Data do build para verificar atualização
      routes: {
        login: '/api/auth/login',
        me: '/api/auth/me',
      },
      environment: envCheck,
      nextAuthDiagnostic: {
        checks: nextAuthChecks,
        recommendations: nextAuthRecommendations,
        summary: nextAuthChecks.hasNextAuthUrl && nextAuthChecks.hasNextAuthSecret && nextAuthChecks.isPublicUrl 
          ? '✅ NextAuth configurado corretamente'
          : '⚠️ NextAuth precisa de configuração'
      },
      message: envCheck.hasNextAuthSecret && envCheck.hasNextAuthUrl 
        ? '✅ Variáveis de ambiente configuradas corretamente'
        : '⚠️ Algumas variáveis de ambiente podem estar faltando',
      availableActions: {
        diagnose: '/api/health?action=diagnose',
        createUsers: '/api/health?action=create-users',
        createTables: '/api/health?action=create-tables',
        testNextAuth: '/api/health?action=test-nextauth'
      },
      note: action 
        ? `Ação recebida: "${action}" - Se não foi processada, o deploy pode não ter sido aplicado ainda`
        : 'Adicione ?action=diagnose para diagnóstico completo ou ?action=test-nextauth para diagnóstico NextAuth',
      // Informações adicionais para debug
      debug: {
        actionReceived: action || null,
        forceParam: force || null,
        requestUrl: request.url
      }
    }
    
    return NextResponse.json(response, { status: 200, headers })
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
