import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { name, description, price, categoryId, image, isActive, isPizza, isBurger, burgerArtisanalPrice, burgerIndustrialPrice, pizzaQuantity, showFlavors, order } = await request.json()

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

    if (isBurger !== undefined) {
      updateData.isBurger = isBurger
    }

    if (burgerArtisanalPrice !== undefined) {
      updateData.burgerArtisanalPrice = burgerArtisanalPrice ? parseFloat(burgerArtisanalPrice) : null
    }

    if (burgerIndustrialPrice !== undefined) {
      updateData.burgerIndustrialPrice = burgerIndustrialPrice ? parseFloat(burgerIndustrialPrice) : null
    }

    if (pizzaQuantity !== undefined) {
      updateData.pizzaQuantity = pizzaQuantity
    }

    if (showFlavors !== undefined) {
      updateData.showFlavors = showFlavors
    }

    if (order !== undefined) {
      updateData.order = order
    }

    try {
      const combo = await prisma.combo.update({
        where: { id: params.id },
        data: updateData,
        select: {
          id: true,
          name: true,
          description: true,
          price: true,
          image: true,
          isActive: true,
          categoryId: true,
          isPizza: true,
          allowCustomization: true,
          createdAt: true,
          updatedAt: true,
          category: {
            select: {
              id: true,
              name: true
            }
          }
        }
      })

      return NextResponse.json(combo)
    } catch (updateError: any) {
      // Se o erro for por coluna showFlavors ou pizzaQuantity não existir, tentar sem elas
      if (updateError.code === 'P2022' || 
          updateError.code === 'P2011' ||
          updateError.message?.includes('showFlavors') || 
          updateError.message?.includes('pizzaQuantity') ||
          updateError.message?.includes('does not exist') ||
          updateError.message?.includes('Unknown column')) {
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

        // Tentar atualizar com pizzaQuantity primeiro
        try {
          if (pizzaQuantity !== undefined) {
            fallbackUpdateData.pizzaQuantity = pizzaQuantity
          }
          const combo = await prisma.combo.update({
            where: { id: params.id },
            data: fallbackUpdateData,
            select: {
              id: true,
              name: true,
              description: true,
              price: true,
              image: true,
              isActive: true,
              categoryId: true,
              isPizza: true,
              allowCustomization: true,
              createdAt: true,
              updatedAt: true,
              category: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          })
          // Adicionar showFlavors ao retorno
          return NextResponse.json({
            ...combo,
            showFlavors: showFlavors !== undefined ? showFlavors : true
          })
        } catch (secondError: any) {
          // Se ainda falhar, atualizar sem nenhum dos dois campos
          const finalUpdateData: any = {
            name,
            description,
            price,
            categoryId,
            image,
            isActive,
            isPizza
          }
        const combo = await prisma.combo.update({
          where: { id: params.id },
          data: finalUpdateData,
          select: {
            id: true,
            name: true,
            description: true,
            price: true,
            image: true,
            isActive: true,
            categoryId: true,
            isPizza: true,
            allowCustomization: true,
            createdAt: true,
            updatedAt: true,
            category: {
              select: {
                id: true,
                name: true
              }
            }
          }
        })
          // Adicionar valores padrão ao retorno
          return NextResponse.json({
            ...combo,
            pizzaQuantity: pizzaQuantity ?? 1,
            showFlavors: showFlavors !== undefined ? showFlavors : true,
            order: order ?? 0
          })
        }
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



