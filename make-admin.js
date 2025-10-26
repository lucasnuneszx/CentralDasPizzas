const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function makeAdmin() {
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
    console.log(`👤 Nome: ${updatedUser.name}`)

  } catch (error) {
    if (error.code === 'P2025') {
      console.log('❌ Usuário admin@teste.com não encontrado!')
    } else {
      console.error('❌ Erro:', error.message)
    }
  } finally {
    await prisma.$disconnect()
  }
}

makeAdmin()



