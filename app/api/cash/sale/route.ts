import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { orderId, amount } = body

    if (!orderId) {
      return NextResponse.json(
        { message: 'ID do pedido obrigatório' },
        { status: 400 }
      )
    }

    // Buscar o pedido
    const order = await prisma.order.findUnique({
      where: { id: orderId }
    })

    if (!order) {
      return NextResponse.json(
        { message: 'Pedido não encontrado' },
        { status: 404 }
      )
    }

    // Verificar se o caixa está aberto
    const lastCashLog = await prisma.cashLog.findFirst({
      where: {
        type: {
          in: ['OPEN', 'CLOSE']
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Se o caixa não estiver aberto, criar automaticamente um log de abertura
    if (!lastCashLog || lastCashLog.type === 'CLOSE') {
      console.log('Caixa não estava aberto, criando log de abertura automática')
      
      // Criar log de abertura automática
      await prisma.cashLog.create({
        data: {
          type: 'OPEN',
          amount: 0,
          description: 'Abertura automática do caixa'
        }
      })
    }

    // Criar log de venda
    const cashLog = await prisma.cashLog.create({
      data: {
        orderId: order.id,
        type: 'ORDER',
        amount: Number(amount || order.total),
        description: `Venda - Pedido #${order.id.slice(-8)}`
      }
    })

    return NextResponse.json(cashLog, { status: 201 })
  } catch (error) {
    console.error('Erro ao registrar venda no caixa:', error)
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}



