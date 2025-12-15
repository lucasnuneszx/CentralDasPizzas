import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser, checkRole, checkAnyRole } from '@/lib/auth-helper'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // Permitir acesso público (necessário para customização)
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
    console.error('Erro ao buscar sabores:', error)
    // Retornar array vazio em vez de erro
    return NextResponse.json([])
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    
    if (!user) {
      return NextResponse.json(
        { message: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Verificar se o usuário tem permissão para gerenciar sabores
    if (!(await checkAnyRole(request, ['ADMIN', 'MANAGER']))) {
      return NextResponse.json(
        { message: 'Sem permissão' },
        { status: 403 }
      )
    }

    const { name, description, type } = await request.json()

    // Validar campos obrigatórios
    if (!name || !type) {
      return NextResponse.json(
        { message: 'Nome e tipo são obrigatórios' },
        { status: 400 }
      )
    }

    // Verificar se já existe sabor com o mesmo nome
    const existingFlavor = await prisma.pizzaFlavor.findFirst({
      where: { name }
    })

    if (existingFlavor) {
      return NextResponse.json(
        { message: 'Já existe um sabor com este nome' },
        { status: 400 }
      )
    }

    // Criar sabor
    const flavor = await prisma.pizzaFlavor.create({
      data: {
        name,
        description: description || '',
        type
      }
    })

    return NextResponse.json(flavor, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar sabor:', error)
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
