import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser, checkRole, checkAnyRole } from '@/lib/auth-helper'
import { prisma } from '@/lib/prisma'
import { UserRole } from '@/lib/constants'

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    
    if (!user || !(await checkAnyRole(request, ['ADMIN', 'MANAGER', 'CASHIER']))) {
      return NextResponse.json({ message: 'Acesso negado' }, { status: 403 })
    }

    // Estatísticas gerais
    const totalOrders = await prisma.order.count({
      where: {
        ifoodOrderId: { not: null }
      }
    })

    const totalRevenue = await prisma.order.aggregate({
      where: {
        ifoodOrderId: { not: null },
        status: 'DELIVERED'
      },
      _sum: {
        total: true
      }
    })

    const averageOrderValue = totalOrders > 0 ? (totalRevenue._sum.total || 0) / totalOrders : 0

    // Pedidos pendentes
    const pendingOrders = await prisma.order.count({
      where: {
        ifoodOrderId: { not: null },
        status: 'PENDING'
      }
    })

    // Pedidos completados
    const completedOrders = await prisma.order.count({
      where: {
        ifoodOrderId: { not: null },
        status: 'DELIVERED'
      }
    })

    // Estatísticas de hoje
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const todayOrders = await prisma.order.count({
      where: {
        ifoodOrderId: { not: null },
        createdAt: {
          gte: today,
          lt: tomorrow
        }
      }
    })

    const todayRevenue = await prisma.order.aggregate({
      where: {
        ifoodOrderId: { not: null },
        status: 'DELIVERED',
        createdAt: {
          gte: today,
          lt: tomorrow
        }
      },
      _sum: {
        total: true
      }
    })

    const stats = {
      totalOrders,
      totalRevenue: totalRevenue._sum.total || 0,
      averageOrderValue,
      pendingOrders,
      completedOrders,
      todayOrders,
      todayRevenue: todayRevenue._sum.total || 0
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Erro ao buscar estatísticas iFood:', error)
    return NextResponse.json({ message: 'Erro interno do servidor' }, { status: 500 })
  }
}


