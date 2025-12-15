const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function setupPizzaCategories() {
  try {
    console.log('🍕 Iniciando configuração de categorias de pizza...')

    // Preços por tipo e tamanho
    const prices = {
      TRADICIONAL: {
        GRANDE: 48.00,
        FAMILIA: 58.00
      },
      ESPECIAL: {
        GRANDE: 62.00,
        FAMILIA: 72.00
      },
      PREMIUM: {
        GRANDE: 72.00,
        FAMILIA: 82.00
      }
    }

    // Criar ou atualizar categorias
    const categories = [
      { name: 'Pizzas Tradicionais', order: 1, type: 'TRADICIONAL' },
      { name: 'Pizzas Especiais', order: 2, type: 'ESPECIAL' },
      { name: 'Pizzas Premiums', order: 3, type: 'PREMIUM' }
    ]

    for (const catData of categories) {
      // Verificar se categoria já existe
      let category = await prisma.category.findFirst({
        where: { name: catData.name }
      })

      if (!category) {
        category = await prisma.category.create({
          data: {
            name: catData.name,
            description: `Pizzas ${catData.type === 'TRADICIONAL' ? 'Tradicionais' : catData.type === 'ESPECIAL' ? 'Especiais' : 'Premiums'}`,
            isActive: true,
            order: catData.order
          }
        })
        console.log(`✅ Categoria criada: ${catData.name}`)
      } else {
        // Atualizar ordem se necessário
        await prisma.category.update({
          where: { id: category.id },
          data: { order: catData.order }
        })
        console.log(`ℹ️  Categoria já existe: ${catData.name}`)
      }

      // Criar produtos (Pizza Grande e Pizza Família)
      const products = [
        { name: 'Pizza Grande', size: 'GRANDE', slices: 8, maxFlavors: 3 },
        { name: 'Pizza Família', size: 'FAMILIA', slices: 13, maxFlavors: 4 }
      ]

      for (const product of products) {
        const price = prices[catData.type][product.size]
        
        // Verificar se produto já existe
        let combo = await prisma.combo.findFirst({
          where: {
            name: product.name,
            categoryId: category.id
          }
        })

        if (!combo) {
          combo = await prisma.combo.create({
            data: {
              name: product.name,
              description: `${product.name} - Pizzas ${catData.type === 'TRADICIONAL' ? 'Tradicionais' : catData.type === 'ESPECIAL' ? 'Especiais' : 'Premiums'}`,
              price: price,
              categoryId: category.id,
              isActive: true,
              isPizza: true,
              allowCustomization: true,
              pizzaQuantity: 1,
              showFlavors: true
            }
          })
          console.log(`  ✅ Produto criado: ${product.name} - R$ ${price.toFixed(2)}`)

          // Criar tamanho da pizza
          await prisma.pizzaSize.create({
            data: {
              comboId: combo.id,
              name: product.size,
              slices: product.slices,
              maxFlavors: product.maxFlavors,
              basePrice: price,
              isActive: true
            }
          })
          console.log(`    ✅ Tamanho criado: ${product.size} (${product.slices} fatias, ${product.maxFlavors} sabores)`)
        } else {
          // Atualizar preço se necessário
          await prisma.combo.update({
            where: { id: combo.id },
            data: { price: price }
          })

          // Atualizar tamanho se existir
          const size = await prisma.pizzaSize.findFirst({
            where: { comboId: combo.id }
          })
          if (size) {
            await prisma.pizzaSize.update({
              where: { id: size.id },
              data: {
                basePrice: price,
                slices: product.slices,
                maxFlavors: product.maxFlavors
              }
            })
          } else {
            await prisma.pizzaSize.create({
              data: {
                comboId: combo.id,
                name: product.size,
                slices: product.slices,
                maxFlavors: product.maxFlavors,
                basePrice: price,
                isActive: true
              }
            })
          }
          console.log(`  ℹ️  Produto já existe: ${product.name} - Preço atualizado para R$ ${price.toFixed(2)}`)
        }
      }
    }

    console.log('\n✅ Configuração concluída com sucesso!')
    console.log('\n📋 Resumo:')
    console.log('  - 3 Categorias criadas')
    console.log('  - 6 Produtos criados (2 por categoria)')
    console.log('  - Preços configurados:')
    console.log('    Tradicional: Grande R$ 48,00 | Família R$ 58,00')
    console.log('    Especial: Grande R$ 62,00 | Família R$ 72,00')
    console.log('    Premium: Grande R$ 72,00 | Família R$ 82,00')

  } catch (error) {
    console.error('❌ Erro ao configurar categorias:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  setupPizzaCategories()
    .then(() => {
      console.log('\n✨ Processo finalizado!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Erro fatal:', error)
      process.exit(1)
    })
}

module.exports = { setupPizzaCategories }

