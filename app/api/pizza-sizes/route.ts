import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // Permitir acesso público (necessário para customização)
    const { searchParams } = new URL(request.url)
    const comboId = searchParams.get('comboId')

    const whereClause: any = {
      isActive: true
    }

    if (comboId) {
      whereClause.comboId = comboId
    }

    const pizzaSizes = await prisma.pizzaSize.findMany({
      where: whereClause,
      orderBy: {
        basePrice: 'asc'
      }
    })

    return NextResponse.json(pizzaSizes)
  } catch (error: any) {
    console.error('Erro ao buscar tamanhos de pizza:', error)
    // Retornar array vazio em vez de erro
    return NextResponse.json([])
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Não autorizado' },
        { status: 401 }
      )
    }

    const { comboId, sizes } = await request.json()

    if (!comboId || !sizes || !Array.isArray(sizes)) {
      return NextResponse.json(
        { message: 'Dados inválidos' },
        { status: 400 }
      )
    }

    // Verificar se o combo existe
    const combo = await prisma.combo.findUnique({
      where: { id: comboId }
    })

    if (!combo) {
      return NextResponse.json(
        { message: 'Combo não encontrado' },
        { status: 404 }
      )
    }

    // Remover tamanhos existentes para este combo
    await prisma.pizzaSize.deleteMany({
      where: { comboId }
    })

    // Criar novos tamanhos
    const createdSizes = await prisma.pizzaSize.createMany({
      data: sizes.map((size: any) => ({
        comboId,
        name: size.name,
        slices: size.slices,
        maxFlavors: size.maxFlavors,
        basePrice: size.basePrice,
        isActive: true
      }))
    })

    return NextResponse.json({ 
      message: 'Tamanhos criados com sucesso',
      count: createdSizes.count 
    })
  } catch (error) {
    console.error('Erro ao criar tamanhos de pizza:', error)
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}