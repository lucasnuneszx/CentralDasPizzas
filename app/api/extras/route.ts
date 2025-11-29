import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Permitir acesso público (necessário para customização de combos)
    const extras = await prisma.extraItem.findMany({
      where: {
        isActive: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(extras)
  } catch (error: any) {
    console.error('Erro ao buscar extras:', error)
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

    // Verificar se o usuário tem permissão para gerenciar extras
    const allowedRoles = ['ADMIN', 'MANAGER']
    if (!allowedRoles.includes(session.user.role as any)) {
      return NextResponse.json(
        { message: 'Sem permissão' },
        { status: 403 }
      )
    }

    const { name, description, price, category, size } = await request.json()

    // Validar campos obrigatórios
    if (!name || !category || !price) {
      return NextResponse.json(
        { message: 'Nome, categoria e preço são obrigatórios' },
        { status: 400 }
      )
    }

    if (price <= 0) {
      return NextResponse.json(
        { message: 'Preço deve ser maior que zero' },
        { status: 400 }
      )
    }

    // Verificar se já existe item com o mesmo nome
    const existingExtra = await prisma.extraItem.findFirst({
      where: { name }
    })

    if (existingExtra) {
      return NextResponse.json(
        { message: 'Já existe um item com este nome' },
        { status: 400 }
      )
    }

    // Criar item extra
    const extra = await prisma.extraItem.create({
      data: {
        name,
        description: description || '',
        price,
        category,
        size: size || null
      }
    })

    return NextResponse.json(extra, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar item extra:', error)
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
