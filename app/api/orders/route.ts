import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Não autorizado' },
        { status: 401 }
      )
    }

    const orders = await prisma.order.findMany({
      where: {
        userId: session.user.id
      },
      include: {
        items: {
          include: {
            combo: true
          }
        },
        address: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(orders)
  } catch (error) {
    console.error('Erro ao buscar pedidos:', error)
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('=== INÍCIO DO PROCESSAMENTO DE PEDIDO ===')
    
    const session = await getServerSession(authOptions)
    console.log('Session encontrada:', !!session)
    
    const body = await request.json()
    console.log('Body recebido:', JSON.stringify(body, null, 2))
    
    // Validar dados obrigatórios
    const { items, deliveryType, paymentMethod, addressId, notes, total, customer, address, customPizzas } = body

    // Validações críticas
    if (!items || !Array.isArray(items) || items.length === 0) {
      console.error('ERRO: Nenhum item encontrado no pedido')
      return NextResponse.json(
        { message: 'Nenhum item encontrado no pedido' },
        { status: 400 }
      )
    }

    // Validar apenas total (crítico)
    if (!total || total <= 0) {
      console.error('ERRO: Total inválido', { total })
      return NextResponse.json(
        { message: 'Total do pedido inválido' },
        { status: 400 }
      )
    }
    
    // Usar valores padrão se não fornecidos
    const finalDeliveryType = deliveryType || 'PICKUP'
    const finalPaymentMethod = paymentMethod || 'CASH'

    // Validar endereço apenas se for entrega E se endereço foi fornecido
    if (finalDeliveryType === 'DELIVERY') {
      // Se forneceu endereço, validar campos mínimos
      if (address && address.street && address.number && address.city && address.state) {
        // Endereço válido fornecido, continuar
      } else if (addressId) {
        // Endereço existente selecionado, continuar
      } else {
        // Sem endereço mas é entrega - usar endereço padrão ou permitir sem validação rigorosa
        console.warn('⚠️ Entrega sem endereço completo, continuando mesmo assim')
      }
    }

    let userId = session?.user?.id
    let orderAddressId = addressId

    console.log('User ID da sessão:', userId)

    // Se usuário logado e forneceu novo endereço, salvar
    if (userId && address && !addressId && deliveryType === 'DELIVERY') {
      try {
        console.log('Salvando novo endereço para usuário logado')
        const newAddress = await prisma.address.create({
          data: {
            userId: userId,
            street: address.street,
            number: address.number,
            complement: address.complement || '',
            neighborhood: address.neighborhood || '',
            city: address.city,
            state: address.state,
            zipCode: address.zipCode || '',
            isDefault: false // Não definir como padrão automaticamente
          }
        })
        orderAddressId = newAddress.id
        console.log('Endereço salvo:', orderAddressId)
      } catch (error) {
        console.error('Erro ao salvar endereço:', error)
        // Continuar mesmo se falhar ao salvar endereço
      }
    }

    // Se não estiver logado, criar ou buscar usuário público
    if (!userId) {
      console.log('Usuário não logado, criando/buscando usuário público')
      try {
        // Usar valores padrão para cliente se não fornecido
        const customerName = customer?.name || 'Cliente'
        const customerEmail = customer?.email || 'public@centraldaspizzas.com'
        const customerPhone = customer?.phone || ''

        // Buscar ou criar usuário público
        let publicUser = await prisma.user.findUnique({
          where: { email: 'public@centraldaspizzas.com' }
        })

        if (!publicUser) {
          console.log('Criando usuário público')
          const customerName = customer?.name || 'Cliente'
          const customerEmail = customer?.email || 'public@centraldaspizzas.com'
          
          publicUser = await prisma.user.create({
            data: {
              email: customerEmail,
              name: customerName,
              phone: customer?.phone || null,
              role: 'CLIENT',
              isActive: true
            }
          })
          console.log('Usuário público criado:', publicUser.id)
        } else {
          console.log('Usuário público encontrado:', publicUser.id)
        }

        userId = publicUser.id

        // Criar endereço se necessário para entrega
        if (deliveryType === 'DELIVERY' && address && !addressId) {
          console.log('Criando endereço para entrega')
          const newAddress = await prisma.address.create({
            data: {
              userId: userId,
              street: address.street,
              number: address.number,
              complement: address.complement || '',
              neighborhood: address.neighborhood || '',
              city: address.city,
              state: address.state,
              zipCode: address.zipCode || '',
              isDefault: true
            }
          })
          orderAddressId = newAddress.id
          console.log('Endereço criado:', orderAddressId)
        }
      } catch (error) {
        console.error('ERRO ao criar/buscar usuário público:', error)
        return NextResponse.json(
          { message: 'Erro ao processar dados do cliente' },
          { status: 500 }
        )
      }
    }

    console.log('Dados do pedido:', {
      userId,
      items: items.length,
      deliveryType,
      paymentMethod,
      total,
      notes: notes?.length || 0,
      orderAddressId
    })

    // Validar itens do pedido (apenas comboId é realmente crítico)
    for (const item of items) {
      if (!item.comboId) {
        console.error('ERRO: comboId obrigatório:', item)
        return NextResponse.json(
          { message: 'comboId é obrigatório para cada item' },
          { status: 400 }
        )
      }
      // Usar valores padrão se não fornecidos
      if (!item.quantity || item.quantity <= 0) {
        item.quantity = 1
      }
      if (!item.price || item.price <= 0) {
        // Tentar buscar preço do combo
        try {
          const combo = await prisma.combo.findUnique({ where: { id: item.comboId }, select: { price: true } })
          item.price = combo?.price || 0
        } catch (e) {
          item.price = 0
        }
      }
    }

    // Criar o pedido
    console.log('Criando pedido no banco de dados...')
    const order = await prisma.order.create({
      data: {
        userId: userId,
        addressId: deliveryType === 'DELIVERY' ? orderAddressId : null, // Só incluir addressId se for entrega
        total: parseFloat(total.toString()),
        deliveryType,
        paymentMethod,
        notes: notes || '',
        status: 'PENDING'
      }
    })

    console.log('Pedido criado com sucesso:', order.id)

    // Criar os itens do pedido
    console.log('Criando itens do pedido...')
    console.log('Items recebidos:', JSON.stringify(items, null, 2))
    
    for (const item of items) {
      // Validar dados básicos do item
      if (!item.comboId) {
        console.error('ERRO: comboId não fornecido no item:', item)
        throw new Error('comboId é obrigatório para cada item')
      }
      
      // Validar se o combo existe (usar select explícito para evitar erro de coluna não existente)
      try {
        const comboExists = await prisma.combo.findUnique({
          where: { id: item.comboId },
          select: { id: true, name: true, price: true, isActive: true }
        })
        
        if (!comboExists) {
          console.error(`ERRO: Combo não encontrado: ${item.comboId}`)
          throw new Error(`Combo não encontrado: ${item.comboId}`)
        }
      } catch (error: any) {
        if (error.message.includes('Combo não encontrado')) {
          throw error
        }
        console.error('Erro ao verificar combo:', error)
        throw new Error(`Erro ao verificar combo ${item.comboId}: ${error.message}`)
      }

      const orderItem = await prisma.orderItem.create({
        data: {
          orderId: order.id,
          comboId: item.comboId,
          quantity: parseInt(item.quantity.toString()),
          price: parseFloat(item.price.toString()),
          // Salvar dados de personalização
          selectedFlavors: item.flavors ? JSON.stringify(item.flavors) : null,
          observations: item.observations || null,
          pizzaSizeId: item.size || null,
          extras: item.extraItems || item.stuffedCrust ? JSON.stringify({
            extraItems: item.extraItems || {},
            stuffedCrust: item.stuffedCrust || false,
            flavorsPizza2: item.flavorsPizza2 || []
          }) : null
        }
      })

      // Criar itens extras se existirem (não crítico se falhar)
      if (item.extraItems && typeof item.extraItems === 'object' && Object.keys(item.extraItems).length > 0) {
        try {
          for (const [extraItemKey, extraData] of Object.entries(item.extraItems)) {
            const extra = extraData as any
            // extraItemKey pode ser "extraItemId" ou "extraItemId-optionId"
            const [extraItemId] = extraItemKey.includes('-') 
              ? extraItemKey.split('-') 
              : [extraItemKey]
            
            if (!extraItemId) continue
            
            try {
              // Validar se o extraItem existe
              const extraItemExists = await prisma.extraItem.findUnique({
                where: { id: extraItemId }
              })
              
              if (!extraItemExists) {
                console.warn(`ExtraItem não encontrado: ${extraItemId}, pulando...`)
                continue
              }

              await prisma.orderItemExtra.create({
                data: {
                  orderItemId: orderItem.id,
                  extraItemId: extraItemId,
                  quantity: extra.quantity || 1
                }
              })
            } catch (extraError: any) {
              console.warn(`Erro ao criar item extra ${extraItemId}:`, extraError?.message || extraError)
              // Continuar com próximo item extra
            }
          }
        } catch (error: any) {
          console.warn('Erro geral ao processar itens extras (não crítico):', error?.message || error)
          // Não bloquear o pedido se falhar
        }
      }

      // Se houver flavorsPizza2, criar um segundo item ou salvar no extras
      if (item.flavorsPizza2 && Array.isArray(item.flavorsPizza2) && item.flavorsPizza2.length > 0) {
        // Já está sendo salvo no campo extras acima
        console.log('Sabores da pizza 2 salvos:', item.flavorsPizza2)
      }
    }
    console.log('Itens do pedido criados:', items.length)

    // Criar pizzas personalizadas se existirem
    if (customPizzas && customPizzas.length > 0) {
      console.log('Criando pizzas personalizadas...')
      for (const customPizza of customPizzas) {
        await prisma.orderItem.create({
          data: {
            orderId: order.id,
            comboId: 'custom-pizza',
            quantity: 1,
            price: parseFloat(customPizza.totalPrice.toString()),
            pizzaSizeId: customPizza.size?.id,
            selectedFlavors: JSON.stringify(customPizza.flavors?.map((f: any) => f.id) || []),
            observations: customPizza.observations || '',
            extras: JSON.stringify({
              stuffedCrust: customPizza.stuffedCrust || false,
              premiumFlavors: customPizza.flavors?.filter((f: any) => f.type === 'PREMIUM').length || 0,
              especialFlavors: customPizza.flavors?.filter((f: any) => f.type === 'ESPECIAL').length || 0
            })
          }
        })
      }
      console.log('Pizzas personalizadas criadas:', customPizzas.length)
    }

    // Registrar venda no caixa (não crítico se falhar)
    try {
      console.log('Registrando venda no caixa...')
      const cashResponse = await fetch(`${process.env.NEXTAUTH_URL}/api/cash/sale`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: order.id,
          amount: total
        }),
      })
      
      if (!cashResponse.ok) {
        console.warn('Erro ao registrar venda no caixa, mas pedido foi criado')
      } else {
        console.log('Venda registrada no caixa com sucesso')
      }
    } catch (error) {
      console.warn('Erro ao registrar venda no caixa:', error)
    }

    // Buscar o pedido completo para retornar
    console.log('Buscando pedido completo...')
    const completeOrder = await prisma.order.findUnique({
      where: { id: order.id },
      include: {
        items: {
          include: {
            combo: {
              select: {
                id: true,
                name: true,
                description: true,
                price: true,
                image: true,
                isActive: true,
                categoryId: true,
                isPizza: true,
                allowCustomization: true,
                createdAt: true,
                updatedAt: true
              }
            }
          }
        },
        address: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        }
      }
    })

    console.log('=== PEDIDO PROCESSADO COM SUCESSO ===')
    return NextResponse.json({
      success: true,
      message: 'Pedido criado com sucesso',
      order: completeOrder
    }, { status: 201 })
  } catch (error: any) {
    console.error('=== ERRO CRÍTICO NO PROCESSAMENTO DE PEDIDO ===')
    console.error('Tipo do erro:', typeof error)
    console.error('Erro ao criar pedido:', error)
    
    // Log detalhado do erro para debug
    if (error instanceof Error) {
      console.error('Erro detalhado:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      })
    } else if (error && typeof error === 'object') {
      console.error('Erro objeto:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2))
    } else {
      console.error('Erro primitivo:', error)
    }
    
    // Retornar mensagem mais específica
    let errorMessage = 'Erro interno do servidor'
    if (error?.message) {
      errorMessage = error.message
    } else if (typeof error === 'string') {
      errorMessage = error
    }
    
    return NextResponse.json(
      { 
        success: false,
        message: errorMessage,
        error: process.env.NODE_ENV === 'development' ? (error?.stack || String(error)) : undefined
      },
      { status: 500 }
    )
  }
}
