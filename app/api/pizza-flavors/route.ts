import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const flavors = await prisma.pizzaFlavor.findMany({
      where: { isActive: true },
      orderBy: [
        { type: 'asc' },
        { name: 'asc' }
      ]
    })

    return NextResponse.json(flavors)
  } catch (error) {
    console.error('Erro ao buscar sabores de pizza:', error)
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
