import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    console.log('Criando/atualizando usuário ADMIN...')

    // Verificar se o usuário existe
    const existingUser = await prisma.user.findUnique({
      where: { email: 'admin@teste.com' }
    })

    let user

    if (existingUser) {
      // Atualizar usuário existente
      user = await prisma.user.update({
        where: { email: 'admin@teste.com' },
        data: { role: 'ADMIN' }
      })
      console.log('Usuário atualizado para ADMIN!')
    } else {
      // Criar novo usuário ADMIN
      const bcrypt = require('bcryptjs')
      const hashedPassword = await bcrypt.hash('123456', 12)
      
      user = await prisma.user.create({
        data: {
          name: 'Administrador',
          email: 'admin@teste.com',
          password: hashedPassword,
          role: 'ADMIN',
          phone: '(11) 99999-9999'
        }
      })
      console.log('Usuário ADMIN criado!')
    }

    return NextResponse.json({
      message: '✅ Usuário ADMIN configurado com sucesso!',
      user: {
        email: user.email,
        role: user.role,
        name: user.name
      },
      credentials: {
        email: 'admin@teste.com',
        password: '123456'
      }
    })

  } catch (error) {
    console.error('Erro:', error)
    return NextResponse.json({
      message: '❌ Erro ao configurar usuário ADMIN',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}
