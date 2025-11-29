import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    let categories
    
    try {
      // Tentar buscar com pizzaQuantity primeiro
      categories = await prisma.category.findMany({
        where: {
          isActive: true
        },
        include: {
          combos: {
            where: {
              isActive: true
            },
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
            },
            orderBy: {
              name: 'asc'
            }
          }
        }
      })
    } catch (error: any) {
      // Se houver erro por coluna pizzaQuantity faltante, buscar sem ela
      if (error.code === 'P2022' || error.message?.includes('pizzaQuantity') || error.message?.includes('does not exist')) {
        console.warn('⚠️ Coluna pizzaQuantity não existe. Buscando sem ela...')
        categories = await prisma.category.findMany({
          where: {
            isActive: true
          },
          include: {
            combos: {
              where: {
                isActive: true
              },
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
                showFlavors: true,
                createdAt: true,
                updatedAt: true,
              },
              orderBy: {
                name: 'asc'
              }
            }
          }
        })
        
        // Adicionar pizzaQuantity e showFlavors padrão
        categories = categories.map(cat => ({
          ...cat,
          combos: cat.combos.map(combo => ({ ...combo, pizzaQuantity: 1, showFlavors: true }))
        }))
      } else {
        throw error
      }
    }

    // Ordenar categorias por campo order, depois por nome
    const sortedCategories = Array.isArray(categories) ? categories.sort((a, b) => {
      if (a.order !== b.order) {
        return a.order - b.order
      }
      return a.name.localeCompare(b.name)
    }) : []

    return NextResponse.json(sortedCategories, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    })
  } catch (error: any) {
    console.error('Erro ao buscar categorias:', error)
    // Retornar array vazio em vez de erro para não quebrar o frontend
    return NextResponse.json([], {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, description, image, isActive, order } = await request.json()

    const category = await prisma.category.create({
      data: {
        name,
        description,
        image,
        isActive: isActive ?? true,
        order: order || 0
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




