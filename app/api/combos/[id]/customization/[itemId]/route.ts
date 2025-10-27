import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; itemId: string } }
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

    const { id: comboId, itemId } = params
    const { 
      name, 
      description, 
      type, 
      isRequired, 
      isMultiple, 
      maxSelections, 
      minSelections, 
      order, 
      image 
    } = await request.json()

    // Validar campos obrigatórios
    if (!name || !type) {
      return NextResponse.json(
        { message: 'Nome e tipo são obrigatórios' },
        { status: 400 }
      )
    }

    // Verificar se já existe outro item com o mesmo nome para este combo
    const existingItem = await prisma.comboCustomizationItem.findFirst({
      where: { 
        comboId,
        name,
        id: { not: itemId }
      }
    })

    if (existingItem) {
      return NextResponse.json(
        { message: 'Já existe outro item com este nome para este combo' },
        { status: 400 }
      )
    }

    // Atualizar item de personalização
    const updatedItem = await prisma.comboCustomizationItem.update({
      where: { id: itemId },
      data: {
        name,
        description: description || '',
        type,
        isRequired: isRequired || false,
        isMultiple: isMultiple || false,
        maxSelections: maxSelections || null,
        minSelections: minSelections || 1,
        order: order || 0,
        image: image || null
      },
      include: {
        options: true
      }
    })

    return NextResponse.json(updatedItem)
  } catch (error) {
    console.error('Erro ao atualizar item de personalização:', error)
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; itemId: string } }
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

    const { itemId } = params

    // Excluir item de personalização (cascade excluirá as opções)
    await prisma.comboCustomizationItem.delete({
      where: { id: itemId }
    })

    return NextResponse.json({ message: 'Item excluído com sucesso' })
  } catch (error) {
    console.error('Erro ao excluir item de personalização:', error)
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
