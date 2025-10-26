import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      where: {
        isActive: true
      },
      include: {
        combos: {
          where: {
            isActive: true
          },
          orderBy: {
            name: 'asc'
          }
        }
      }
    })

    // Ordenar categorias por campo order, depois por nome
    const sortedCategories = categories.sort((a, b) => {
      if (a.order !== b.order) {
        return a.order - b.order
      }
      return a.name.localeCompare(b.name)
    })

    return NextResponse.json(sortedCategories)
  } catch (error) {
    console.error('Erro ao buscar categorias:', error)
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, description, image } = await request.json()

    const category = await prisma.category.create({
      data: {
        name,
        description,
        image
      }
    })

    return NextResponse.json(category, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar categoria:', error)
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}




