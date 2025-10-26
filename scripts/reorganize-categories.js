const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function reorganizeCategories() {
  try {
    console.log('🔄 Reorganizando categorias...')

    // Limpar categorias existentes (manter combos)
    const existingCategories = await prisma.category.findMany({
      include: { combos: true }
    })

    // Criar novas categorias na ordem desejada
    const newCategories = [
      {
        name: 'Combos',
        description: 'Combos completos com pizza + bebida',
        image: 'https://images.unsplash.com/photo-1571997478779-2adcbbe9ab2f?w=400&h=300&fit=crop'
      },
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
        name: 'Hambúrgueres',
        description: 'Hambúrgueres artesanais e combos',
        image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=300&fit=crop'
      },
      {
        name: 'Bebidas',
        description: 'Refrigerantes, sucos e cervejas',
        image: 'https://images.unsplash.com/photo-1544148103-0773bf10d330?w=400&h=300&fit=crop'
      }
    ]

    // Mover combos existentes para a nova categoria de Combos
    const combosCategory = newCategories[0]
    const createdCombosCategory = await prisma.category.create({
      data: combosCategory
    })

    // Mover todos os combos existentes para a categoria de Combos
    for (const category of existingCategories) {
      if (category.combos.length > 0) {
        await prisma.combo.updateMany({
          where: { categoryId: category.id },
          data: { categoryId: createdCombosCategory.id }
        })
      }
    }

    // Criar as outras categorias
    for (let i = 1; i < newCategories.length; i++) {
      await prisma.category.create({
        data: newCategories[i]
      })
    }

    // Remover categorias antigas vazias
    await prisma.category.deleteMany({
      where: {
        id: {
          not: createdCombosCategory.id
        },
        combos: {
          none: {}
        }
      }
    })

    console.log('✅ Categorias reorganizadas com sucesso!')
    console.log('📋 Nova ordem:')
    console.log('1. Combos')
    console.log('2. Pizzas Tradicionais')
    console.log('3. Pizzas Especiais')
    console.log('4. Pizzas Doces')
    console.log('5. Hambúrgueres')
    console.log('6. Bebidas')

  } catch (error) {
    console.error('❌ Erro ao reorganizar categorias:', error)
  } finally {
    await prisma.$disconnect()
  }
}

reorganizeCategories()
