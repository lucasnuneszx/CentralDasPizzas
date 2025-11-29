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

    try {
      const combo = await prisma.combo.update({
        where: { id: params.id },
        data: updateData,
        include: {
          category: true
        }
      })

      return NextResponse.json(combo)
    } catch (updateError: any) {
      // Se o erro for por coluna showFlavors ou pizzaQuantity não existir, tentar sem elas
      if (updateError.code === 'P2022' || 
          updateError.message?.includes('showFlavors') || 
          updateError.message?.includes('pizzaQuantity') ||
          updateError.message?.includes('does not exist')) {
        console.warn('⚠️ Coluna showFlavors ou pizzaQuantity não existe. Atualizando sem elas...')
        
        const fallbackUpdateData: any = {
          name,
          description,
          price,
          categoryId,
          image,
          isActive,
          isPizza
        }

        // Tentar atualizar apenas se pizzaQuantity não causar erro
        if (pizzaQuantity !== undefined) {
          try {
            fallbackUpdateData.pizzaQuantity = pizzaQuantity
          } catch (e) {
            console.warn('⚠️ Não foi possível atualizar pizzaQuantity')
          }
        }

        const combo = await prisma.combo.update({
          where: { id: params.id },
          data: fallbackUpdateData,
          include: {
            category: true
          }
        })

        // Adicionar showFlavors e pizzaQuantity ao retorno se não foram salvos
        return NextResponse.json({
          ...combo,
          pizzaQuantity: pizzaQuantity ?? 1,
          showFlavors: showFlavors !== undefined ? showFlavors : true
        })
      }
      throw updateError
    }
  } catch (error: any) {
    console.error('Erro ao atualizar combo:', error)
    return NextResponse.json(
      { 
        message: 'Erro interno do servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
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



