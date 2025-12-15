import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // Permitir acesso público (necessário para customização de pizzas)
    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get('type') // TRADICIONAL, ESPECIAL, PREMIUM ou null para todos
    
    console.log('🔍 [API] pizza-flavors chamada com type:', type)
    
    // REMOVER filtro isActive temporariamente para garantir sincronização
    // Buscar TODOS os sabores primeiro para verificar
    const allFlavors = await prisma.pizzaFlavor.findMany({
      orderBy: [
        { type: 'asc' },
        { name: 'asc' }
      ]
    })

    console.log(`📊 [API] Total de sabores no banco (sem filtro): ${allFlavors.length}`)
    
    // Filtrar por isActive e type no código (não no banco)
    let flavors = allFlavors.filter(f => f.isActive !== false) // Considerar null/undefined como ativo
    
    if (type) {
      const upperType = type.toUpperCase()
      flavors = flavors.filter(f => (f.type || '').toUpperCase() === upperType)
      console.log(`🔍 [API] Filtrados ${flavors.length} sabores do tipo ${upperType} (de ${allFlavors.length} total)`)
    }

    console.log(`✅ [API] Retornando ${flavors.length} sabores (tipo: ${type || 'todos'})`)
    
    if (flavors.length > 0) {
      const uniqueTypes = Array.from(new Set(flavors.map(f => f.type)))
      console.log('📋 [API] Tipos encontrados:', uniqueTypes)
      console.log('📊 [API] Distribuição:', {
        TRADICIONAL: flavors.filter(f => f.type === 'TRADICIONAL').length,
        ESPECIAL: flavors.filter(f => f.type === 'ESPECIAL').length,
        PREMIUM: flavors.filter(f => f.type === 'PREMIUM').length
      })
    } else {
      console.warn('⚠️ [API] NENHUM sabor retornado! Verificando banco...')
      console.log('📊 [API] Total no banco (sem filtros):', allFlavors.length)
      console.log('📊 [API] Ativos (isActive !== false):', allFlavors.filter(f => f.isActive !== false).length)
      if (type) {
        console.log(`📊 [API] Do tipo ${type.toUpperCase()}:`, allFlavors.filter(f => (f.type || '').toUpperCase() === type.toUpperCase()).length)
      }
    }

    return NextResponse.json(flavors)
  } catch (error: any) {
    console.error('❌ [API] Erro ao buscar sabores de pizza:', error)
    console.error('❌ [API] Stack:', error.stack)
    // Retornar array vazio em vez de erro
    return NextResponse.json([])
  }
}
