import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * Endpoint para popular dados de pizza (sabores e tamanhos)
 * 
 * IMPORTANTE: Este endpoint deve ser protegido em produção!
 */
export async function GET(request: NextRequest) {
  try {
    console.log('🍕 Populando dados de pizza com tamanhos e sabores...')

    // Criar sabores de pizza
    const flavors = [
      // Tradicionais
      { name: 'Baiana', description: 'Mussarela, calabresa, pimenta calabresa e orégano', type: 'TRADICIONAL' },
      { name: 'Calabresa', description: 'Mussarela, calabresa, cebola e orégano', type: 'TRADICIONAL' },
      { name: 'Calabresa c/ cheddar', description: 'Mussarela, calabresa, cheddar e orégano', type: 'TRADICIONAL' },
      { name: 'Caipira', description: 'Mussarela, frango, milho e orégano', type: 'TRADICIONAL' },
      { name: 'Dois queijos', description: 'Mussarela, catupiry e orégano', type: 'TRADICIONAL' },
      { name: 'Frango c/ catupiry', description: 'Mussarela, frango desfiado, catupiry e orégano', type: 'TRADICIONAL' },
      { name: 'Frango c/ cheddar', description: 'Mussarela, frango desfiado, cheddar e orégano', type: 'TRADICIONAL' },
      { name: 'Marguerita', description: 'Mussarela, tomate, manjericão e orégano', type: 'TRADICIONAL' },
      { name: 'Milho verde', description: 'Mussarela, milho verde e orégano', type: 'TRADICIONAL' },
      { name: 'Lombinho', description: 'Camada dupla de mussarela e orégano', type: 'TRADICIONAL' },
      { name: 'Portuguesa', description: 'Mussarela, presunto, ovos, cebola, pimentão, azeitona e orégano', type: 'TRADICIONAL' },
      { name: 'Mista especial', description: 'Mussarela, presunto, azeitona, milho verde e orégano', type: 'TRADICIONAL' },
      { name: 'Moda vegetariana', description: 'Mussarela, palmito, milho verde, azeitona, manjericão e orégano', type: 'TRADICIONAL' },
      
      // Premium
      { name: 'Camarão especial', description: 'Mussarela, camarão e orégano', type: 'PREMIUM' },
      { name: 'Camarão com catupiry philadelphia', description: 'Mussarela, camarão ao molho de frutos do mar, catupiry philadelphia e orégano', type: 'PREMIUM' },
      { name: 'Carne do sol com catupiry philadelphia', description: 'Mussarela, filé de carne do sol, catupiry philadelphia e orégano', type: 'PREMIUM' },
      { name: 'Carne do sol apimentada', description: 'Mussarela, filé de carne do sol, pimenta calabresa e orégano', type: 'PREMIUM' },
      { name: 'Mega nordestina', description: 'Mussarela, carne do sol, cebola, queijo coalho, banana da terra e orégano', type: 'PREMIUM' },
      { name: 'Camarão aos três queijos', description: 'Mussarela, camarão, queijo do reino, gorgonzola, cebola e orégano', type: 'PREMIUM' },
      { name: 'Strogonoff de Camarão', description: 'Mussarela, strogonoff de camarão, batata palha e orégano', type: 'PREMIUM' },
      { name: 'Carne do Sol aos três Queijos', description: 'Mussarela, carne do sol, queijo do reino, queijo gorgonzola, cebola e orégano', type: 'PREMIUM' },
      { name: 'Sabor do chef', description: 'Mussarela, filé de carne do sol acebolado, queijo coalho, queijo do reino, catupiry philadelphia e orégano', type: 'PREMIUM' },
      
      // Especiais
      { name: 'Atum', description: 'Mussarela, atum, azeitonas e orégano', type: 'ESPECIAL' },
      { name: 'Atum acebolado', description: 'Mussarela, atum, cebola, azeitonas e orégano', type: 'ESPECIAL' },
      { name: 'Atum especial', description: 'Mussarela, atum, cebola, azeitonas, catupiry e orégano', type: 'ESPECIAL' },
      { name: 'Atum a moda do chef', description: 'Mussarela, atum, cebola, queijo coalho, azeitonas e orégano', type: 'ESPECIAL' },
      { name: 'Bacon', description: 'Mussarela, bacon, cebola e orégano', type: 'ESPECIAL' },
      { name: 'Bacon crocante', description: 'Mussarela, bacon acebolado, batata palha e orégano', type: 'ESPECIAL' },
      { name: 'Bacon especial', description: 'Mussarela, bacon, cebola, catupiry e orégano', type: 'ESPECIAL' },
      { name: 'Nordestina', description: 'Mussarela, carne do sol acebolada e orégano', type: 'ESPECIAL' },
      { name: 'Nordestina especial', description: 'Mussarela, carne do sol acebolada, azeitonas, catupiry e orégano', type: 'ESPECIAL' },
      { name: 'Nordestina a moda do chef', description: 'Mussarela, carne do sol acebolada, queijo coalho e orégano', type: 'ESPECIAL' },
      { name: 'Frango especial', description: 'Mussarela, filé de frango desfiado, cebola, catupiry e orégano', type: 'ESPECIAL' },
      { name: 'Frango a moda da casa', description: 'Mussarela, filé de frango desfiado, milho verde, catupiry e orégano', type: 'ESPECIAL' },
      { name: 'Frango a moda do chef', description: 'Mussarela, filé de frango desfiado, queijo do reino, catupiry e orégano', type: 'ESPECIAL' },
      { name: 'Lombinho', description: 'Mussarela, lombinho fatiado, azeitona e orégano', type: 'ESPECIAL' },
      { name: '4 queijos', description: 'Mussarela, queijo do reino, queijo coalho, gorgonzola e orégano', type: 'ESPECIAL' },
      
      // Doces
      { name: 'Brigadeiro de panela', description: 'Mussarela, Brigadeiro de panela e granulado', type: 'TRADICIONAL' },
      { name: 'Banana com canela', description: 'Mussarela, banana e canela', type: 'TRADICIONAL' },
      { name: 'Romeu e julieta', description: 'Mussarela e goiabada', type: 'TRADICIONAL' },
      { name: 'Churros', description: 'Mussarela, leite condensado, doce de leite, açúcar e canela', type: 'TRADICIONAL' }
    ]

    // Limpar sabores existentes
    await prisma.pizzaFlavor.deleteMany()

    // Criar sabores
    const createdFlavors = []
    for (const flavor of flavors) {
      const created = await prisma.pizzaFlavor.create({
        data: flavor
      })
      createdFlavors.push(created)
    }

    console.log(`✅ ${createdFlavors.length} sabores de pizza criados`)

    // Buscar ou criar categoria de pizza
    let pizzaCategory = await prisma.category.findFirst({
      where: { name: 'Pizzas Tradicionais' }
    })

    if (!pizzaCategory) {
      pizzaCategory = await prisma.category.create({
        data: {
          name: 'Pizzas Tradicionais',
          description: 'Pizzas tradicionais, especiais e doces',
          image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop'
        }
      })
    }

    // Criar combo de pizza base se não existir
    let pizzaCombo = await prisma.combo.findFirst({
      where: { 
        name: 'Pizza Personalizada',
        categoryId: pizzaCategory.id
      }
    })

    if (!pizzaCombo) {
      pizzaCombo = await prisma.combo.create({
        data: {
          name: 'Pizza Personalizada',
          description: 'Escolha o tamanho e os sabores da sua pizza',
          price: 0, // Preço será calculado dinamicamente
          image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop',
          categoryId: pizzaCategory.id,
          isPizza: true,
          isActive: true
        }
      })
    } else {
      // Atualizar para marcar como pizza
      pizzaCombo = await prisma.combo.update({
        where: { id: pizzaCombo.id },
        data: { isPizza: true }
      })
    }

    // Limpar tamanhos existentes para esta pizza
    await prisma.pizzaSize.deleteMany({
      where: { comboId: pizzaCombo.id }
    })

    // Criar tamanhos de pizza
    const sizes = [
      { name: 'Pequena', slices: 4, maxFlavors: 2, basePrice: 25.00 },
      { name: 'Média', slices: 6, maxFlavors: 2, basePrice: 35.00 },
      { name: 'Grande', slices: 8, maxFlavors: 3, basePrice: 45.00 },
      { name: 'Família', slices: 13, maxFlavors: 4, basePrice: 55.00 }
    ]

    const createdSizes = []
    for (const size of sizes) {
      const created = await prisma.pizzaSize.create({
        data: {
          comboId: pizzaCombo.id,
          name: size.name,
          slices: size.slices,
          maxFlavors: size.maxFlavors,
          basePrice: size.basePrice,
          isActive: true
        }
      })
      createdSizes.push(created)
    }

    console.log(`✅ ${createdSizes.length} tamanhos de pizza criados`)

    return NextResponse.json({
      success: true,
      message: 'Dados de pizza populados com sucesso!',
      created: {
        flavors: createdFlavors.length,
        sizes: createdSizes.length,
        combo: pizzaCombo.name
      },
      flavors: createdFlavors.map(f => ({ id: f.id, name: f.name, type: f.type })),
      sizes: createdSizes.map(s => ({ id: s.id, name: s.name, basePrice: s.basePrice }))
    }, { status: 200 })

  } catch (error) {
    console.error('❌ Erro ao popular dados de pizza:', error)
    return NextResponse.json({
      success: false,
      message: 'Erro ao popular dados de pizza',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}

