import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, hasAnyRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser()
    
    if (!user) {
      return NextResponse.json(
        { message: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Verificar se o usuário tem permissão para abrir o caixa
    if (!(await hasAnyRole(['ADMIN', 'MANAGER', 'CASHIER']))) {
      return NextResponse.json(
        { message: 'Sem permissão' },
        { status: 403 }
      )
    }

    const { amount, description } = await request.json()

    // Verificar se o caixa já está aberto
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

    if (lastCashLog?.type === 'OPEN') {
      return NextResponse.json(
        { message: 'Caixa já está aberto' },
        { status: 400 }
      )
    }

    // Criar log de abertura
    const cashLog = await prisma.cashLog.create({
      data: {
        type: 'OPEN',
        amount: amount || 0,
        description: description || 'Abertura do caixa'
      }
    })

    return NextResponse.json(cashLog, { status: 201 })
  } catch (error) {
    console.error('Erro ao abrir caixa:', error)
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}



