import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; itemId: string; optionId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Verificar se o usuário tem permissão para gerenciar combos
    const allowedRoles = ['ADMIN', 'MANAGER']
    if (!allowedRoles.includes(session.user.role as any)) {
      return NextResponse.json(
        { message: 'Sem permissão' },
        { status: 403 }
      )
    }

    const { optionId } = params
    const { name, description, price, image, order } = await request.json()

    // Validar campos obrigatórios
    if (!name) {
      return NextResponse.json(
        { message: 'Nome da opção é obrigatório' },
        { status: 400 }
      )
    }

    // Atualizar opção
    const updatedOption = await prisma.comboCustomizationOption.update({
      where: { id: optionId },
      data: {
        name,
        description: description || '',
        price: price || 0,
        image: image || null,
        order: order || 0
      }
    })

    return NextResponse.json(updatedOption)
  } catch (error) {
    console.error('Erro ao atualizar opção:', error)
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; itemId: string; optionId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Verificar se o usuário tem permissão para gerenciar combos
    const allowedRoles = ['ADMIN', 'MANAGER']
    if (!allowedRoles.includes(session.user.role as any)) {
      return NextResponse.json(
        { message: 'Sem permissão' },
        { status: 403 }
      )
    }

    const { optionId } = params

    // Excluir opção
    await prisma.comboCustomizationOption.delete({
      where: { id: optionId }
    })

    return NextResponse.json({ message: 'Opção excluída com sucesso' })
  } catch (error) {
    console.error('Erro ao excluir opção:', error)
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
