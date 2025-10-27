import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ message: 'Não autorizado' }, { status: 401 })
    }

    const { id } = params
    const body = await request.json()
    const { name, city, state, zipCode, deliveryFee, isActive } = body

    // Validar dados obrigatórios
    if (!name || !city || !state || deliveryFee === undefined) {
      return NextResponse.json(
        { message: 'Nome, cidade, estado e taxa de entrega são obrigatórios' },
        { status: 400 }
      )
    }

    // Verificar se já existe outra área com o mesmo nome na mesma cidade
    const existingArea = await prisma.deliveryArea.findFirst({
      where: {
        name,
        city,
        state,
        id: { not: id }
      }
    })

    if (existingArea) {
      return NextResponse.json(
        { message: 'Já existe uma área com este nome nesta cidade' },
        { status: 400 }
      )
    }

    const area = await prisma.deliveryArea.update({
      where: { id },
      data: {
        name,
        city,
        state,
        zipCode: zipCode || null,
        deliveryFee: parseFloat(deliveryFee.toString()),
        isActive: isActive !== undefined ? isActive : true
      }
    })

    return NextResponse.json(area)
  } catch (error) {
    console.error('Erro ao atualizar área de entrega:', error)
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
    
    if (!session?.user) {
      return NextResponse.json({ message: 'Não autorizado' }, { status: 401 })
    }

    const { id } = params

    await prisma.deliveryArea.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Área de entrega excluída com sucesso' })
  } catch (error) {
    console.error('Erro ao excluir área de entrega:', error)
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
