import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * Endpoint para popular combos do cardápio
 * 
 * IMPORTANTE: Este endpoint deve ser protegido em produção!
 */
export async function GET(request: NextRequest) {
  try {
    console.log('Populando combos do cardápio...')

    // Buscar ou criar categoria de Combos
    let combosCategory = await prisma.category.findFirst({
      where: { name: 'Combos' }
    })

    if (!combosCategory) {
      combosCategory = await prisma.category.create({
        data: {
          name: 'Combos',
          description: 'Combos especiais com pizzas e acompanhamentos',
          image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop',
          isActive: true,
          order: 0
        }
      })
      console.log('Categoria "Combos" criada')
    }

    // Lista de combos com informações de personalização
    const combos = [
      {
        name: 'COMBO DO DIA',
        description: 'Pizza Tradicional + Porção 8 Coxinhas + Maionese Gourmet + Refri 1 Litro + Bordas Grátis',
        price: 59.99,
        hasPizza: true,
        pizzaQuantity: 1,
        allowCustomization: true,
        showFlavors: true
      },
      {
        name: 'COMBO MASTER',
        description: 'Pizza Tradicional + Porção de 10 Salgados + Batata Frita + Maionese Gourmet + Refri 1L',
        price: 72.99,
        hasPizza: true,
        pizzaQuantity: 1,
        allowCustomization: true,
        showFlavors: true
      },
      {
        name: 'DOBRO DE PIZZA FAMÍLIA',
        description: 'Duas Pizzas Família Tradicionais + Pizza P Doce ou Salgada + Refri 1L',
        price: 139.99,
        hasPizza: true,
        pizzaQuantity: 3, // 2 grandes + 1 pequena
        allowCustomization: true,
        showFlavors: true
      },
      {
        name: 'PIZZA + BATATA + COXINHAS',
        description: 'Pizza Tradicional + Porção Batata + Coxinhas + Maionese Gourmet',
        price: 58.00,
        hasPizza: true,
        pizzaQuantity: 1,
        allowCustomization: true,
        showFlavors: true
      },
      {
        name: 'DOBRO DE PIZZA MÉDIA',
        description: 'Duas Pizzas Tradicionais Médias',
        price: 58.00,
        hasPizza: true,
        pizzaQuantity: 2,
        allowCustomization: true,
        showFlavors: true
      },
      {
        name: 'COMBO SUPREMO',
        description: 'Duas Pizzas Médias Tradicionais + Porção Coxinhas + Batata + Maionese Temperada + Refri Grátis',
        price: 74.99,
        hasPizza: true,
        pizzaQuantity: 2,
        allowCustomization: true,
        showFlavors: true
      },
      {
        name: 'COMBO NA CAIXA 4 HAMBÚRGUERES',
        description: '4 Hambúrgueres + Porção de Batata + Maionese Temperada',
        price: 55.00,
        hasPizza: false,
        pizzaQuantity: 0,
        allowCustomization: false,
        showFlavors: false
      },
      {
        name: 'DOBRO DE PIZZA GRANDE',
        description: 'Duas Pizzas Grandes Tradicionais + Porção Coxinhas',
        price: 79.99,
        hasPizza: true,
        pizzaQuantity: 2,
        allowCustomization: true,
        showFlavors: true
      },
      {
        name: 'COMBO MEGA CHOCOLATE',
        description: 'Pizza Tradicional + Pizza P Doce ou Salgada + Porção de Pastel',
        price: 64.99,
        hasPizza: true,
        pizzaQuantity: 2, // 1 grande + 1 pequena
        allowCustomization: true,
        showFlavors: true
      },
      {
        name: 'DOBRO DE PIZZA GRANDE COMPLETO',
        description: 'Duas Pizzas Grandes Tradicionais + Pizza P Doce ou Salgada + Refri 1L',
        price: 119.99,
        hasPizza: true,
        pizzaQuantity: 3, // 2 grandes + 1 pequena
        allowCustomization: true,
        showFlavors: true
      },
      {
        name: 'COMBO NA CAIXA 6 HAMBÚRGUERES',
        description: '6 Hambúrgueres + Porção de Batata + Maionese Temperada',
        price: 85.00,
        hasPizza: false,
        pizzaQuantity: 0,
        allowCustomization: false,
        showFlavors: false
      },
      {
        name: 'COMBÃO MISTÃO',
        description: 'Prato Principal Misto + 2 Acompanhamentos + Refri 1L',
        price: 59.99,
        hasPizza: false,
        pizzaQuantity: 0,
        allowCustomization: false,
        showFlavors: false
      },
      {
        name: 'COMBO 20 MIX SALGADOS',
        description: '20 Salgados Mix (Coxinhas, Risole de Camarão, Bolinho de Bacalhau, Bolinho de Calabresa, Bolinho de Charque)',
        price: 29.99,
        hasPizza: false,
        pizzaQuantity: 0,
        allowCustomization: false,
        showFlavors: false
      },
      {
        name: '2 X-BATATA',
        description: '2 X-Batata + Batata com Bacon + Maionese Gourmet',
        price: 35.00,
        hasPizza: false,
        pizzaQuantity: 0,
        allowCustomization: false,
        showFlavors: false
      }
    ]

    const createdCombos = []
    const existingCombos = []
    const errors = []

    for (const comboData of combos) {
      try {
        // Verificar se já existe um combo com o mesmo nome na mesma categoria
        const existingCombo = await prisma.combo.findFirst({
          where: {
            name: comboData.name,
            categoryId: combosCategory.id
          }
        })

        if (!existingCombo) {
          const combo = await prisma.combo.create({
            data: {
              name: comboData.name,
              description: comboData.description,
              price: comboData.price,
              categoryId: combosCategory.id,
              isActive: true,
              isPizza: comboData.hasPizza || false,
              allowCustomization: comboData.allowCustomization || false,
              pizzaQuantity: comboData.pizzaQuantity || 0,
              showFlavors: comboData.showFlavors !== undefined ? comboData.showFlavors : (comboData.hasPizza || false),
              image: null // Sem foto por enquanto, você adiciona depois
            }
          })
          createdCombos.push({
            id: combo.id,
            name: combo.name,
            description: combo.description,
            price: combo.price
          })
          console.log(`Combo criado: ${combo.name} - R$ ${combo.price}`)
        } else {
          existingCombos.push({
            id: existingCombo.id,
            name: existingCombo.name,
            description: existingCombo.description,
            price: existingCombo.price
          })
          console.log(`Combo já existe: ${comboData.name}`)
        }
      } catch (error) {
        errors.push({
          name: comboData.name,
          error: error instanceof Error ? error.message : 'Erro desconhecido'
        })
        console.error(`Erro ao criar combo ${comboData.name}:`, error)
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Processo de criação de combos concluído',
      created: createdCombos,
      existing: existingCombos,
      errors: errors,
      summary: {
        total: combos.length,
        created: createdCombos.length,
        existing: existingCombos.length,
        errors: errors.length
      },
      category: {
        id: combosCategory.id,
        name: combosCategory.name
      }
    }, { status: 200 })

  } catch (error) {
    console.error('Erro ao popular combos:', error)
    return NextResponse.json({
      success: false,
      message: 'Erro ao popular combos',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}

