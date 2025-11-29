import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
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
    const body = await request.json()
    const { deliveryPerson, status } = body

    console.log('=== ATUALIZANDO PEDIDO ===')
    console.log('Order ID:', orderId)
    console.log('Body recebido:', body)
    console.log('Status:', status)
    console.log('Delivery Person:', deliveryPerson)

    // Validar que há algo para atualizar
    if (status === undefined && deliveryPerson === undefined) {
      return NextResponse.json(
        { message: 'Nenhum dado fornecido para atualização' },
        { status: 400 }
      )
    }

    // Atualizar o pedido
    const updateData: any = {}
    
    if (deliveryPerson !== undefined && deliveryPerson !== null) {
      updateData.deliveryPerson = deliveryPerson
    }
    
    // Atualizar status para qualquer valor, não apenas DELIVERED
    if (status !== undefined && status !== null && status !== '') {
      updateData.status = status
      
      // Adicionar timestamps específicos baseados no status
      if (status === 'CONFIRMED') {
        updateData.confirmedAt = new Date()
        updateData.confirmedBy = session.user.id
      } else if (status === 'DELIVERED') {
        updateData.deliveredAt = new Date()
        updateData.deliveredBy = session.user.id
      } else if (status === 'CANCELLED') {
        updateData.cancelledAt = new Date()
        updateData.cancelledBy = session.user.id
      }
    }

    console.log('Dados para atualizar:', updateData)

    // Se não há nada para atualizar, retornar erro
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { message: 'Nenhum dado válido para atualização' },
        { status: 400 }
      )
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: updateData,
      select: {
        id: true,
        status: true,
        total: true,
        paymentMethod: true,
        deliveryType: true,
        createdAt: true,
        updatedAt: true,
        userId: true,
        addressId: true,
        deliveryPerson: true,
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true
          }
        },
        address: true,
        items: {
          select: {
            id: true,
            quantity: true,
            price: true,
            combo: {
              select: {
                id: true,
                name: true,
                description: true,
                image: true
              }
            }
          }
        }
      }
    })

    // Registrar no log do caixa (usar tipo válido)
    if (status === 'DELIVERED') {
      try {
        await prisma.cashLog.create({
          data: {
            orderId: orderId,
            type: 'ORDER', // Usar tipo válido conforme schema
            amount: 0,
            description: `Pedido entregue - #${orderId.slice(-8)}${deliveryPerson ? ` - Motoboy: ${deliveryPerson}` : ''}`
          }
        })
      } catch (cashError) {
        console.error('Erro ao registrar no caixa (não crítico):', cashError)
        // Não bloquear se falhar
      }
    }

    return NextResponse.json({
      message: 'Pedido atualizado com sucesso',
      order: updatedOrder
    })
  } catch (error: any) {
    console.error('=== ERRO AO ATUALIZAR PEDIDO ===')
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
