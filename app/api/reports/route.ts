import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, hasAnyRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { UserRole } from '@/lib/constants'

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser()
    
    if (!user || !(await hasAnyRole(['ADMIN', 'MANAGER']))) {
      return NextResponse.json({ message: 'Acesso negado' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('start') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const endDate = searchParams.get('end') || new Date().toISOString()

    // Vendas totais
    const totalSales = await prisma.order.aggregate({
      where: {
        status: 'DELIVERED',
        createdAt: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      },
      _sum: {
        total: true
      }
    })

    // Total de pedidos
    const totalOrders = await prisma.order.count({
      where: {
        status: 'DELIVERED',
        createdAt: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      }
    })

    // Total de clientes únicos
    const totalCustomers = await prisma.user.count({
      where: {
        role: 'CLIENT',
        createdAt: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      }
    })

    // Ticket médio
    const averageOrderValue = totalOrders > 0 ? (totalSales._sum.total || 0) / totalOrders : 0

    // Vendas por dia
    const salesByDay = await prisma.order.groupBy({
      by: ['createdAt'],
      where: {
        status: 'DELIVERED',
        createdAt: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      },
      _sum: {
        total: true
      },
      _count: {
        id: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    // Top combos
    const topCombos = await prisma.orderItem.groupBy({
      by: ['comboId'],
      where: {
        order: {
          status: 'DELIVERED',
          createdAt: {
            gte: new Date(startDate),
            lte: new Date(endDate)
          }
        }
      },
      _sum: {
        quantity: true,
        price: true
      },
      _count: {
        id: true
      },
      orderBy: {
        _sum: {
          quantity: 'desc'
        }
      },
      take: 5
    })

    // Buscar nomes dos combos
    const comboIds = topCombos.map(item => item.comboId)
    const combos = await prisma.combo.findMany({
      where: {
        id: { in: comboIds }
      },
      select: {
        id: true,
        name: true
      }
    })

    const topCombosWithNames = topCombos.map(item => {
      const combo = combos.find(c => c.id === item.comboId)
      return {
        id: item.comboId,
        name: combo?.name || 'Combo não encontrado',
        quantity: item._sum.quantity || 0,
        revenue: (item._sum.price || 0) * (item._sum.quantity || 0)
      }
    })

    // Vendas por método de pagamento
    const salesByPaymentMethod = await prisma.order.groupBy({
      by: ['paymentMethod'],
      where: {
        status: 'DELIVERED',
        createdAt: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      },
      _sum: {
        total: true
      },
      _count: {
        id: true
      }
    })

    const reportData = {
      totalSales: totalSales._sum.total || 0,
      totalOrders,
      totalCustomers,
      averageOrderValue,
      salesByDay: salesByDay.map(day => ({
        date: day.createdAt.toISOString().split('T')[0],
        sales: day._sum.total || 0,
        orders: day._count.id
      })),
      topCombos: topCombosWithNames,
      salesByPaymentMethod: salesByPaymentMethod.map(method => ({
        method: method.paymentMethod,
        count: method._count.id,
        total: method._sum.total || 0
      }))
    }

    return NextResponse.json(reportData)
  } catch (error) {
    console.error('Erro ao gerar relatório:', error)
    return NextResponse.json({ message: 'Erro interno do servidor' }, { status: 500 })
  }
}


