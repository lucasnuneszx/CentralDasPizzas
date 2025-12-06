import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser, checkRole, checkAnyRole } from '@/lib/auth-helper'
import { prisma } from '@/lib/prisma'
import { UserRole } from '@/lib/constants'

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    
    if (!user || !(await checkAnyRole(request, ['ADMIN', 'MANAGER', 'CASHIER']))) {
      return NextResponse.json({ message: 'Acesso negado' }, { status: 403 })
    }

    const { date } = await request.json()
    const targetDate = date ? new Date(date) : new Date()
    
    // Definir início e fim do dia
    const startOfDay = new Date(targetDate)
    startOfDay.setHours(0, 0, 0, 0)
    
    const endOfDay = new Date(targetDate)
    endOfDay.setHours(23, 59, 59, 999)

    // Verificar se já existe fechamento para este dia
    const existingClose = await prisma.cashLog.findFirst({
      where: {
        type: 'CLOSE',
        createdAt: {
          gte: startOfDay,
          lte: endOfDay
        }
      }
    })

    if (existingClose) {
      return NextResponse.json({ 
        message: 'Caixa já foi fechado para este dia',
        alreadyClosed: true 
      })
    }

    // Buscar todas as vendas do dia
    const dailySales = await prisma.cashLog.findMany({
      where: {
        type: 'ORDER',
        createdAt: {
          gte: startOfDay,
          lte: endOfDay
        }
      },
      include: {
        order: {
          include: {
            user: true,
            items: {
              include: {
                combo: true
              }
            }
          }
        }
      }
    })

    // Calcular totais
    const totalSales = dailySales.reduce((sum, sale) => sum + sale.amount, 0)
    const totalOrders = dailySales.length

    // Buscar abertura do caixa
    const cashOpen = await prisma.cashLog.findFirst({
      where: {
        type: 'OPEN',
        createdAt: {
          gte: startOfDay,
          lte: endOfDay
        }
      }
    })

    const openingAmount = cashOpen?.amount || 0

    // Calcular rendimento
    const revenue = totalSales - openingAmount

    // Criar fechamento do caixa
    const cashClose = await prisma.cashLog.create({
      data: {
        type: 'CLOSE',
        amount: totalSales,
        description: `Fechamento automático - ${targetDate.toLocaleDateString('pt-BR')}`
      }
    })

    // Gerar relatório detalhado
    const report = {
      date: targetDate.toISOString().split('T')[0],
      openingAmount,
      totalSales,
      totalOrders,
      revenue,
      closingAmount: totalSales,
      salesByPaymentMethod: await getSalesByPaymentMethod(dailySales),
      topCombos: await getTopCombos(dailySales),
      hourlySales: await getHourlySales(dailySales)
    }

    return NextResponse.json({
      message: 'Caixa fechado automaticamente com sucesso',
      report,
      cashClose
    })

  } catch (error) {
    console.error('Erro no fechamento automático:', error)
    return NextResponse.json({ message: 'Erro interno do servidor' }, { status: 500 })
  }
}

async function getSalesByPaymentMethod(sales: any[]) {
  const paymentMethods: { [key: string]: { count: number; total: number } } = {}
  
  for (const sale of sales) {
    if (sale.order?.paymentMethod) {
      const method = sale.order.paymentMethod
      if (!paymentMethods[method]) {
        paymentMethods[method] = { count: 0, total: 0 }
      }
      paymentMethods[method].count++
      paymentMethods[method].total += sale.amount
    }
  }
  
  return Object.entries(paymentMethods).map(([method, data]) => ({
    method,
    count: data.count,
    total: data.total
  }))
}

async function getTopCombos(sales: any[]) {
  const comboCounts: { [key: string]: { name: string; quantity: number; revenue: number } } = {}
  
  for (const sale of sales) {
    if (sale.order?.items) {
      for (const item of sale.order.items) {
        const comboName = item.combo?.name || 'Produto não identificado'
        if (!comboCounts[comboName]) {
          comboCounts[comboName] = { name: comboName, quantity: 0, revenue: 0 }
        }
        comboCounts[comboName].quantity += item.quantity
        comboCounts[comboName].revenue += item.price * item.quantity
      }
    }
  }
  
  return Object.values(comboCounts)
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 10)
}

async function getHourlySales(sales: any[]) {
  const hourlyData: { [key: number]: { count: number; total: number } } = {}
  
  for (const sale of sales) {
    const hour = sale.createdAt.getHours()
    if (!hourlyData[hour]) {
      hourlyData[hour] = { count: 0, total: 0 }
    }
    hourlyData[hour].count++
    hourlyData[hour].total += sale.amount
  }
  
  return Object.entries(hourlyData).map(([hour, data]) => ({
    hour: parseInt(hour),
    count: data.count,
    total: data.total
  }))
}


