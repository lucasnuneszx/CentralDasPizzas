const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

// Use a URL do banco do Railway
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'file:./dev.db'
    }
  }
})

async function createUsers() {
  try {
    console.log('Criando usuários no Railway...')

    const hashedPassword = await bcrypt.hash('123456', 12)

    const users = [
      {
        name: 'Administrador',
        email: 'admin@centraldaspizzas.com',
        password: hashedPassword,
        role: 'ADMIN',
        phone: '(11) 99999-0001'
      },
      {
        name: 'Gerente',
        email: 'gerente@centraldaspizzas.com',
        password: hashedPassword,
        role: 'MANAGER',
        phone: '(11) 99999-0002'
      },
      {
        name: 'Caixa',
        email: 'caixa@centraldaspizzas.com',
        password: hashedPassword,
        role: 'CASHIER',
        phone: '(11) 99999-0003'
      }
    ]

    for (const userData of users) {
      try {
        const existingUser = await prisma.user.findUnique({
          where: { email: userData.email }
        })

        if (!existingUser) {
          const user = await prisma.user.create({
            data: userData
          })
          console.log(`✅ Usuário criado: ${user.name} (${user.email})`)
        } else {
          console.log(`⚠️ Usuário já existe: ${userData.email}`)
        }
      } catch (error) {
        console.log(`❌ Erro ao criar ${userData.email}:`, error.message)
      }
    }

    console.log('\n🎉 Usuários criados!')
    console.log('\n📋 Use estes logins:')
    console.log('Email: admin@centraldaspizzas.com | Senha: 123456')
    console.log('Email: gerente@centraldaspizzas.com | Senha: 123456')
    console.log('Email: caixa@centraldaspizzas.com | Senha: 123456')

  } catch (error) {
    console.error('❌ Erro:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createUsers()


