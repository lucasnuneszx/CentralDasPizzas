import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, hasAnyRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Permitir acesso público para clientes visualizarem itens extras
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

    // Transformar para incluir preço do item (se não tiver opções)
    const itemsWithPrice = customizationItems.map(item => ({
      ...item,
      price: item.options && item.options.length > 0 ? 0 : 0, // Preço será das opções ou 0
      // Se não tiver opções, o preço pode vir de um campo adicional ou ser 0
    }))

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
    const user = await getAuthenticatedUser()
    
    if (!user) {
      return NextResponse.json(
        { message: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Verificar se o usuário tem permissão para gerenciar combos
    if (!(await hasAnyRole(['ADMIN', 'MANAGER']))) {
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
