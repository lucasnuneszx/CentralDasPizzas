import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { name, description, image, isActive, order } = await request.json()

    const category = await prisma.category.update({
      where: { id: params.id },
      data: {
        name,
        description,
        image,
        isActive,
        order: order || 0
      }
    })

    return NextResponse.json(category)
  } catch (error) {
    console.error('Erro ao atualizar categoria:', error)
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
    // Buscar categoria de Combos para mover os combos
    const combosCategory = await prisma.category.findFirst({
      where: { name: 'Combos' }
    })

    if (combosCategory) {
      // Mover todos os combos desta categoria para "Combos"
      await prisma.combo.updateMany({
        where: { categoryId: params.id },
        data: { categoryId: combosCategory.id }
      })
    }

    // Excluir a categoria
    await prisma.category.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Categoria excluída com sucesso' })
  } catch (error) {
    console.error('Erro ao excluir categoria:', error)
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
