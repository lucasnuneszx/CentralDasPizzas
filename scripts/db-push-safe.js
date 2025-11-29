/**
 * Script seguro para fazer db:push mesmo sem DATABASE_URL inicialmente
 */
const { execSync } = require('child_process');

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.log('⚠️ DATABASE_URL não encontrada. Pulando db:push.');
  console.log('ℹ️ Adicione DATABASE_URL nas variáveis de ambiente do Railway.');
  console.log('ℹ️ O sistema tentará criar as tabelas na primeira requisição.');
  process.exit(0); // Sair com sucesso para não travar o start
}

try {
  console.log('🗄️ Aplicando schema ao banco de dados...');
  console.log('📋 DATABASE_URL:', DATABASE_URL ? '✅ Configurada' : '❌ Não configurada');
  
  // Executar prisma db push com force
  execSync('npx prisma db push --accept-data-loss --skip-generate', { 
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL },
    cwd: process.cwd()
  });
  console.log('✅ Schema aplicado com sucesso!');
} catch (error) {
  console.error('❌ Erro ao aplicar schema:', error.message);
  console.error('❌ Stack:', error.stack);
  console.log('⚠️ Tentando novamente com prisma migrate...');
  
  // Tentar alternativa com migrate
  try {
    execSync('npx prisma migrate deploy', {
      stdio: 'inherit',
      env: { ...process.env, DATABASE_URL },
      cwd: process.cwd()
    });
    console.log('✅ Migração aplicada com sucesso!');
  } catch (migrateError) {
    console.error('❌ Erro na migração também:', migrateError.message);
    console.log('⚠️ Continuando mesmo assim...');
  }
  
  // Não falhar o start se db:push falhar
  process.exit(0);
}

