import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, hasAnyRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const user = await getAuthenticatedUser()
    
    if (!user) {
      return NextResponse.json(
        { message: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Verificar se o usuário tem permissão para acessar o caixa
    if (!(await hasAnyRole(['ADMIN', 'MANAGER', 'CASHIER']))) {
      return NextResponse.json(
        { message: 'Sem permissão' },
        { status: 403 }
      )
    }

    // Buscar o último log de abertura/fechamento
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

    const isOpen = lastCashLog?.type === 'OPEN'

    // Se o caixa estiver aberto, calcular vendas do dia
    let summary = {
      totalSales: 0,
      totalOrders: 0,
      cashSales: 0,
      cardSales: 0,
      pixSales: 0,
      ifoodSales: 0,
      isOpen,
      openTime: null as string | null,
      closeTime: null as string | null
    }

    if (isOpen && lastCashLog) {
      summary.openTime = lastCashLog.createdAt.toISOString()

      // Buscar vendas desde a última abertura
      const orders = await prisma.order.findMany({
        where: {
          createdAt: {
            gte: lastCashLog.createdAt
          },
          status: {
            not: 'CANCELLED'
          }
        },
        include: {
          items: true
        }
      })

      summary.totalOrders = orders.length
      summary.totalSales = orders.reduce((total, order) => total + Number(order.total), 0)

      // Calcular vendas por método de pagamento
      orders.forEach(order => {
        switch (order.paymentMethod) {
          case 'CASH':
            summary.cashSales += Number(order.total)
            break
          case 'CREDIT_CARD':
          case 'DEBIT_CARD':
            summary.cardSales += Number(order.total)
            break
          case 'PIX':
            summary.pixSales += Number(order.total)
            break
          case 'IFOOD':
            summary.ifoodSales += Number(order.total)
            break
        }
      })
    } else if (lastCashLog?.type === 'CLOSE') {
      summary.closeTime = lastCashLog.createdAt.toISOString()
    }

    return NextResponse.json(summary)
  } catch (error) {
    console.error('Erro ao buscar resumo do caixa:', error)
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}



