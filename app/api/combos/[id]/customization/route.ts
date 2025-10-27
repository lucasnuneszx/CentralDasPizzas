import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Verificar se o usuário tem permissão para gerenciar combos
    const allowedRoles = ['ADMIN', 'MANAGER']
    if (!allowedRoles.includes(session.user.role as any)) {
      return NextResponse.json(
        { message: 'Sem permissão' },
        { status: 403 }
      )
    }

    const comboId = params.id

    const customizationItems = await prisma.comboCustomizationItem.findMany({
      where: {
        comboId,
        isActive: true
      },
      include: {
        options: {
          where: {
            isActive: true
          },
          orderBy: {
            order: 'asc'
          }
        }
      },
      orderBy: {
        order: 'asc'
      }
    })

    return NextResponse.json(customizationItems)
  } catch (error) {
    console.error('Erro ao buscar itens de personalização:', error)
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Verificar se o usuário tem permissão para gerenciar combos
    const allowedRoles = ['ADMIN', 'MANAGER']
    if (!allowedRoles.includes(session.user.role as any)) {
      return NextResponse.json(
        { message: 'Sem permissão' },
        { status: 403 }
      )
    }

    const comboId = params.id
    const { 
      name, 
      description, 
      type, 
      isRequired, 
      isMultiple, 
      maxSelections, 
      minSelections, 
      order, 
      image 
    } = await request.json()

    // Validar campos obrigatórios
    if (!name || !type) {
      return NextResponse.json(
        { message: 'Nome e tipo são obrigatórios' },
        { status: 400 }
      )
    }

    // Verificar se já existe item com o mesmo nome para este combo
    const existingItem = await prisma.comboCustomizationItem.findFirst({
      where: { 
        comboId,
        name
      }
    })

    if (existingItem) {
      return NextResponse.json(
        { message: 'Já existe um item com este nome para este combo' },
        { status: 400 }
      )
    }

    // Criar item de personalização
    const customizationItem = await prisma.comboCustomizationItem.create({
      data: {
        comboId,
        name,
        description: description || '',
        type,
        isRequired: isRequired || false,
        isMultiple: isMultiple || false,
        maxSelections: maxSelections || null,
        minSelections: minSelections || 1,
        order: order || 0,
        image: image || null
      },
      include: {
        options: true
      }
    })

    return NextResponse.json(customizationItem, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar item de personalização:', error)
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
