import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { name, description, price, categoryId, image, isActive, isPizza, pizzaQuantity, showFlavors } = await request.json()

    // Verificar se a categoria existe
    if (categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: categoryId }
      })

      if (!category) {
        return NextResponse.json(
          { message: 'Categoria não encontrada' },
          { status: 400 }
        )
      }
    }

    const updateData: any = {
      name,
      description,
      price,
      categoryId,
      image,
      isActive,
      isPizza
    }

    if (pizzaQuantity !== undefined) {
      updateData.pizzaQuantity = pizzaQuantity
    }

    if (showFlavors !== undefined) {
      updateData.showFlavors = showFlavors
    }

    const combo = await prisma.combo.update({
      where: { id: params.id },
      data: updateData,
      include: {
        category: true
      }
    })

    return NextResponse.json(combo)
  } catch (error) {
    console.error('Erro ao atualizar combo:', error)
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
    await prisma.combo.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Combo excluído com sucesso' })
  } catch (error) {
    console.error('Erro ao excluir combo:', error)
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}



