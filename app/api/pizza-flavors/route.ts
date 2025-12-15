import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // Permitir acesso público (necessário para customização de pizzas)
    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get('type') // TRADICIONAL, ESPECIAL, PREMIUM ou null para todos
    
    console.log('🔍 API pizza-flavors chamada com type:', type)
    
    const whereClause: any = { isActive: true }
    if (type) {
      // Garantir que o tipo seja uppercase para comparação
      whereClause.type = type.toUpperCase()
    }

    const flavors = await prisma.pizzaFlavor.findMany({
      where: whereClause,
      orderBy: [
        { type: 'asc' },
        { name: 'asc' }
      ]
    })

    console.log(`✅ Retornando ${flavors.length} sabores (tipo: ${type || 'todos'})`)
    if (flavors.length > 0) {
      console.log('📋 Tipos encontrados:', [...new Set(flavors.map(f => f.type))])
    }

    return NextResponse.json(flavors)
  } catch (error: any) {
    console.error('❌ Erro ao buscar sabores de pizza:', error)
    // Retornar array vazio em vez de erro
    return NextResponse.json([])
  }
}
