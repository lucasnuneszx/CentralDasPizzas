import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser, checkRole, checkAnyRole } from '@/lib/auth-helper'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    
    if (!user) {
      return NextResponse.json(
        { message: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Verificar se o usuário tem permissão para fechar o caixa
    if (!(await checkAnyRole(request, ['ADMIN', 'MANAGER', 'CASHIER']))) {
      return NextResponse.json(
        { message: 'Sem permissão' },
        { status: 403 }
      )
    }

    const { amount, description } = await request.json()

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

    if (!lastCashLog || lastCashLog.type === 'CLOSE') {
      return NextResponse.json(
        { message: 'Caixa não está aberto' },
        { status: 400 }
      )
    }

    // Criar log de fechamento
    const cashLog = await prisma.cashLog.create({
      data: {
        type: 'CLOSE',
        amount: amount || 0,
        description: description || 'Fechamento do caixa'
      }
    })

    return NextResponse.json(cashLog, { status: 201 })
  } catch (error) {
    console.error('Erro ao fechar caixa:', error)
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}



