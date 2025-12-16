import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser, checkRole } from '@/lib/auth'
import { UserRole } from '@/types/user'

/**
 * Endpoint para adicionar colunas de hambúrguer diretamente no banco de dados
 * 
 * IMPORTANTE: Este endpoint deve ser protegido em produção!
 */
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json(
        { message: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Verificar se é admin
    if (!checkRole(user, UserRole.ADMIN)) {
      return NextResponse.json(
        { message: 'Acesso negado. Apenas administradores podem executar esta ação.' },
        { status: 403 }
      )
    }

    console.log('🔧 Iniciando adição de colunas de hambúrguer...')

    const results: string[] = []

    try {
      // Verificar qual banco está sendo usado
      const dbUrl = process.env.DATABASE_URL || ''
      const isPostgres = dbUrl.includes('postgresql') || dbUrl.includes('postgres')
      const isMySQL = dbUrl.includes('mysql')
      const isSQLite = dbUrl.includes('sqlite')

      if (isPostgres) {
        // PostgreSQL
        console.log('📊 Detectado PostgreSQL')

        // Verificar se coluna isBurger existe
        try {
          await prisma.$queryRaw`
            SELECT "isBurger" FROM "combos" LIMIT 1
          `
          results.push('✅ Coluna isBurger já existe')
        } catch (error: any) {
          if (error.message?.includes('does not exist') || error.message?.includes('column')) {
            await prisma.$executeRaw`
              ALTER TABLE "combos" ADD COLUMN "isBurger" BOOLEAN DEFAULT false
            `
            results.push('✅ Coluna isBurger criada')
          } else {
            throw error
          }
        }

        // Verificar se coluna burgerArtisanalPrice existe
        try {
          await prisma.$queryRaw`
            SELECT "burgerArtisanalPrice" FROM "combos" LIMIT 1
          `
          results.push('✅ Coluna burgerArtisanalPrice já existe')
        } catch (error: any) {
          if (error.message?.includes('does not exist') || error.message?.includes('column')) {
            await prisma.$executeRaw`
              ALTER TABLE "combos" ADD COLUMN "burgerArtisanalPrice" DOUBLE PRECISION
            `
            results.push('✅ Coluna burgerArtisanalPrice criada')
          } else {
            throw error
          }
        }

        // Verificar se coluna burgerIndustrialPrice existe
        try {
          await prisma.$queryRaw`
            SELECT "burgerIndustrialPrice" FROM "combos" LIMIT 1
          `
          results.push('✅ Coluna burgerIndustrialPrice já existe')
        } catch (error: any) {
          if (error.message?.includes('does not exist') || error.message?.includes('column')) {
            await prisma.$executeRaw`
              ALTER TABLE "combos" ADD COLUMN "burgerIndustrialPrice" DOUBLE PRECISION
            `
            results.push('✅ Coluna burgerIndustrialPrice criada')
          } else {
            throw error
          }
        }
      } else if (isMySQL) {
        // MySQL
        console.log('📊 Detectado MySQL')

        // Verificar e criar isBurger
        try {
          await prisma.$executeRaw`
            ALTER TABLE combos ADD COLUMN isBurger BOOLEAN DEFAULT false
          `
          results.push('✅ Coluna isBurger criada')
        } catch (error: any) {
          if (error.message?.includes('Duplicate column') || error.message?.includes('already exists')) {
            results.push('✅ Coluna isBurger já existe')
          } else {
            throw error
          }
        }

        // Verificar e criar burgerArtisanalPrice
        try {
          await prisma.$executeRaw`
            ALTER TABLE combos ADD COLUMN burgerArtisanalPrice DECIMAL(10, 2)
          `
          results.push('✅ Coluna burgerArtisanalPrice criada')
        } catch (error: any) {
          if (error.message?.includes('Duplicate column') || error.message?.includes('already exists')) {
            results.push('✅ Coluna burgerArtisanalPrice já existe')
          } else {
            throw error
          }
        }

        // Verificar e criar burgerIndustrialPrice
        try {
          await prisma.$executeRaw`
            ALTER TABLE combos ADD COLUMN burgerIndustrialPrice DECIMAL(10, 2)
          `
          results.push('✅ Coluna burgerIndustrialPrice criada')
        } catch (error: any) {
          if (error.message?.includes('Duplicate column') || error.message?.includes('already exists')) {
            results.push('✅ Coluna burgerIndustrialPrice já existe')
          } else {
            throw error
          }
        }
      } else if (isSQLite) {
        // SQLite - não suporta ALTER TABLE ADD COLUMN facilmente em algumas versões
        console.log('📊 Detectado SQLite')
        console.log('⚠️ SQLite requer migration manual. Execute: npx prisma migrate dev')
        results.push('⚠️ SQLite detectado. Execute manualmente: npx prisma migrate dev')
      } else {
        // Tentar genérico (funciona para a maioria dos bancos)
        console.log('📊 Tipo de banco não detectado, tentando genérico...')

        try {
          await prisma.$executeRaw`ALTER TABLE combos ADD COLUMN isBurger BOOLEAN DEFAULT false`
          results.push('✅ Coluna isBurger criada')
        } catch (error: any) {
          if (error.message?.includes('Duplicate') || error.message?.includes('already exists') || error.message?.includes('does not exist')) {
            results.push('✅ Coluna isBurger já existe ou erro ao criar')
          }
        }

        try {
          await prisma.$executeRaw`ALTER TABLE combos ADD COLUMN burgerArtisanalPrice FLOAT`
          results.push('✅ Coluna burgerArtisanalPrice criada')
        } catch (error: any) {
          if (error.message?.includes('Duplicate') || error.message?.includes('already exists') || error.message?.includes('does not exist')) {
            results.push('✅ Coluna burgerArtisanalPrice já existe ou erro ao criar')
          }
        }

        try {
          await prisma.$executeRaw`ALTER TABLE combos ADD COLUMN burgerIndustrialPrice FLOAT`
          results.push('✅ Coluna burgerIndustrialPrice criada')
        } catch (error: any) {
          if (error.message?.includes('Duplicate') || error.message?.includes('already exists') || error.message?.includes('does not exist')) {
            results.push('✅ Coluna burgerIndustrialPrice já existe ou erro ao criar')
          }
        }
      }

      console.log('✅ Colunas de hambúrguer adicionadas com sucesso!')
      
      return NextResponse.json({
        success: true,
        message: 'Colunas de hambúrguer adicionadas com sucesso!',
        results
      })
    } catch (error: any) {
      console.error('❌ Erro ao adicionar colunas:', error)
      return NextResponse.json(
        {
          success: false,
          message: 'Erro ao adicionar colunas',
          error: error.message,
          results
        },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('❌ Erro na autenticação:', error)
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

