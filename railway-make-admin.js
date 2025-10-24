// Script para executar no Railway
// Cole este código no console do Railway ou execute via API

const { PrismaClient } = require('@prisma/client')

async function makeUserAdmin() {
  const prisma = new PrismaClient()
  
  try {
    console.log('🔧 Tornando admin@teste.com como ADMINISTRADOR...')

    // Atualizar o usuário para ADMIN
    const updatedUser = await prisma.user.update({
      where: {
        email: 'admin@teste.com'
      },
      data: {
        role: 'ADMIN'
      }
    })

    console.log('✅ Usuário atualizado com sucesso!')
    console.log(`📧 Email: ${updatedUser.email}`)
    console.log(`👑 Role: ${updatedUser.role}`)

  } catch (error) {
    console.error('❌ Erro:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

makeUserAdmin()
