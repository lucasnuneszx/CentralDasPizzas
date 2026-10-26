import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function createSampleData() {
  try {
    console.log('Criando dados de exemplo...')

    // Criar categorias
    const categories = [
      {
        name: 'Pizzas',
        description: 'Pizzas tradicionais e especiais',
        image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400'
      },
      {
        name: 'Combos',
        description: 'Combos com pizza + bebida',
        image: 'https://images.unsplash.com/photo-1571997478779-2adcbbe9ab2f?w=400'
      },
      {
        name: 'Bebidas',
        description: 'Refrigerantes e sucos',
        image: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400'
      }
    ]

    const createdCategories = []
    for (const categoryData of categories) {
      const category = await prisma.category.create({
        data: categoryData
      })
      createdCategories.push(category)
      console.log(`Categoria criada: ${category.name}`)
    }

    // Criar combos
    const combos = [
      {
        name: 'Pizza Margherita',
        description: 'Molho de tomate, mussarela, manjericão fresco e azeite',
        price: 29.90,
        image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400',
        categoryId: createdCategories[0].id
      },
      {
        name: 'Pizza Calabresa',
        description: 'Molho de tomate, mussarela, calabresa e cebola',
        price: 32.90,
        image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400',
        categoryId: createdCategories[0].id
      },
      {
        name: 'Combo Margherita + Refrigerante',
        description: 'Pizza Margherita + Refrigerante 350ml',
        price: 35.90,
        image: 'https://images.unsplash.com/photo-1571997478779-2adcbbe9ab2f?w=400',
        categoryId: createdCategories[1].id
      },
      {
        name: 'Combo Calabresa + Refrigerante',
        description: 'Pizza Calabresa + Refrigerante 350ml',
        price: 38.90,
        image: 'https://images.unsplash.com/photo-1571997478779-2adcbbe9ab2f?w=400',
        categoryId: createdCategories[1].id
      },
      {
        name: 'Coca-Cola 350ml',
        description: 'Refrigerante Coca-Cola lata 350ml',
        price: 4.50,
        image: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400',
        categoryId: createdCategories[2].id
      },
      {
        name: 'Suco de Laranja 500ml',
        description: 'Suco natural de laranja 500ml',
        price: 6.90,
        image: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400',
        categoryId: createdCategories[2].id
      }
    ]

    for (const comboData of combos) {
      const combo = await prisma.combo.create({
        data: comboData
      })
      console.log(`Combo criado: ${combo.name} - R$ ${combo.price}`)
    }

    console.log('\nDados de exemplo criados com sucesso!')
    console.log('\nResumo:')
    console.log(`- ${createdCategories.length} categorias criadas`)
    console.log(`- ${combos.length} combos criados`)
    console.log('\nAcesse http://localhost:3000 para ver o sistema funcionando!')

  } catch (error) {
    console.error('Erro ao criar dados de exemplo:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createSampleData()


