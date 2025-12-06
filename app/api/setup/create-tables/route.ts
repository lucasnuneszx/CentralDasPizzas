import { NextRequest, NextResponse } from 'next/server'
import { execSync } from 'child_process'

/**
 * Endpoint para criar as tabelas no banco de dados
 * 
 * IMPORTANTE: Este endpoint deve ser protegido em produção!
 */
export async function GET(request: NextRequest) {
  try {
    console.log('🗄️ Criando tabelas no banco de dados...')

    // Verificar se DATABASE_URL está configurada
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({
        success: false,
        message: 'DATABASE_URL não configurada',
        error: 'Configure DATABASE_URL nas variáveis de ambiente'
      }, { status: 500 })
    }

    // Validar formato da URL
    if (!process.env.DATABASE_URL.startsWith('postgresql://') && 
        !process.env.DATABASE_URL.startsWith('postgres://')) {
      return NextResponse.json({
        success: false,
        message: 'DATABASE_URL inválida',
        error: 'A URL deve começar com postgresql:// ou postgres://'
      }, { status: 500 })
    }

    console.log('📊 DATABASE_URL configurada:', process.env.DATABASE_URL.substring(0, 50) + '...')

    // Executar prisma db push
    try {
      console.log('🔄 Executando prisma db push...')
      execSync('npx prisma db push --accept-data-loss --skip-generate', {
        stdio: 'inherit',
        env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL },
        cwd: process.cwd()
      })
      console.log('✅ Tabelas criadas com sucesso!')
    } catch (error: any) {
      console.error('❌ Erro ao criar tabelas:', error.message)
      return NextResponse.json({
        success: false,
        message: 'Erro ao criar tabelas',
        error: error.message,
        details: 'Verifique os logs para mais informações'
      }, { status: 500 })
    }

    // Verificar se as tabelas foram criadas
    try {
      // Usar o Prisma Client exportado que já tem a URL validada
      const { prisma } = await import('@/lib/prisma')
      const result = await prisma.$queryRaw`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        ORDER BY table_name
      `
      await prisma.$disconnect()

      const tables = (result as any[]).map((r: any) => r.table_name)

      return NextResponse.json({
        success: true,
        message: 'Tabelas criadas com sucesso!',
        tables: tables,
        tableCount: tables.length,
        nextSteps: [
          'Acesse /api/setup/create-users para criar usuários',
          'Acesse /api/setup/populate-menu para popular cardápio',
          'Acesse /api/setup/populate-pizzas para popular pizzas'
        ]
      }, { status: 200 })

    } catch (error: any) {
      console.error('❌ Erro ao verificar tabelas:', error.message)
      return NextResponse.json({
        success: true,
        message: 'Tabelas podem ter sido criadas, mas não foi possível verificar',
        error: error.message,
        nextSteps: [
          'Tente acessar /api/setup/create-users',
          'Se der erro, verifique os logs'
        ]
      }, { status: 200 })
    }

  } catch (error) {
    console.error('❌ Erro ao criar tabelas:', error)
    return NextResponse.json({
      success: false,
      message: 'Erro ao criar tabelas',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}

