import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser, checkRole, checkAnyRole } from '@/lib/auth-helper'
import { prisma } from '@/lib/prisma'
import { UserRole } from '@/lib/constants'
import bcrypt from 'bcryptjs'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUser(request)
    
    if (!user || !(await checkRole(request, 'ADMIN'))) {
      return NextResponse.json({ message: 'Acesso negado' }, { status: 403 })
    }

    const { name, email, password, role, isActive } = await request.json()

    if (!name || !email || !role) {
      return NextResponse.json({ message: 'Dados obrigatórios não fornecidos' }, { status: 400 })
    }

    // Verificar se usuário existe
    const existingUser = await prisma.user.findUnique({
      where: { id: params.id }
    })

    if (!existingUser) {
      return NextResponse.json({ message: 'Usuário não encontrado' }, { status: 404 })
    }

    // Verificar se email já existe em outro usuário
    const emailExists = await prisma.user.findFirst({
      where: {
        email,
        id: { not: params.id }
      }
    })

    if (emailExists) {
      return NextResponse.json({ message: 'Email já cadastrado' }, { status: 400 })
    }

    const updateData: any = {
      name,
      email,
      role,
      isActive: isActive ?? true
    }

    // Atualizar senha apenas se fornecida
    if (password && password.trim() !== '') {
      updateData.password = await bcrypt.hash(password, 12)
    }

    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true
      }
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error)
    return NextResponse.json({ message: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUser(request)
    
    if (!user || !(await checkRole(request, 'ADMIN'))) {
      return NextResponse.json({ message: 'Acesso negado' }, { status: 403 })
    }

    // Verificar se usuário existe
    const existingUser = await prisma.user.findUnique({
      where: { id: params.id }
    })

    if (!existingUser) {
      return NextResponse.json({ message: 'Usuário não encontrado' }, { status: 404 })
    }

    // Não permitir deletar o próprio usuário
    if (user.id === params.id) {
      return NextResponse.json({ message: 'Não é possível deletar seu próprio usuário' }, { status: 400 })
    }

    await prisma.user.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Usuário excluído com sucesso' })
  } catch (error) {
    console.error('Erro ao excluir usuário:', error)
    return NextResponse.json({ message: 'Erro interno do servidor' }, { status: 500 })
  }
}


