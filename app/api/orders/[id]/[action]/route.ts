import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser, checkAnyRole } from '@/lib/auth-helper'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string, action: string } }
) {
  try {
    const user = await getAuthUser(request)
    
    if (!user) {
      return NextResponse.json(
        { message: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Verificar se o usuário tem permissão para gerenciar pedidos
    if (!(await checkAnyRole(request, ['ADMIN', 'MANAGER', 'CASHIER']))) {
      return NextResponse.json(
        { message: 'Sem permissão' },
        { status: 403 }
      )
    }

    const orderId = params?.id
    const action = params?.action
    
    if (!orderId || !action) {
      return NextResponse.json(
        { message: 'ID do pedido ou ação não fornecidos' },
        { status: 400 }
      )
    }
    
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
        return await acceptOrder(order, user.id)
      
      case 'reject':
        return await rejectOrder(order, user.id)
      
      case 'print':
        return await printOrder(order, user.id)
      
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

    // Criar notificação para o cliente (não crítico se falhar)
    try {
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
    } catch (notifError) {
      console.error('Erro ao criar notificação (não crítico):', notifError)
    }

    // Registrar no log do caixa (usar tipo válido)
    try {
      await prisma.cashLog.create({
        data: {
          orderId: order.id,
          type: 'ORDER', // Usar tipo válido conforme schema
          amount: order.total,
          description: `Pedido confirmado - #${order.id.slice(-8)}`
        }
      })
    } catch (cashError) {
      console.error('Erro ao registrar no caixa (não crítico):', cashError)
    }

    // IMPRESSÃO AUTOMÁTICA ao aceitar (não crítico se falhar)
    try {
      await prisma.cashLog.create({
        data: {
          orderId: order.id,
          type: 'ORDER_PRINTED',
          amount: 0,
          description: `Pedido impresso automaticamente - #${order.id.slice(-8)}`
        }
      })
    } catch (printError) {
      console.error('Erro ao registrar impressão (não crítico):', printError)
    }

    return NextResponse.json({
      success: true,
      message: 'Pedido aceito com sucesso',
      order: updatedOrder
    })
  } catch (error: any) {
    console.error('=== ERRO AO ACEITAR PEDIDO ===')
    console.error('Mensagem:', error?.message)
    console.error('Stack:', error?.stack)
    console.error('Código:', error?.code)
    
    // Retornar erro em vez de lançar para não quebrar o fluxo
    return NextResponse.json(
      { 
        success: false,
        message: 'Erro ao aceitar pedido',
        error: process.env.NODE_ENV === 'development' ? error?.message : undefined
      },
      { status: 500 }
    )
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

    // Criar notificação para o cliente (não crítico se falhar)
    try {
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
    } catch (notifError) {
      console.error('Erro ao criar notificação (não crítico):', notifError)
    }

    // Registrar no log do caixa (usar tipo válido)
    try {
      await prisma.cashLog.create({
        data: {
          orderId: order.id,
          type: 'ORDER', // Usar tipo válido conforme schema
          amount: -order.total,
          description: `Pedido cancelado - #${order.id.slice(-8)}`
        }
      })
    } catch (cashError) {
      console.error('Erro ao registrar no caixa (não crítico):', cashError)
    }

    return NextResponse.json({
      success: true,
      message: 'Pedido rejeitado com sucesso',
      order: updatedOrder
    })
  } catch (error: any) {
    console.error('=== ERRO AO REJEITAR PEDIDO ===')
    console.error('Mensagem:', error?.message)
    console.error('Stack:', error?.stack)
    console.error('Código:', error?.code)
    
    // Retornar erro em vez de lançar para não quebrar o fluxo
    return NextResponse.json(
      { 
        success: false,
        message: 'Erro ao rejeitar pedido',
        error: process.env.NODE_ENV === 'development' ? error?.message : undefined
      },
      { status: 500 }
    )
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

    // Retornar dados formatados para impressão nativa do navegador
    return NextResponse.json({
      message: 'Dados do pedido preparados para impressão',
      orderId: order.id,
      order: {
        id: order.id,
        dateTime: new Date(order.createdAt).toLocaleString('pt-BR'),
        customerName: order.user?.name || '',
        customerPhone: order.user?.phone || undefined,
        items: order.items.map((item: any) => ({
          name: item.combo.name,
          quantity: item.quantity,
          price: parseFloat(item.price.toString())
        })),
        total: parseFloat(order.total.toString()),
        deliveryType: order.deliveryType,
        paymentMethod: order.paymentMethod,
        address: order.address ? {
          street: order.address.street,
          number: order.address.number,
          complement: order.address.complement || undefined,
          neighborhood: order.address.neighborhood,
          city: order.address.city,
          state: order.address.state,
          zipCode: order.address.zipCode
        } : undefined,
        notes: order.notes || undefined
      }
    })
  } catch (error) {
    console.error('Erro ao preparar dados do pedido:', error)
    throw error
  }
}
