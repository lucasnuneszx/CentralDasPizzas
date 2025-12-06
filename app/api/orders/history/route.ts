import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser, checkRole, checkAnyRole } from '@/lib/auth-helper'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    
    if (!user) {
      return NextResponse.json(
        { message: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Verificar se o usuário tem permissão para acessar histórico
    if (!(await checkAnyRole(request, ['ADMIN', 'MANAGER', 'CASHIER']))) {
      return NextResponse.json(
        { message: 'Sem permissão' },
        { status: 403 }
      )
    }

    // Buscar todos os pedidos com informações completas
    const orders = await prisma.order.findMany({
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
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(orders)
  } catch (error) {
    console.error('Erro ao buscar histórico de pedidos:', error)
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
