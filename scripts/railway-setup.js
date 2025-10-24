const { execSync } = require('child_process')

console.log('🚀 Configurando banco de dados para Railway...')

try {
  // Gerar o cliente Prisma
  console.log('📦 Gerando cliente Prisma...')
  execSync('npx prisma generate', { stdio: 'inherit' })
  
  // Executar migrações
  console.log('🗄️ Executando migrações...')
  execSync('npx prisma db push', { stdio: 'inherit' })
  
  console.log('✅ Banco de dados configurado com sucesso!')
} catch (error) {
  console.error('❌ Erro ao configurar banco:', error.message)
  process.exit(1)
}
