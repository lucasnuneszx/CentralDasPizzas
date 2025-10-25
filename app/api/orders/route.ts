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
    const session = await getServerSession(authOptions)
    const { items, deliveryType, paymentMethod, addressId, notes, total, customer, address } = await request.json()

    let userId = session?.user?.id

    // Se não estiver logado, criar ou buscar usuário público
    if (!userId) {
      try {
        // Buscar ou criar usuário público
        let publicUser = await prisma.user.findUnique({
          where: { email: 'public@centraldaspizzas.com' }
        })

        if (!publicUser) {
          publicUser = await prisma.user.create({
            data: {
              email: 'public@centraldaspizzas.com',
              name: 'Cliente Público',
              role: 'CLIENT',
              isActive: true
            }
          })
        }

        userId = publicUser.id
      } catch (error) {
        console.error('Erro ao criar/buscar usuário público:', error)
        return NextResponse.json(
          { message: 'Erro interno do servidor' },
          { status: 500 }
        )
      }
    }

    console.log('Dados do pedido recebidos:', {
      userId,
      items,
      deliveryType,
      paymentMethod,
      total,
      notes
    })

    // Criar o pedido
    const order = await prisma.order.create({
      data: {
        userId: userId,
        addressId: deliveryType === 'DELIVERY' ? addressId : null,
        total,
        deliveryType,
        paymentMethod,
        notes: notes || '',
        status: 'PENDING'
      }
    })

    console.log('Pedido criado:', order.id)

    // Criar os itens do pedido
    if (items && items.length > 0) {
      await prisma.orderItem.createMany({
        data: items.map((item: any) => ({
          orderId: order.id,
          comboId: item.comboId,
          quantity: item.quantity,
          price: item.price
        }))
      })
      console.log('Itens do pedido criados:', items.length)
    } else {
      console.error('Nenhum item encontrado no pedido')
      return NextResponse.json(
        { message: 'Nenhum item encontrado no pedido' },
        { status: 400 }
      )
    }

    // Registrar venda no caixa
    try {
      await fetch(`${process.env.NEXTAUTH_URL}/api/cash/sale`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: order.id
        }),
      })
    } catch (error) {
      console.error('Erro ao registrar venda no caixa:', error)
    }

    // Buscar o pedido completo para retornar
    const completeOrder = await prisma.order.findUnique({
      where: { id: order.id },
      include: {
        items: {
          include: {
            combo: true
          }
        },
        address: true
      }
    })

    return NextResponse.json(completeOrder, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar pedido:', error)
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
