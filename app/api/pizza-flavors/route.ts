import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Permitir acesso público (necessário para customização de pizzas)
    const flavors = await prisma.pizzaFlavor.findMany({
      where: { 
        isActive: true,
        type: 'TRADICIONAL' // Apenas sabores tradicionais para combos
      },
      orderBy: [
        { type: 'asc' },
        { name: 'asc' }
      ]
    })

    return NextResponse.json(flavors)
  } catch (error: any) {
    console.error('Erro ao buscar sabores de pizza:', error)
    // Retornar array vazio em vez de erro
    return NextResponse.json([])
  }
}
