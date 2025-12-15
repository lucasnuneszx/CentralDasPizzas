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
        order: true,
        createdAt: true,
        updatedAt: true,
        category: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: [
        { order: 'asc' },
        { createdAt: 'desc' }
      ]
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
    const { name, description, price, categoryId, image, isActive, isPizza, pizzaQuantity, showFlavors, order } = await request.json()

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

    // Preparar dados base
    const baseData: any = {
      name,
      description,
      price,
      categoryId,
      image,
      isActive: isActive ?? true,
      isPizza: isPizza ?? false,
      order: order ?? 0
    }

    // Tentar criar com todos os campos primeiro
    try {
      const combo = await prisma.combo.create({
        data: {
          ...baseData,
          pizzaQuantity: pizzaQuantity ?? 1,
          showFlavors: showFlavors !== undefined ? showFlavors : true
        },
        include: {
          category: true
        }
      })
      return NextResponse.json(combo, { status: 201 })
    } catch (createError: any) {
      // Se o erro for por coluna não existir, tentar sem elas
      if (createError.code === 'P2022' || 
          createError.message?.includes('showFlavors') || 
          createError.message?.includes('pizzaQuantity') ||
          createError.message?.includes('does not exist')) {
        console.warn('⚠️ Coluna showFlavors ou pizzaQuantity não existe. Criando sem elas...')
        
        // Tentar criar apenas com pizzaQuantity se possível
        try {
          const combo = await prisma.combo.create({
            data: {
              ...baseData,
              pizzaQuantity: pizzaQuantity ?? 1
            },
            include: {
              category: true
            }
          })
          // Adicionar showFlavors ao retorno
          return NextResponse.json({
            ...combo,
            showFlavors: showFlavors !== undefined ? showFlavors : true
          }, { status: 201 })
        } catch (secondError: any) {
          // Se ainda falhar, criar sem nenhum dos dois campos
          const combo = await prisma.combo.create({
            data: baseData,
            include: {
              category: true
            }
          })
          // Adicionar valores padrão ao retorno
          return NextResponse.json({
            ...combo,
            pizzaQuantity: pizzaQuantity ?? 1,
            showFlavors: showFlavors !== undefined ? showFlavors : true
          }, { status: 201 })
        }
      }
      throw createError
    }
  } catch (error: any) {
    console.error('Erro ao criar combo:', error)
    return NextResponse.json(
      { 
        message: 'Erro interno do servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}



