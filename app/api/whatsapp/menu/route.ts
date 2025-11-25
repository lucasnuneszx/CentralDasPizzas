import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * API para fornecer o cardápio para a IA do WhatsApp
 * 
 * Retorna todos os produtos disponíveis em formato simplificado
 * para facilitar o processamento pela IA
 */
export async function GET(request: NextRequest) {
  try {
    // Buscar categorias e combos ativos
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
          },
          include: {
            sizes: {
              where: {
                isActive: true
              }
            }
          }
        }
      },
      orderBy: {
        order: 'asc'
      }
    })

    // Buscar sabores de pizza
    const pizzaFlavors = await prisma.pizzaFlavor.findMany({
      where: {
        isActive: true
      },
      orderBy: {
        name: 'asc'
      }
    })

    // Buscar itens extras
    const extraItems = await prisma.extraItem.findMany({
      where: {
        isActive: true
      },
      orderBy: {
        name: 'asc'
      }
    })

    // Formatar dados para facilitar processamento pela IA
    const menu = {
      categories: categories.map(cat => ({
        id: cat.id,
        name: cat.name,
        description: cat.description,
        items: cat.combos.map(combo => ({
          id: combo.id,
          name: combo.name,
          description: combo.description,
          price: combo.price,
          category: cat.name,
          isPizza: combo.isPizza,
          allowCustomization: combo.allowCustomization,
          sizes: combo.sizes.map(size => ({
            id: size.id,
            name: size.name,
            slices: size.slices,
            maxFlavors: size.maxFlavors,
            basePrice: size.basePrice
          }))
        }))
      })),
      pizzaFlavors: pizzaFlavors.map(flavor => ({
        id: flavor.id,
        name: flavor.name,
        description: flavor.description,
        type: flavor.type
      })),
      extraItems: extraItems.map(item => ({
        id: item.id,
        name: item.name,
        description: item.description,
        price: item.price,
        category: item.category,
        size: item.size
      })),
      settings: {
        deliveryFee: 5.00, // Valor padrão, pode ser buscado de SystemSettings
        minOrderValue: 25.00,
        deliveryEstimate: "35 - 70min"
      }
    }

    return NextResponse.json(menu, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600'
      }
    })

  } catch (error) {
    console.error('Erro ao buscar cardápio:', error)
    return NextResponse.json(
      { message: 'Erro ao buscar cardápio' },
      { status: 500 }
    )
  }
}

