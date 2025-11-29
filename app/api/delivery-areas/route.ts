import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'

export async function GET() {
  try {
    // Permitir acesso público para áreas de entrega (necessário para checkout)
    const areas = await prisma.deliveryArea.findMany({
      where: {
        isActive: true
      },
      orderBy: [
        { city: 'asc' },
        { name: 'asc' }
      ]
    })

    return NextResponse.json(areas)
  } catch (error: any) {
    console.error('Erro ao buscar áreas de entrega:', error)
    // Retornar array vazio em vez de erro
    return NextResponse.json([])
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ message: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { name, city, state, zipCode, deliveryFee } = body

    // Validar dados obrigatórios
    if (!name || !city || !state || deliveryFee === undefined) {
      return NextResponse.json(
        { message: 'Nome, cidade, estado e taxa de entrega são obrigatórios' },
        { status: 400 }
      )
    }

    // Verificar se já existe uma área com o mesmo nome na mesma cidade
    const existingArea = await prisma.deliveryArea.findUnique({
      where: {
        name_city_state: {
          name,
          city,
          state
        }
      }
    })

    if (existingArea) {
      return NextResponse.json(
        { message: 'Já existe uma área com este nome nesta cidade' },
        { status: 400 }
      )
    }

    const area = await prisma.deliveryArea.create({
      data: {
        name,
        city,
        state,
        zipCode: zipCode || null,
        deliveryFee: parseFloat(deliveryFee.toString())
      }
    })

    return NextResponse.json(area, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar área de entrega:', error)
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
