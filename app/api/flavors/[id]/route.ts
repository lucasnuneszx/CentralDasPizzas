import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, hasAnyRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthenticatedUser()
    
    if (!user) {
      return NextResponse.json(
        { message: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Verificar se o usuário tem permissão para gerenciar sabores
    if (!(await hasAnyRole(['ADMIN', 'MANAGER']))) {
      return NextResponse.json(
        { message: 'Sem permissão' },
        { status: 403 }
      )
    }

    const flavorId = params.id
    const { name, description, type, isActive } = await request.json()

    // Validar campos obrigatórios
    if (!name || !type) {
      return NextResponse.json(
        { message: 'Nome e tipo são obrigatórios' },
        { status: 400 }
      )
    }

    // Verificar se já existe outro sabor com o mesmo nome
    const existingFlavor = await prisma.pizzaFlavor.findFirst({
      where: { 
        name,
        id: { not: flavorId }
      }
    })

    if (existingFlavor) {
      return NextResponse.json(
        { message: 'Já existe outro sabor com este nome' },
        { status: 400 }
      )
    }

    // Atualizar sabor
    const updatedFlavor = await prisma.pizzaFlavor.update({
      where: { id: flavorId },
      data: {
        name,
        description: description || '',
        type,
        isActive: isActive !== undefined ? isActive : true
      }
    })

    return NextResponse.json(updatedFlavor)
  } catch (error) {
    console.error('Erro ao atualizar sabor:', error)
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthenticatedUser()
    
    if (!user) {
      return NextResponse.json(
        { message: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Verificar se o usuário tem permissão para gerenciar sabores
    if (!(await hasAnyRole(['ADMIN', 'MANAGER']))) {
      return NextResponse.json(
        { message: 'Sem permissão' },
        { status: 403 }
      )
    }

    const flavorId = params.id

    // Verificar se o sabor está sendo usado em algum pedido
    const ordersWithFlavor = await prisma.orderItem.findFirst({
      where: { 
        selectedFlavors: { contains: flavorId }
      }
    })

    if (ordersWithFlavor) {
      return NextResponse.json(
        { message: 'Não é possível excluir sabor que já foi usado em pedidos' },
        { status: 400 }
      )
    }

    // Excluir sabor
    await prisma.pizzaFlavor.delete({
      where: { id: flavorId }
    })

    return NextResponse.json({ message: 'Sabor excluído com sucesso' })
  } catch (error) {
    console.error('Erro ao excluir sabor:', error)
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
