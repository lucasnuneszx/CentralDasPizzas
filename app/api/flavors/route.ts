import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Permitir acesso público para sabores tradicionais (necessário para customização)
    const flavors = await prisma.pizzaFlavor.findMany({
      where: {
        isActive: true,
        type: 'TRADICIONAL'
      },
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
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Verificar se o usuário tem permissão para gerenciar sabores
    const allowedRoles = ['ADMIN', 'MANAGER']
    if (!allowedRoles.includes(session.user.role as any)) {
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
