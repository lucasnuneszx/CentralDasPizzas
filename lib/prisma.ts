import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Função para validar e obter DATABASE_URL
function getDatabaseUrl(): string {
  // Tentar múltiplas formas de obter a variável
  let databaseUrl = process.env.DATABASE_URL || ''
  
  // IMPORTANTE: NÃO usar .trim() ou .replace(/\s+/g, '') pois isso pode alterar a senha!
  // Apenas remover quebras de linha e espaços APENAS no início e fim
  // Remover quebras de linha do final (comum no Railway)
  databaseUrl = databaseUrl.replace(/\r\n$/, '').replace(/\n$/, '').replace(/\r$/, '')
  // Remover espaços APENAS no início e fim (não no meio, onde está a senha)
  databaseUrl = databaseUrl.trimStart().trimEnd()
  
  // Log para debug (sem mostrar a senha completa)
  if (databaseUrl) {
    const urlPreview = databaseUrl.replace(/:[^:@]+@/, ':****@')
    console.log('📊 DATABASE_URL detectada:', urlPreview.substring(0, 80) + '...')
    console.log('📊 DATABASE_URL length:', databaseUrl.length)
    console.log('📊 DATABASE_URL starts with:', databaseUrl.substring(0, 15))
  } else {
    console.error('❌ DATABASE_URL não encontrada em process.env')
    console.error('Variáveis disponíveis:', Object.keys(process.env).filter(k => k.includes('DATABASE')))
  }

  if (!databaseUrl) {
    const error = 'DATABASE_URL environment variable is not set. Verifique se a variável está configurada no Railway no serviço "web".'
    console.error('❌', error)
    throw new Error(error)
  }

  // Validar formato - verificar se começa com o protocolo correto
  // NÃO fazer trimStart aqui, apenas verificar se começa corretamente (pode ter espaços no início que serão removidos)
  const urlToCheck = databaseUrl.trimStart()
  if (!urlToCheck.startsWith('postgresql://') && !urlToCheck.startsWith('postgres://')) {
    const error = `DATABASE_URL deve começar com postgresql:// ou postgres://. Valor recebido (primeiros 50 chars): "${databaseUrl.substring(0, 50)}" | Length: ${databaseUrl.length} | First char code: ${databaseUrl.charCodeAt(0)}`
    console.error('❌', error)
    console.error('❌ DATABASE_URL completa (mascarada):', databaseUrl.replace(/:[^:@]+@/, ':****@'))
    throw new Error(`DATABASE_URL deve começar com postgresql:// ou postgres://. Valor recebido: ${databaseUrl.substring(0, 50)}...`)
  }

  // Retornar a URL limpa (apenas espaços removidos do início e fim, quebras de linha removidas do final)
  // IMPORTANTE: NÃO alterar nada no meio da URL (especialmente a senha)
  return databaseUrl.trimStart().trimEnd()
}

// Obter DATABASE_URL validada
let databaseUrl: string
try {
  databaseUrl = getDatabaseUrl()
  
  // CRÍTICO: Sobrescrever process.env.DATABASE_URL ANTES do Prisma ler do schema.prisma
  // Isso garante que o Prisma use a URL limpa e validada
  process.env.DATABASE_URL = databaseUrl
  console.log('✅ DATABASE_URL sobrescrita no process.env com URL validada')
  
} catch (error) {
  // Em desenvolvimento, permitir continuar sem DATABASE_URL (usará SQLite)
  if (process.env.NODE_ENV === 'development') {
    console.warn('⚠️ DATABASE_URL não configurada, mas continuando em modo desenvolvimento')
    databaseUrl = 'file:./prisma/dev.db'
    process.env.DATABASE_URL = databaseUrl
  } else {
    throw error
  }
}

// Garantir que process.env.DATABASE_URL está correto ANTES de criar Prisma Client
// O Prisma valida o schema.prisma que usa env("DATABASE_URL"), então precisamos garantir que está correto
if (process.env.DATABASE_URL !== databaseUrl) {
  console.log('⚠️ Corrigindo process.env.DATABASE_URL antes de criar Prisma Client')
  console.log('Antes:', process.env.DATABASE_URL?.substring(0, 30) + '...')
  process.env.DATABASE_URL = databaseUrl
  console.log('Depois:', process.env.DATABASE_URL.substring(0, 30) + '...')
}

// Verificar novamente antes de criar
const finalUrl = process.env.DATABASE_URL || databaseUrl
if (!finalUrl.startsWith('postgresql://') && !finalUrl.startsWith('postgres://')) {
  console.error('❌ ERRO: URL ainda inválida antes de criar Prisma:', finalUrl.substring(0, 50))
  throw new Error(`DATABASE_URL inválida: ${finalUrl.substring(0, 50)}...`)
}

console.log('✅ Criando Prisma Client com URL validada:', finalUrl.replace(/:[^:@]+@/, ':****@').substring(0, 60) + '...')

// Criar Prisma Client com configuração apropriada
// IMPORTANTE: O schema.prisma agora lerá a URL limpa de process.env.DATABASE_URL
export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: finalUrl // URL já validada e limpa (também sobrescrevemos process.env)
    }
  }
})

// Garantir que a URL está correta após criação
if (databaseUrl && !databaseUrl.startsWith('postgresql://') && !databaseUrl.startsWith('postgres://')) {
  console.error('❌ ERRO CRÍTICO: DATABASE_URL inválida após validação:', databaseUrl.substring(0, 50))
  throw new Error(`DATABASE_URL inválida: deve começar com postgresql:// ou postgres://`)
}

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma


