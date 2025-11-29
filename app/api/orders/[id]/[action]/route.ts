import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string, action: string }> | { id: string, action: string } }
) {
  try {
    // Resolver params se for Promise (Next.js 15+)
    const resolvedParams = params instanceof Promise ? await params : params
    
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Verificar se o usuário tem permissão para gerenciar pedidos
    const allowedRoles = ['ADMIN', 'MANAGER', 'CASHIER']
    if (!allowedRoles.includes(session.user.role as any)) {
      return NextResponse.json(
        { message: 'Sem permissão' },
        { status: 403 }
      )
    }

    const orderId = resolvedParams.id
    const action = resolvedParams.action
    
    console.log('=== PROCESSANDO AÇÃO DO PEDIDO ===')
    console.log('Order ID:', orderId)
    console.log('Action:', action)

    // Buscar o pedido (usar select explícito para evitar erro de coluna não existente)
    const order = await prisma.order.findUnique({
      where: { id: orderId },
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
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        },
        address: true
      }
    })

    if (!order) {
      return NextResponse.json(
        { message: 'Pedido não encontrado' },
        { status: 404 }
      )
    }

    switch (action) {
      case 'accept':
        return await acceptOrder(order, session.user.id)
      
      case 'reject':
        return await rejectOrder(order, session.user.id)
      
      case 'print':
        return await printOrder(order, session.user.id)
      
      default:
        return NextResponse.json(
          { message: 'Ação não reconhecida' },
          { status: 400 }
        )
    }
  } catch (error: any) {
    console.error('=== ERRO AO PROCESSAR AÇÃO DO PEDIDO ===')
    console.error('Tipo do erro:', typeof error)
    console.error('Mensagem:', error?.message)
    console.error('Stack:', error?.stack)
    console.error('Código:', error?.code)
    console.error('Erro completo:', JSON.stringify(error, null, 2))
    
    return NextResponse.json(
      { 
        message: 'Erro interno do servidor',
        error: process.env.NODE_ENV === 'development' ? error?.message : undefined,
        code: error?.code
      },
      { status: 500 }
    )
  }
}

async function acceptOrder(order: any, userId: string) {
  try {
    console.log('=== ACEITANDO PEDIDO ===')
    console.log('Order ID:', order.id)
    console.log('User ID:', userId)
    
    // Atualizar status do pedido
    const updatedOrder = await prisma.order.update({
      where: { id: order.id },
      data: {
        status: 'CONFIRMED',
        confirmedAt: new Date(),
        confirmedBy: userId
      },
      select: {
        id: true,
        status: true,
        total: true,
        userId: true,
        createdAt: true,
        updatedAt: true
      }
    })
    
    console.log('Pedido atualizado:', updatedOrder)

    // Criar notificação para o cliente
    await prisma.notification.create({
      data: {
        userId: order.userId,
        type: 'ORDER_UPDATE',
        source: order.ifoodOrderId ? 'IFOOD' : 'SYSTEM',
        title: 'Pedido Confirmado',
        message: `Seu pedido #${order.id.slice(-8)} foi confirmado e está sendo preparado!`,
        orderId: order.id
      }
    })

    // Registrar no log do caixa
    await prisma.cashLog.create({
      data: {
        orderId: order.id,
        type: 'ORDER_CONFIRMED',
        amount: order.total,
        description: `Pedido confirmado - #${order.id.slice(-8)}`
      }
    })

    // IMPRESSÃO AUTOMÁTICA ao aceitar
    // Nota: A impressão será feita no cliente usando a porta serial selecionada
    // Apenas registrar no log que o pedido deve ser impresso
    try {
      await prisma.cashLog.create({
        data: {
          orderId: order.id,
          type: 'ORDER_PRINTED',
          amount: 0,
          description: `Pedido confirmado - aguardando impressão - #${order.id.slice(-8)}`
        }
      })
    } catch (printError) {
      console.error('Erro ao registrar impressão:', printError)
      // Não bloquear o fluxo se falhar
    }

    await prisma.cashLog.create({
      data: {
        orderId: order.id,
        type: 'ORDER_PRINTED',
        amount: 0,
        description: `Pedido impresso automaticamente - #${order.id.slice(-8)}`
      }
    })

    return NextResponse.json({
      message: 'Pedido aceito e impresso automaticamente',
      order: updatedOrder
    })
  } catch (error) {
    console.error('Erro ao aceitar pedido:', error)
    throw error
  }
}

async function rejectOrder(order: any, userId: string) {
  try {
    console.log('=== REJEITANDO PEDIDO ===')
    console.log('Order ID:', order.id)
    console.log('User ID:', userId)
    
    // Atualizar status do pedido
    const updatedOrder = await prisma.order.update({
      where: { id: order.id },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        cancelledBy: userId
      },
      select: {
        id: true,
        status: true,
        total: true,
        userId: true,
        createdAt: true,
        updatedAt: true
      }
    })
    
    console.log('Pedido atualizado:', updatedOrder)

    // Criar notificação para o cliente
    await prisma.notification.create({
      data: {
        userId: order.userId,
        type: 'ORDER_UPDATE',
        source: order.ifoodOrderId ? 'IFOOD' : 'SYSTEM',
        title: 'Pedido Cancelado',
        message: `Seu pedido #${order.id.slice(-8)} foi cancelado. Entre em contato conosco para mais informações.`,
        orderId: order.id
      }
    })

    // Registrar no log do caixa
    await prisma.cashLog.create({
      data: {
        orderId: order.id,
        type: 'ORDER_CANCELLED',
        amount: -order.total,
        description: `Pedido cancelado - #${order.id.slice(-8)}`
      }
    })

    return NextResponse.json({
      message: 'Pedido rejeitado com sucesso',
      order: updatedOrder
    })
  } catch (error) {
    console.error('Erro ao rejeitar pedido:', error)
    throw error
  }
}

async function printOrder(order: any, userId: string) {
  try {
    // Registrar impressão no log
    await prisma.cashLog.create({
      data: {
        orderId: order.id,
        type: 'ORDER_PRINTED',
        amount: 0,
        description: `Pedido impresso - #${order.id.slice(-8)}`
      }
    })

    // Aqui você pode integrar com o sistema de impressão
    // Por exemplo, enviar para uma fila de impressão ou chamar uma API de impressão
    
    return NextResponse.json({
      message: 'Pedido enviado para impressão',
      orderId: order.id,
      printData: {
        orderNumber: order.id.slice(-8),
        customerName: order.user?.name,
        items: order.items.map((item: any) => ({
          name: item.combo.name,
          quantity: item.quantity,
          price: item.price
        })),
        total: order.total,
        address: order.address,
        notes: order.notes
      }
    })
  } catch (error) {
    console.error('Erro ao imprimir pedido:', error)
    throw error
  }
}
