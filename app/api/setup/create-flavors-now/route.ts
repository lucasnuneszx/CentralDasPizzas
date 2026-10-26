import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * Rota PÚBLICA para criar sabores imediatamente (SEM autenticação)
 * ATENÇÃO: Esta rota é pública para facilitar o setup inicial
 */
export async function GET(request: NextRequest) {
  try {
    console.log('Iniciando criação de sabores...')
    
    // Verificar quantos sabores já existem
    const existingCount = await prisma.pizzaFlavor.count()
    console.log(`Sabores existentes: ${existingCount}`)
    
    if (existingCount > 0) {
      console.log('Sabores já existem. Pulando criação.')
      return NextResponse.json({
        success: true,
        message: 'Sabores já existem no banco',
        existing: existingCount
      })
    }

    // Sabores Tradicionais
    const saboresTradicionais = [
      { name: 'Baiana', description: 'Mussarela, calabresa, pimenta calabresa e orégano' },
      { name: 'Banana com canela', description: 'Mussarela, banana e canela' },
      { name: 'Brigadeiro de panela', description: 'Mussarela, Brigadeiro de panela e granulado' },
      { name: 'Caipira', description: 'Mussarela, frango, milho e orégano' },
      { name: 'Calabresa', description: 'Mussarela, calabresa, cebola e orégano' },
      { name: 'Calabresa c/ cheddar', description: 'Mussarela, calabresa, cheddar e orégano' },
      { name: 'Churros', description: 'Mussarela, leite condensado, doce de leite, açúcar e canela' },
      { name: 'Dois queijos', description: 'Mussarela, catupiry e orégano' },
      { name: 'Frango c/ catupiry', description: 'Mussarela, frango desfiado, catupiry e orégano' },
      { name: 'Frango c/ cheddar', description: 'Mussarela, frango desfiado, cheddar e orégano' },
      { name: 'Lombinho', description: 'Camada dupla de mussarela e orégano' },
      { name: 'Marguerita', description: 'Mussarela, tomate, manjericão e orégano' },
      { name: 'Milho verde', description: 'Mussarela, milho verde e orégano' },
      { name: 'Mista especial', description: 'Mussarela, presunto, azeitona, milho verde e orégano' },
      { name: 'Moda vegetariana', description: 'Mussarela, palmito, milho verde, azeitona, manjericão e orégano' },
      { name: 'Portuguesa', description: 'Mussarela, presunto, ovos, cebola, pimentão, azeitona e orégano' },
      { name: 'Romeu e julieta', description: 'Mussarela e goiabada' }
    ]

    // Sabores Especiais
    const saboresEspeciais = [
      { name: '4 queijos', description: 'Mussarela, queijo do reino, queijo coalho, gorgonzola e orégano' },
      { name: 'Atum', description: 'Mussarela, atum, azeitonas e orégano' },
      { name: 'Atum acebolado', description: 'Mussarela, atum, cebola, azeitonas e orégano' },
      { name: 'Atum a moda do chef', description: 'Mussarela, atum, cebola, queijo coalho, azeitonas e orégano' },
      { name: 'Atum especial', description: 'Mussarela, atum, cebola, azeitonas, catupiry e orégano' },
      { name: 'Bacon', description: 'Mussarela, bacon, cebola e orégano' },
      { name: 'Bacon crocante', description: 'Mussarela, bacon acebolado, batata palha e orégano' },
      { name: 'Bacon especial', description: 'Mussarela, bacon, cebola, catupiry e orégano' },
      { name: 'Frango a moda da casa', description: 'Mussarela, filé de frango desfiado, milho verde, catupiry e orégano' },
      { name: 'Frango a moda do chef', description: 'Mussarela, filé de frango desfiado, queijo do reino, catupiry e orégano' },
      { name: 'Frango especial', description: 'Mussarela, filé de frango desfiado, cebola, catupiry e orégano' },
      { name: 'Lombinho', description: 'Mussarela, lombinho fatiado, azeitona e orégano' },
      { name: 'Nordestina', description: 'Mussarela, carne do sol acebolada e orégano' },
      { name: 'Nordestina a moda do chef', description: 'Mussarela, carne do sol acebolada, queijo coalho e orégano' },
      { name: 'Nordestina especial', description: 'Mussarela, carne do sol acebolada, azeitonas, catupiry e orégano' }
    ]

    // Sabores Premiums
    const saboresPremiums = [
      { name: 'Camarão aos três queijos', description: 'Mussarela, camarão, queijo do reino, gorgonzola, cebola e orégano' },
      { name: 'Camarão com catupiry philadelphia', description: 'Mussarela, camarão ao molho de frutos do mar, catupiry philadelphia e orégano' },
      { name: 'Camarão especial', description: 'Mussarela, camarão e orégano' },
      { name: 'Carne do Sol aos três Queijos', description: 'Mussarela, carne do sol, queijo do reino, queijo gorgonzola, cebola e orégano' },
      { name: 'Carne do sol apimentada', description: 'Mussarela, filé de carne do sol, pimenta calabresa e orégano' },
      { name: 'Carne do sol com catupiry philadelphia', description: 'Mussarela, filé de carne do sol, catupiry philadelphia e orégano' },
      { name: 'Mega nordestina', description: 'Mussarela, carne do sol, cebola, queijo coalho, banana da terra e orégano' },
      { name: 'Sabor do chef', description: 'Mussarela, filé de carne do sol acebolado, queijo coalho, queijo do reino, catupiry philadelphia e orégano' },
      { name: 'Strogonoff de Camarão', description: 'Mussarela, strogonoff de camarão, batata palha e orégano' }
    ]

    console.log('Criando sabores tradicionais...')
    const tradicionais = await Promise.all(
      saboresTradicionais.map(sabor =>
        prisma.pizzaFlavor.create({
          data: {
            name: sabor.name,
            description: sabor.description,
            type: 'TRADICIONAL',
            isActive: true
          }
        })
      )
    )
    console.log(`${tradicionais.length} sabores tradicionais criados`)

    console.log('Criando sabores especiais...')
    const especiais = await Promise.all(
      saboresEspeciais.map(sabor =>
        prisma.pizzaFlavor.create({
          data: {
            name: sabor.name,
            description: sabor.description,
            type: 'ESPECIAL',
            isActive: true
          }
        })
      )
    )
    console.log(`${especiais.length} sabores especiais criados`)

    console.log('Criando sabores premiums...')
    const premiums = await Promise.all(
      saboresPremiums.map(sabor =>
        prisma.pizzaFlavor.create({
          data: {
            name: sabor.name,
            description: sabor.description,
            type: 'PREMIUM',
            isActive: true
          }
        })
      )
    )
    console.log(`${premiums.length} sabores premiums criados`)

    const total = tradicionais.length + especiais.length + premiums.length

    return NextResponse.json({
      success: true,
      message: 'Sabores criados com sucesso!',
      created: {
        tradicionais: tradicionais.length,
        especiais: especiais.length,
        premiums: premiums.length,
        total
      }
    })
  } catch (error: any) {
    console.error('Erro ao criar sabores:', error)
    return NextResponse.json(
      { 
        success: false,
        message: 'Erro ao criar sabores',
        error: error.message
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  // Mesma lógica do GET
  return GET(request)
}



