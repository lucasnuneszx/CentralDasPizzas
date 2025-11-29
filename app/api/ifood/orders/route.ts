import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { prisma } from '@/lib/prisma'

// Simulação da API do iFood (em produção, usar a API real)
const IFOOD_API_BASE = process.env.IFOOD_API_URL || 'https://api.ifood.com.br'
const IFOOD_API_KEY = process.env.IFOOD_API_KEY || ''

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Verificar se o usuário tem permissão para acessar integrações
    const allowedRoles = ['ADMIN', 'MANAGER']
    if (!allowedRoles.includes(session.user.role as any)) {
      return NextResponse.json(
        { message: 'Sem permissão' },
        { status: 403 }
      )
    }

    // Buscar pedidos do iFood
    const ifoodOrders = await prisma.order.findMany({
      where: {
        paymentMethod: 'IFOOD',
        ifoodOrderId: {
          not: null
        }
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

    return NextResponse.json(ifoodOrders)
  } catch (error) {
    console.error('Erro ao buscar pedidos do iFood:', error)
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Verificar se o usuário tem permissão para acessar integrações
    const allowedRoles = ['ADMIN', 'MANAGER']
    if (!allowedRoles.includes(session.user.role as any)) {
      return NextResponse.json(
        { message: 'Sem permissão' },
        { status: 403 }
      )
    }

    const { action, orderId, status } = await request.json()

    if (action === 'sync') {
      // Sincronizar pedidos do iFood
      await syncIfoodOrders()
      return NextResponse.json({ message: 'Sincronização iniciada' })
    }

    if (action === 'update_status') {
      // Atualizar status do pedido no iFood
      await updateIfoodOrderStatus(orderId, status)
      return NextResponse.json({ message: 'Status atualizado' })
    }

    return NextResponse.json(
      { message: 'Ação não reconhecida' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Erro na integração com iFood:', error)
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

async function syncIfoodOrders() {
  try {
    // Em produção, fazer chamada real para a API do iFood
    // const response = await fetch(`${IFOOD_API_BASE}/orders`, {
    //   headers: {
    //     'Authorization': `Bearer ${IFOOD_API_KEY}`,
    //     'Content-Type': 'application/json'
    //   }
    // })
    
    // Simulação de pedidos do iFood
    const mockIfoodOrders = [
      {
        id: 'ifood_' + Date.now(),
        items: [
          {
            comboId: 'combo1', // ID de um combo existente
            quantity: 2,
            price: 29.90
          }
        ],
        total: 59.80,
        deliveryType: 'DELIVERY',
        paymentMethod: 'IFOOD',
        address: {
          street: 'Rua das Flores',
          number: '123',
          neighborhood: 'Centro',
          city: 'São Paulo',
          state: 'SP',
          zipCode: '01234-567'
        },
        notes: 'Pedido via iFood'
      }
    ]

    for (const ifoodOrder of mockIfoodOrders) {
      // Verificar se o pedido já existe
      const existingOrder = await prisma.order.findFirst({
        where: {
          ifoodOrderId: ifoodOrder.id
        }
      })

      if (!existingOrder) {
        // Criar pedido do iFood
        const order = await prisma.order.create({
          data: {
            userId: 'system', // Usuário sistema para pedidos do iFood
            total: ifoodOrder.total,
            deliveryType: ifoodOrder.deliveryType,
            paymentMethod: 'IFOOD',
            notes: ifoodOrder.notes,
            status: 'PENDING',
            ifoodOrderId: ifoodOrder.id
          }
        })

        // Criar itens do pedido
        await prisma.orderItem.createMany({
          data: ifoodOrder.items.map((item: any) => ({
            orderId: order.id,
            comboId: item.comboId,
            quantity: item.quantity,
            price: item.price
          }))
        })

        // Registrar venda no caixa
        await prisma.cashLog.create({
          data: {
            orderId: order.id,
            type: 'ORDER',
            amount: ifoodOrder.total,
            description: `Venda iFood - Pedido #${order.id.slice(-8)}`
          }
        })

        // IMPRESSÃO AUTOMÁTICA para pedidos do iFood
        // Nota: A impressão será feita no cliente usando a porta serial selecionada
        // Apenas registrar no log que o pedido deve ser impresso
        try {
          await prisma.cashLog.create({
            data: {
              orderId: order.id,
              type: 'ORDER_PRINTED',
              amount: 0,
              description: `Pedido iFood confirmado - aguardando impressão - #${order.id.slice(-8)}`
            }
          })
        } catch (printError) {
          console.error('Erro ao registrar impressão do pedido iFood:', printError)
          // Não bloquear o fluxo se falhar
        }
      }
    }
  } catch (error) {
    console.error('Erro ao sincronizar pedidos do iFood:', error)
  }
}

async function updateIfoodOrderStatus(orderId: string, status: string) {
  try {
    // Atualizar status no banco local
    await prisma.order.update({
      where: { id: orderId },
      data: { status: status as any }
    })

    // Em produção, notificar o iFood sobre a mudança de status
    // const order = await prisma.order.findUnique({
    //   where: { id: orderId }
    // })
    
    // if (order?.ifoodOrderId) {
    //   await fetch(`${IFOOD_API_BASE}/orders/${order.ifoodOrderId}/status`, {
    //     method: 'PUT',
    //     headers: {
    //       'Authorization': `Bearer ${IFOOD_API_KEY}`,
    //       'Content-Type': 'application/json'
    //     },
    //     body: JSON.stringify({ status })
    //   })
    // }
  } catch (error) {
    console.error('Erro ao atualizar status do pedido iFood:', error)
  }
}



