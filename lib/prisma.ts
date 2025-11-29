import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Função para validar e obter DATABASE_URL
function getDatabaseUrl(): string {
  // Tentar múltiplas formas de obter a variável
  const databaseUrl = process.env.DATABASE_URL?.trim() || ''
  
  // Log para debug (sem mostrar a senha completa)
  if (databaseUrl) {
    const urlPreview = databaseUrl.replace(/:[^:@]+@/, ':****@')
    console.log('📊 DATABASE_URL detectada:', urlPreview.substring(0, 80) + '...')
  } else {
    console.error('❌ DATABASE_URL não encontrada em process.env')
    console.error('Variáveis disponíveis:', Object.keys(process.env).filter(k => k.includes('DATABASE')))
  }

  if (!databaseUrl) {
    const error = 'DATABASE_URL environment variable is not set. Verifique se a variável está configurada no Railway no serviço "web".'
    console.error('❌', error)
    throw new Error(error)
  }

  // Validar formato
  if (!databaseUrl.startsWith('postgresql://') && !databaseUrl.startsWith('postgres://')) {
    const error = `DATABASE_URL deve começar com postgresql:// ou postgres://. Valor recebido: ${databaseUrl.substring(0, 50)}...`
    console.error('❌', error)
    throw new Error(error)
  }

  return databaseUrl
}

// Obter DATABASE_URL validada
let databaseUrl: string
try {
  databaseUrl = getDatabaseUrl()
} catch (error) {
  // Em desenvolvimento, permitir continuar sem DATABASE_URL (usará SQLite)
  if (process.env.NODE_ENV === 'development') {
    console.warn('⚠️ DATABASE_URL não configurada, mas continuando em modo desenvolvimento')
    databaseUrl = 'file:./prisma/dev.db'
  } else {
    throw error
  }
}

// Criar Prisma Client com configuração apropriada
export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: databaseUrl
    }
  }
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma


