import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
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

    const orderId = params.id
    const { deliveryPerson, status } = await request.json()

    // Atualizar o pedido
    const updateData: any = {}
    
    if (deliveryPerson !== undefined) {
      updateData.deliveryPerson = deliveryPerson
    }
    
    // Atualizar status para qualquer valor, não apenas DELIVERED
    if (status !== undefined) {
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

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: updateData,
      include: {
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
          include: {
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

    // Registrar no log do caixa
    if (status === 'DELIVERED') {
      await prisma.cashLog.create({
        data: {
          orderId: orderId,
          type: 'ORDER_DELIVERED',
          amount: 0,
          description: `Pedido entregue - #${orderId.slice(-8)}${deliveryPerson ? ` - Motoboy: ${deliveryPerson}` : ''}`
        }
      })
    }

    return NextResponse.json({
      message: 'Pedido atualizado com sucesso',
      order: updatedOrder
    })
  } catch (error) {
    console.error('Erro ao atualizar pedido:', error)
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
