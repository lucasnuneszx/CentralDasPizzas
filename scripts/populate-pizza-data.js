const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function populatePizzaData() {
  try {
    console.log('Populando dados de pizza com tamanhos e sabores...')

    // Pular configurações por enquanto - focar nos sabores e tamanhos
    console.log('Pulando configurações por enquanto...')

    // Criar sabores de pizza
    const flavors = [
      // Tradicionais
      { name: 'Margherita', description: 'Molho de tomate, mussarela, manjericão e azeite', type: 'TRADICIONAL' },
      { name: 'Calabresa', description: 'Calabresa, cebola, mussarela e molho de tomate', type: 'TRADICIONAL' },
      { name: 'Portuguesa', description: 'Presunto, ovos, cebola, azeitona, mussarela e molho de tomate', type: 'TRADICIONAL' },
      { name: 'Frango com Catupiry', description: 'Frango desfiado, catupiry, mussarela e molho de tomate', type: 'TRADICIONAL' },
      { name: 'Dois Queijos', description: 'Mussarela, catupiry e orégano', type: 'TRADICIONAL' },
      { name: 'Milho Verde', description: 'Mussarela, milho verde e orégano', type: 'TRADICIONAL' },
      { name: 'Moda Vegetariana', description: 'Mussarela, palmito, milho verde, azeitona, manjericão e orégano', type: 'TRADICIONAL' },
      
      // Premium
      { name: 'Camarão Especial', description: 'Mussarela, camarão e orégano', type: 'PREMIUM' },
      { name: 'Camarão com Catupiry Philadelphia', description: 'Mussarela, camarão ao molho de frutos do mar, catupiry philadelphia e orégano', type: 'PREMIUM' },
      { name: 'Carne do Sol com Catupiry Philadelphia', description: 'Mussarela, filé de carne do sol, catupiry philadelphia e orégano', type: 'PREMIUM' },
      { name: 'Carne do Sol Apimentada', description: 'Mussarela, filé de carne do sol, pimenta calabresa e orégano', type: 'PREMIUM' },
      { name: 'Mega Nordestina', description: 'Mussarela, carne do sol, cebola, queijo coalho, banana da terra e orégano', type: 'PREMIUM' },
      { name: 'Camarão aos Três Queijos', description: 'Mussarela, camarão, queijo do reino, gorgonzola, cebola e orégano', type: 'PREMIUM' },
      { name: 'Strogonoff de Camarão', description: 'Mussarela, strogonoff de camarão, batata palha e orégano', type: 'PREMIUM' },
      { name: 'Carne do Sol aos Três Queijos', description: 'Mussarela, carne do sol, queijo do reino, queijo gorgonzola, cebola e orégano', type: 'PREMIUM' },
      { name: 'Sabor do Chef', description: 'Mussarela, filé de carne do sol acebolado, queijo coalho, queijo do reino, catupiry philadelphia e orégano', type: 'PREMIUM' },
      
      // Especiais
      { name: 'Atum', description: 'Mussarela, atum, azeitonas e orégano', type: 'ESPECIAL' },
      { name: 'Atum Acebolado', description: 'Mussarela, atum, cebola, azeitonas e orégano', type: 'ESPECIAL' },
      { name: 'Atum Especial', description: 'Mussarela, atum, cebola, azeitonas, catupiry e orégano', type: 'ESPECIAL' },
      { name: 'Atum a Moda do Chef', description: 'Mussarela, atum, cebola, queijo coalho, azeitonas e orégano', type: 'ESPECIAL' },
      { name: 'Bacon', description: 'Mussarela, bacon, cebola e orégano', type: 'ESPECIAL' },
      { name: 'Bacon Crocante', description: 'Mussarela, bacon acebolado, batata palha e orégano', type: 'ESPECIAL' },
      { name: 'Bacon Especial', description: 'Mussarela, bacon, cebola, catupiry e orégano', type: 'ESPECIAL' },
      { name: 'Nordestina', description: 'Mussarela, carne do sol acebolada e orégano', type: 'ESPECIAL' },
      { name: 'Nordestina Especial', description: 'Mussarela, carne do sol acebolada, azeitonas, catupiry e orégano', type: 'ESPECIAL' },
      { name: 'Nordestina a Moda do Chef', description: 'Mussarela, carne do sol acebolada, queijo coalho e orégano', type: 'ESPECIAL' },
      { name: 'Frango Especial', description: 'Mussarela, filé de frango desfiado, cebola, catupiry e orégano', type: 'ESPECIAL' },
      { name: 'Frango a Moda da Casa', description: 'Mussarela, filé de frango desfiado, milho verde, catupiry e orégano', type: 'ESPECIAL' },
      { name: 'Frango a Moda do Chef', description: 'Mussarela, filé de frango desfiado, queijo do reino, catupiry e orégano', type: 'ESPECIAL' },
      { name: 'Lombinho', description: 'Mussarela, lombinho fatiado, azeitona e orégano', type: 'ESPECIAL' },
      { name: '4 Queijos', description: 'Mussarela, queijo do reino, queijo coalho, gorgonzola e orégano', type: 'ESPECIAL' },
      
      // Doces
      { name: 'Brigadeiro de Panela', description: 'Mussarela, Brigadeiro de panela e granulado', type: 'TRADICIONAL' },
      { name: 'Banana com Canela', description: 'Mussarela, banana e canela', type: 'TRADICIONAL' },
      { name: 'Romeu e Julieta', description: 'Mussarela e goiabada', type: 'TRADICIONAL' },
      { name: 'Churros', description: 'Mussarela, leite condensado, doce de leite, açúcar e canela', type: 'TRADICIONAL' }
    ]

    // Limpar sabores existentes
    await prisma.pizzaFlavor.deleteMany()

    // Criar sabores
    for (const flavor of flavors) {
      await prisma.pizzaFlavor.create({
        data: flavor
      })
    }

    console.log(`${flavors.length} sabores de pizza criados`)

    // Buscar ou criar categoria de pizza
    let pizzaCategory = await prisma.category.findFirst({
      where: { name: 'Pizzas' }
    })

    if (!pizzaCategory) {
      pizzaCategory = await prisma.category.create({
        data: {
          name: 'Pizzas',
          description: 'Pizzas tradicionais, especiais e doces',
          image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop'
        }
      })
    }

    // Atualizar combos existentes para marcar pizzas
    const existingCombos = await prisma.combo.findMany({
      where: {
        categoryId: pizzaCategory.id
      }
    })

    for (const combo of existingCombos) {
      await prisma.combo.update({
        where: { id: combo.id },
        data: { isPizza: true }
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

    for (const size of sizes) {
      await prisma.pizzaSize.create({
        data: {
          comboId: pizzaCombo.id,
          name: size.name,
          slices: size.slices,
          maxFlavors: size.maxFlavors,
          basePrice: size.basePrice,
          isActive: true
        }
      })
    }

    console.log(`${sizes.length} tamanhos de pizza criados`)

    console.log('Dados de pizza populados com sucesso!')
    console.log('Acesse /client/menu para ver as opções de pizza')

  } catch (error) {
    console.error('Erro ao popular dados de pizza:', error)
  } finally {
    await prisma.$disconnect()
  }
}

populatePizzaData()
