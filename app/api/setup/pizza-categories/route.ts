import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser, checkAnyRole } from '@/lib/auth-helper'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    
    if (!user) {
      return NextResponse.json(
        { message: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Verificar se o usuário tem permissão
    if (!(await checkAnyRole(request, ['ADMIN']))) {
      return NextResponse.json(
        { message: 'Sem permissão' },
        { status: 403 }
      )
    }

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

    const results = []

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
        results.push(`✅ Categoria criada: ${catData.name}`)
      } else {
        // Atualizar ordem se necessário
        await prisma.category.update({
          where: { id: category.id },
          data: { order: catData.order }
        })
        results.push(`ℹ️  Categoria já existe: ${catData.name}`)
      }

      // Criar produtos (Pizza Grande e Pizza Família)
      const products = [
        { name: 'Pizza Grande', size: 'GRANDE', slices: 8, maxFlavors: 3 },
        { name: 'Pizza Família', size: 'FAMILIA', slices: 13, maxFlavors: 4 }
      ]

      for (const product of products) {
        const price = prices[catData.type as keyof typeof prices][product.size as keyof typeof prices['TRADICIONAL']]
        
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
          results.push(`  ✅ Produto criado: ${product.name} - R$ ${price.toFixed(2)}`)

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
          results.push(`    ✅ Tamanho criado: ${product.size} (${product.slices} fatias, ${product.maxFlavors} sabores)`)
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
          results.push(`  ℹ️  Produto já existe: ${product.name} - Preço atualizado para R$ ${price.toFixed(2)}`)
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Categorias e produtos configurados com sucesso!',
      results
    })
  } catch (error: any) {
    console.error('Erro ao configurar categorias:', error)
    return NextResponse.json(
      { 
        success: false,
        message: 'Erro ao configurar categorias',
        error: error.message 
      },
      { status: 500 }
    )
  }
}

