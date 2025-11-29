import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const combos = await prisma.combo.findMany({
      include: {
        category: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(combos)
  } catch (error) {
    console.error('Erro ao buscar combos:', error)
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, description, price, categoryId, image, isActive, isPizza, pizzaQuantity } = await request.json()

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
        pizzaQuantity: pizzaQuantity ?? 1
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



