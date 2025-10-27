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

    const pizzaSizes = await prisma.pizzaSize.findMany({
      where: {
        isActive: true
      },
      orderBy: {
        basePrice: 'asc'
      }
    })

    return NextResponse.json(pizzaSizes)
  } catch (error) {
    console.error('Erro ao buscar tamanhos de pizza:', error)
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}