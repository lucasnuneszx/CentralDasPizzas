import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * Webhook para receber pedidos do WhatsApp via IA
 * 
 * Este endpoint recebe mensagens processadas por uma IA de WhatsApp
 * e cria pedidos automaticamente no sistema.
 * 
 * Formato esperado:
 * {
 *   "phone": "5511999999999",
 *   "customer": {
 *     "name": "João Silva",
 *     "phone": "5511999999999"
 *   },
 *   "items": [
 *     {
 *       "comboId": "combo-id",
 *       "quantity": 2,
 *       "price": 29.90,
 *       "observations": "Sem cebola"
 *     }
 *   ],
 *   "deliveryType": "DELIVERY" | "PICKUP",
 *   "paymentMethod": "PIX" | "CARD" | "CASH",
 *   "address": {
 *     "street": "Rua das Flores",
 *     "number": "123",
 *     "complement": "Apto 45",
 *     "neighborhood": "Centro",
 *     "city": "São Paulo",
 *     "state": "SP",
 *     "zipCode": "01234-567"
 *   },
 *   "notes": "Observações do pedido",
 *   "total": 59.80
 * }
 */
export async function POST(request: NextRequest) {
  try {
    console.log('📱 Webhook WhatsApp recebido')
    
    const body = await request.json()
    console.log('Dados recebidos:', JSON.stringify(body, null, 2))

    // Validar dados obrigatórios
    const { phone, customer, items, deliveryType, paymentMethod, address, notes, total } = body

    if (!phone || !customer || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { message: 'Dados obrigatórios ausentes', error: 'INVALID_DATA' },
        { status: 400 }
      )
    }

    if (!deliveryType || !paymentMethod || !total) {
      return NextResponse.json(
        { message: 'Dados do pedido incompletos', error: 'INCOMPLETE_ORDER' },
        { status: 400 }
      )
    }

    if (deliveryType === 'DELIVERY' && !address) {
      return NextResponse.json(
        { message: 'Endereço obrigatório para entrega', error: 'MISSING_ADDRESS' },
        { status: 400 }
      )
    }

    // Buscar ou criar usuário baseado no telefone
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { phone: phone },
          { email: `${phone}@whatsapp.com` }
        ]
      }
    })

    if (!user) {
      // Criar novo usuário
      user = await prisma.user.create({
        data: {
          name: customer.name || 'Cliente WhatsApp',
          email: `${phone}@whatsapp.com`,
          phone: phone,
          role: 'CLIENT',
          isActive: true
        }
      })
      console.log('✅ Novo usuário criado:', user.id)
    }

    // Criar endereço se necessário
    let orderAddressId = null
    if (deliveryType === 'DELIVERY' && address) {
      const existingAddress = await prisma.address.findFirst({
        where: {
          userId: user.id,
          street: address.street,
          number: address.number,
          zipCode: address.zipCode
        }
      })

      if (existingAddress) {
        orderAddressId = existingAddress.id
      } else {
        const newAddress = await prisma.address.create({
          data: {
            userId: user.id,
            street: address.street,
            number: address.number,
            complement: address.complement || '',
            neighborhood: address.neighborhood,
            city: address.city,
            state: address.state,
            zipCode: address.zipCode,
            isDefault: true
          }
        })
        orderAddressId = newAddress.id
      }
    }

    // Validar itens do pedido
    for (const item of items) {
      if (!item.comboId || !item.quantity || !item.price) {
        return NextResponse.json(
          { message: `Item inválido: ${JSON.stringify(item)}`, error: 'INVALID_ITEM' },
          { status: 400 }
        )
      }

      // Verificar se o combo existe (usar select explícito para evitar erro de coluna não existente)
      const combo = await prisma.combo.findUnique({
        where: { id: item.comboId },
        select: { id: true, name: true, price: true, isActive: true }
      })

      if (!combo) {
        return NextResponse.json(
          { message: `Combo não encontrado: ${item.comboId}`, error: 'COMBO_NOT_FOUND' },
          { status: 404 }
        )
      }
    }

    // Criar o pedido
    const order = await prisma.order.create({
      data: {
        userId: user.id,
        addressId: orderAddressId,
        total: parseFloat(total.toString()),
        deliveryType,
        paymentMethod,
        notes: notes || `Pedido via WhatsApp - ${phone}`,
        status: 'PENDING'
      }
    })

    console.log('✅ Pedido criado:', order.id)

    // Criar os itens do pedido
    await prisma.orderItem.createMany({
      data: items.map((item: any) => ({
        orderId: order.id,
        comboId: item.comboId,
        quantity: parseInt(item.quantity.toString()),
        price: parseFloat(item.price.toString()),
        observations: item.observations || null
      }))
    })

    // Registrar venda no caixa (usar URL relativa)
    try {
      await fetch('/api/cash/sale', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: order.id,
          amount: total
        }),
      })
    } catch (error) {
      console.warn('⚠️ Erro ao registrar venda no caixa:', error)
    }

    // Buscar pedido completo
    const completeOrder = await prisma.order.findUnique({
      where: { id: order.id },
      include: {
        items: {
          include: {
            combo: true
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

    console.log('✅ Pedido processado com sucesso:', order.id)

    return NextResponse.json({
      success: true,
      message: 'Pedido criado com sucesso',
      order: completeOrder,
      orderId: order.id
    }, { status: 201 })

  } catch (error) {
    console.error('❌ Erro ao processar webhook WhatsApp:', error)
    
    return NextResponse.json(
      { 
        success: false,
        message: 'Erro interno do servidor',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
}

/**
 * GET - Endpoint de verificação para webhooks
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const verifyToken = searchParams.get('verify_token')
  const challenge = searchParams.get('challenge')

  // Token de verificação (configure no .env)
  const expectedToken = process.env.WHATSAPP_WEBHOOK_TOKEN || 'your-verification-token'

  if (verifyToken === expectedToken) {
    return NextResponse.json({ challenge }, { status: 200 })
  }

  return NextResponse.json(
    { message: 'Token inválido' },
    { status: 403 }
  )
}

