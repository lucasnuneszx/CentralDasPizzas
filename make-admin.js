// ========================================
// IMPORTS E CONFIGURAÇÕES
// ========================================
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

// ========================================
// FUNÇÃO PRINCIPAL
// ========================================
async function makeAdmin() {
  try {
    console.log('🔧 Tornando admin@teste.com como ADMINISTRADOR...')

    // ========================================
    // ATUALIZAÇÃO DO USUÁRIO
    // ========================================
    const updatedUser = await prisma.user.update({
      where: {
        email: 'admin@teste.com'
      },
      data: {
        role: 'ADMIN'
      }
    })

    // ========================================
    // LOGS DE SUCESSO
    // ========================================
    console.log('✅ Usuário atualizado com sucesso!')
    console.log(`📧 Email: ${updatedUser.email}`)
    console.log(`👑 Role: ${updatedUser.role}`)
    console.log(`👤 Nome: ${updatedUser.name}`)

  } catch (error) {
    // ========================================
    // TRATAMENTO DE ERROS
    // ========================================
    if (error.code === 'P2025') {
      console.log('❌ Usuário admin@teste.com não encontrado!')
    } else {
      console.error('❌ Erro:', error.message)
    }
  } finally {
    // ========================================
    // LIMPEZA DE RECURSOS
    // ========================================
    await prisma.$disconnect()
  }
}

// ========================================
// EXECUÇÃO
// ========================================
makeAdmin()





