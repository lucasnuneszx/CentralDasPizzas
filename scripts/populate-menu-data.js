const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function populateMenuData() {
  try {
    console.log('🍕 Populando dados do cardápio...')

    // Criar configurações iniciais da loja
    const settings = await prisma.systemSettings.upsert({
      where: { id: 'default' },
      update: {},
      create: {
        id: 'default',
        restaurantName: 'Central Das Pizzas Avenida Sul',
        restaurantAddress: 'Avenida Sul, Centro',
        restaurantPhone: '(11) 99999-9999',
        restaurantEmail: 'contato@centraldaspizzas.com',
        deliveryFee: 5.00,
        minOrderValue: 25.00,
        taxRate: 0,
        autoPrint: true,
        printerPort: '9100'
      }
    })

    console.log('✅ Configurações da loja criadas')

    // Criar categorias
    const categories = [
      {
        name: 'Pizzas Tradicionais',
        description: 'Nossas pizzas mais populares',
        image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop'
      },
      {
        name: 'Pizzas Especiais',
        description: 'Pizzas com ingredientes especiais',
        image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400&h=300&fit=crop'
      },
      {
        name: 'Pizzas Doces',
        description: 'Pizzas doces para sobremesa',
        image: 'https://images.unsplash.com/photo-1571997478779-2adcbbe9ab2f?w=400&h=300&fit=crop'
      },
      {
        name: 'Bebidas',
        description: 'Refrigerantes, sucos e cervejas',
        image: 'https://images.unsplash.com/photo-1544148103-0773bf10d330?w=400&h=300&fit=crop'
      }
    ]

    // Limpar dados existentes (respeitando foreign keys)
    await prisma.orderItem.deleteMany()
    await prisma.combo.deleteMany()
    await prisma.category.deleteMany()

    const createdCategories = await prisma.category.createMany({
      data: categories
    })

    const allCategories = await prisma.category.findMany()
    console.log(`✅ ${allCategories.length} categorias criadas`)

    // Criar combos/pizzas
    const combos = [
      // Pizzas Tradicionais
      {
        name: 'Pizza Margherita',
        description: 'Molho de tomate, mussarela, manjericão e azeite',
        price: 32.90,
        image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop',
        categoryName: 'Pizzas Tradicionais'
      },
      {
        name: 'Pizza Portuguesa',
        description: 'Presunto, ovos, cebola, azeitona, mussarela e molho de tomate',
        price: 38.90,
        image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400&h=300&fit=crop',
        categoryName: 'Pizzas Tradicionais'
      },
      {
        name: 'Pizza Calabresa',
        description: 'Calabresa, cebola, mussarela e molho de tomate',
        price: 35.90,
        image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop',
        categoryName: 'Pizzas Tradicionais'
      },
      {
        name: 'Pizza Frango com Catupiry',
        description: 'Frango desfiado, catupiry, mussarela e molho de tomate',
        price: 39.90,
        image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400&h=300&fit=crop',
        categoryName: 'Pizzas Tradicionais'
      },

      // Pizzas Especiais
      {
        name: 'Pizza Quatro Queijos',
        description: 'Mussarela, gorgonzola, parmesão, provolone e molho de tomate',
        price: 42.90,
        image: 'https://images.unsplash.com/photo-1571997478779-2adcbbe9ab2f?w=400&h=300&fit=crop',
        categoryName: 'Pizzas Especiais'
      },
      {
        name: 'Pizza Bacon com Cheddar',
        description: 'Bacon, cheddar, mussarela e molho de tomate',
        price: 44.90,
        image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400&h=300&fit=crop',
        categoryName: 'Pizzas Especiais'
      },
      {
        name: 'Pizza Camarão',
        description: 'Camarão, catupiry, mussarela e molho de tomate',
        price: 52.90,
        image: 'https://images.unsplash.com/photo-1571997478779-2adcbbe9ab2f?w=400&h=300&fit=crop',
        categoryName: 'Pizzas Especiais'
      },

      // Pizzas Doces
      {
        name: 'Pizza de Chocolate',
        description: 'Chocolate, morangos e chantilly',
        price: 28.90,
        image: 'https://images.unsplash.com/photo-1571997478779-2adcbbe9ab2f?w=400&h=300&fit=crop',
        categoryName: 'Pizzas Doces'
      },
      {
        name: 'Pizza de Banana',
        description: 'Banana, canela, açúcar e leite condensado',
        price: 26.90,
        image: 'https://images.unsplash.com/photo-1571997478779-2adcbbe9ab2f?w=400&h=300&fit=crop',
        categoryName: 'Pizzas Doces'
      },

      // Bebidas
      {
        name: 'Coca-Cola 2L',
        description: 'Refrigerante Coca-Cola 2 litros',
        price: 8.90,
        image: 'https://images.unsplash.com/photo-1544148103-0773bf10d330?w=400&h=300&fit=crop',
        categoryName: 'Bebidas'
      },
      {
        name: 'Suco de Laranja 1L',
        description: 'Suco natural de laranja 1 litro',
        price: 12.90,
        image: 'https://images.unsplash.com/photo-1544148103-0773bf10d330?w=400&h=300&fit=crop',
        categoryName: 'Bebidas'
      },
      {
        name: 'Cerveja Skol 350ml',
        description: 'Cerveja Skol lata 350ml',
        price: 4.90,
        image: 'https://images.unsplash.com/photo-1544148103-0773bf10d330?w=400&h=300&fit=crop',
        categoryName: 'Bebidas'
      }
    ]

    for (const comboData of combos) {
      const category = allCategories.find(cat => cat.name === comboData.categoryName)
      if (category) {
        const combo = await prisma.combo.create({
          data: {
            name: comboData.name,
            description: comboData.description,
            price: comboData.price,
            image: comboData.image,
            categoryId: category.id,
            isActive: true
          }
        })
        console.log(`✅ Combo criado: ${combo.name}`)
      }
    }

    console.log('🎉 Dados do cardápio populados com sucesso!')
    console.log('📱 Acesse /client/menu para ver o cardápio')
    console.log('⚙️ Acesse /admin/settings para configurar a loja')

  } catch (error) {
    console.error('❌ Erro ao popular dados:', error)
  } finally {
    await prisma.$disconnect()
  }
}

populateMenuData()
