import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser, checkRole, checkAnyRole } from '@/lib/auth-helper'
import { prisma } from '@/lib/prisma'
import { UserRole } from '@/lib/constants'
import bcrypt from 'bcryptjs'

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    
    if (!user || !(await checkRole(request, 'ADMIN'))) {
      return NextResponse.json({ message: 'Acesso negado' }, { status: 403 })
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(users)
  } catch (error) {
    console.error('Erro ao buscar usuários:', error)
    return NextResponse.json({ message: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    
    if (!user || !(await checkRole(request, 'ADMIN'))) {
      return NextResponse.json({ message: 'Acesso negado' }, { status: 403 })
    }

    const { name, email, password, role, isActive } = await request.json()

    if (!name || !email || !password || !role) {
      return NextResponse.json({ message: 'Dados obrigatórios não fornecidos' }, { status: 400 })
    }

    // Verificar se email já existe
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json({ message: 'Email já cadastrado' }, { status: 400 })
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 12)

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        isActive: isActive ?? true
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true
      }
    })

    return NextResponse.json(newUser, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar usuário:', error)
    return NextResponse.json({ message: 'Erro interno do servidor' }, { status: 500 })
  }
}


