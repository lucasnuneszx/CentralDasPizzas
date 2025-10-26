import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const sizes = await prisma.pizzaSize.findMany({
      where: { isActive: true },
      orderBy: { basePrice: 'asc' }
    })

    return NextResponse.json(sizes)
  } catch (error) {
    console.error('Erro ao buscar tamanhos de pizza:', error)
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
