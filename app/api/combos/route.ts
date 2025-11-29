import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const combos = await prisma.combo.findMany({
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
        pizzaQuantity: true,
        showFlavors: true,
        createdAt: true,
        updatedAt: true,
        category: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    }).catch((error: any) => {
      // Se houver erro por coluna faltante (pizzaQuantity ou showFlavors), buscar sem elas
      if (error.code === 'P2022' || error.message?.includes('pizzaQuantity') || error.message?.includes('showFlavors') || error.message?.includes('does not exist')) {
        console.warn('⚠️ Coluna pizzaQuantity ou showFlavors não existe. Buscando sem elas...')
        return prisma.combo.findMany({
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
          },
          orderBy: {
            createdAt: 'desc'
          }
        }).then(combos => combos.map(c => ({ ...c, pizzaQuantity: 1, showFlavors: true })))
      }
      throw error
    })

    return NextResponse.json(Array.isArray(combos) ? combos : [])
  } catch (error: any) {
    console.error('Erro ao buscar combos:', error)
    return NextResponse.json(
      { 
        message: 'Erro interno do servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, description, price, categoryId, image, isActive, isPizza, pizzaQuantity, showFlavors } = await request.json()

    // Verificar se a categoria existe
    const category = await prisma.category.findUnique({
      where: { id: categoryId }
    })

    if (!category) {
      return NextResponse.json(
        { message: 'Categoria não encontrada' },
        { status: 400 }
      )
    }

    const combo = await prisma.combo.create({
      data: {
        name,
        description,
        price,
        categoryId,
        image,
        isActive: isActive ?? true,
        isPizza: isPizza ?? false,
        pizzaQuantity: pizzaQuantity ?? 1,
        showFlavors: showFlavors !== undefined ? showFlavors : true
      },
      include: {
        category: true
      }
    })

    return NextResponse.json(combo, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar combo:', error)
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}



