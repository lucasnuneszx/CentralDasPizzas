import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Validar DATABASE_URL antes de criar Prisma Client
const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  console.error('❌ DATABASE_URL não está configurada!')
  throw new Error('DATABASE_URL environment variable is not set')
}

if (!databaseUrl.startsWith('postgresql://') && !databaseUrl.startsWith('postgres://')) {
  console.error('❌ DATABASE_URL deve começar com postgresql:// ou postgres://')
  console.error('DATABASE_URL atual:', databaseUrl.substring(0, 50) + '...')
  throw new Error('DATABASE_URL must start with postgresql:// or postgres://')
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma


