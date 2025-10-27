import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Verificar se o usuário tem permissão para gerenciar extras
    const allowedRoles = ['ADMIN', 'MANAGER']
    if (!allowedRoles.includes(session.user.role as any)) {
      return NextResponse.json(
        { message: 'Sem permissão' },
        { status: 403 }
      )
    }

    const extraId = params.id
    const { name, description, price, category, size, isActive } = await request.json()

    // Validar campos obrigatórios
    if (!name || !category || !price) {
      return NextResponse.json(
        { message: 'Nome, categoria e preço são obrigatórios' },
        { status: 400 }
      )
    }

    if (price <= 0) {
      return NextResponse.json(
        { message: 'Preço deve ser maior que zero' },
        { status: 400 }
      )
    }

    // Verificar se já existe outro item com o mesmo nome
    const existingExtra = await prisma.extraItem.findFirst({
      where: { 
        name,
        id: { not: extraId }
      }
    })

    if (existingExtra) {
      return NextResponse.json(
        { message: 'Já existe outro item com este nome' },
        { status: 400 }
      )
    }

    // Atualizar item extra
    const updatedExtra = await prisma.extraItem.update({
      where: { id: extraId },
      data: {
        name,
        description: description || '',
        price,
        category,
        size: size || null,
        isActive: isActive !== undefined ? isActive : true
      }
    })

    return NextResponse.json(updatedExtra)
  } catch (error) {
    console.error('Erro ao atualizar item extra:', error)
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
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Verificar se o usuário tem permissão para gerenciar extras
    const allowedRoles = ['ADMIN', 'MANAGER']
    if (!allowedRoles.includes(session.user.role as any)) {
      return NextResponse.json(
        { message: 'Sem permissão' },
        { status: 403 }
      )
    }

    const extraId = params.id

    // Verificar se o item está sendo usado em algum pedido
    const ordersWithExtra = await prisma.orderItemExtra.findFirst({
      where: { extraItemId: extraId }
    })

    if (ordersWithExtra) {
      return NextResponse.json(
        { message: 'Não é possível excluir item que já foi usado em pedidos' },
        { status: 400 }
      )
    }

    // Excluir item extra
    await prisma.extraItem.delete({
      where: { id: extraId }
    })

    return NextResponse.json({ message: 'Item excluído com sucesso' })
  } catch (error) {
    console.error('Erro ao excluir item extra:', error)
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
