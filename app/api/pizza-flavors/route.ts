import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // Permitir acesso público (necessário para customização de pizzas)
    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get('type') // TRADICIONAL, ESPECIAL, PREMIUM ou null para todos
    
    const whereClause: any = { isActive: true }
    if (type) {
      whereClause.type = type
    }

    const flavors = await prisma.pizzaFlavor.findMany({
      where: whereClause,
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
