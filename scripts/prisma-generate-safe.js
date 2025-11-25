/**
 * Script seguro para gerar Prisma Client mesmo sem DATABASE_URL
 */
const { execSync } = require('child_process');

try {
  // Tentar gerar normalmente
  console.log('🔧 Gerando Prisma Client...');
  execSync('prisma generate', { stdio: 'inherit' });
  console.log('✅ Prisma Client gerado com sucesso!');
} catch (error) {
  // Se falhar por falta de DATABASE_URL, usar placeholder
  if (error.message.includes('DATABASE_URL') || error.message.includes('P1012')) {
    console.log('⚠️ DATABASE_URL não encontrada, usando placeholder para gerar client...');
    process.env.DATABASE_URL = 'postgresql://postgres:placeholder@localhost:5432/railway';
    try {
      execSync('prisma generate', { stdio: 'inherit' });
      console.log('✅ Prisma Client gerado com placeholder!');
    } catch (e) {
      console.error('❌ Erro ao gerar Prisma Client:', e.message);
      process.exit(1);
    }
  } else {
    console.error('❌ Erro ao gerar Prisma Client:', error.message);
    process.exit(1);
  }
}

