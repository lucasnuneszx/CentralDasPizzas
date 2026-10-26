const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function createTestUsers() {
  try {
    console.log('Criando usuários de teste...')

    // Criar usuários de teste
    const testUsers = [
      {
        name: 'João Silva',
        email: 'joao@centraldaspizzas.com',
        password: await bcrypt.hash('123456', 12),
        role: 'CASHIER',
        isActive: true
      },
      {
        name: 'Maria Santos',
        email: 'maria@centraldaspizzas.com',
        password: await bcrypt.hash('123456', 12),
        role: 'KITCHEN',
        isActive: true
      },
      {
        name: 'Pedro Oliveira',
        email: 'pedro@centraldaspizzas.com',
        password: await bcrypt.hash('123456', 12),
        role: 'MANAGER',
        isActive: true
      },
      {
        name: 'Ana Costa',
        email: 'ana@centraldaspizzas.com',
        password: await bcrypt.hash('123456', 12),
        role: 'CLIENT',
        isActive: true
      }
    ]

    for (const userData of testUsers) {
      const existingUser = await prisma.user.findUnique({
        where: { email: userData.email }
      })

      if (!existingUser) {
        await prisma.user.create({
          data: userData
        })
        console.log(`Usuário criado: ${userData.name} (${userData.role})`)
      } else {
        console.log(`Usuário já existe: ${userData.name}`)
      }
    }

    console.log('\nUsuários de teste criados com sucesso!')
    console.log('\nCredenciais de teste:')
    console.log('Email: joao@centraldaspizzas.com | Senha: 123456 | Função: Caixa')
    console.log('Email: maria@centraldaspizzas.com | Senha: 123456 | Função: Cozinha')
    console.log('Email: pedro@centraldaspizzas.com | Senha: 123456 | Função: Gerente')
    console.log('Email: ana@centraldaspizzas.com | Senha: 123456 | Função: Cliente')

  } catch (error) {
    console.error('Erro ao criar usuários:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createTestUsers()


