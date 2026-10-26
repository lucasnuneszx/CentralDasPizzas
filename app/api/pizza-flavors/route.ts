import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // Permitir acesso público (necessário para customização de pizzas)
    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get('type') // TRADICIONAL, ESPECIAL, PREMIUM ou null para todos
    
    
    // REMOVER filtro isActive temporariamente para garantir sincronização
    // Buscar TODOS os sabores primeiro para verificar
    const allFlavors = await prisma.pizzaFlavor.findMany({
      orderBy: [
        { type: 'asc' },
        { name: 'asc' }
      ]
    })

    
    // Filtrar por isActive e type no código (não no banco)
    let flavors = allFlavors.filter(f => f.isActive !== false) // Considerar null/undefined como ativo
    
    if (type) {
      const upperType = type.toUpperCase()
      flavors = flavors.filter(f => (f.type || '').toUpperCase() === upperType)
    }

    
    if (flavors.length === 0) {
      console.warn('Nenhum sabor de pizza retornado')
    }

    return NextResponse.json(flavors)
  } catch (error: any) {
    console.error('[API] Erro ao buscar sabores de pizza:', error)
    console.error('[API] Stack:', error.stack)
    // Retornar array vazio em vez de erro
    return NextResponse.json([])
  }
}
