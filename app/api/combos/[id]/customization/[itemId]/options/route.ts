import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser, checkRole, checkAnyRole } from '@/lib/auth-helper'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; itemId: string } }
) {
  try {
    const user = await getAuthUser(request)
    
    if (!user) {
      return NextResponse.json(
        { message: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Verificar se o usuário tem permissão para gerenciar combos
    if (!(await checkAnyRole(request, ['ADMIN', 'MANAGER']))) {
      return NextResponse.json(
        { message: 'Sem permissão' },
        { status: 403 }
      )
    }

    const { itemId } = params
    const { name, description, price, image, order } = await request.json()

    // Validar campos obrigatórios
    if (!name) {
      return NextResponse.json(
        { message: 'Nome da opção é obrigatório' },
        { status: 400 }
      )
    }

    // Verificar se já existe opção com o mesmo nome para este item
    const existingOption = await prisma.comboCustomizationOption.findFirst({
      where: { 
        itemId,
        name
      }
    })

    if (existingOption) {
      return NextResponse.json(
        { message: 'Já existe uma opção com este nome para este item' },
        { status: 400 }
      )
    }

    // Criar opção
    const option = await prisma.comboCustomizationOption.create({
      data: {
        itemId,
        name,
        description: description || '',
        price: price || 0,
        image: image || null,
        order: order || 0
      }
    })

    return NextResponse.json(option, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar opção:', error)
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; itemId: string; optionId: string } }
) {
  try {
    const user = await getAuthUser(request)
    
    if (!user) {
      return NextResponse.json(
        { message: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Verificar se o usuário tem permissão para gerenciar combos
    if (!(await checkAnyRole(request, ['ADMIN', 'MANAGER']))) {
      return NextResponse.json(
        { message: 'Sem permissão' },
        { status: 403 }
      )
    }

    const { itemId, optionId } = params
    const { name, description, price, image, order } = await request.json()

    // Validar campos obrigatórios
    if (!name) {
      return NextResponse.json(
        { message: 'Nome da opção é obrigatório' },
        { status: 400 }
      )
    }

    // Verificar se já existe outra opção com o mesmo nome para este item
    const existingOption = await prisma.comboCustomizationOption.findFirst({
      where: { 
        itemId,
        name,
        id: { not: optionId }
      }
    })

    if (existingOption) {
      return NextResponse.json(
        { message: 'Já existe outra opção com este nome para este item' },
        { status: 400 }
      )
    }

    // Atualizar opção
    const updatedOption = await prisma.comboCustomizationOption.update({
      where: { id: optionId },
      data: {
        name,
        description: description || '',
        price: price || 0,
        image: image || null,
        order: order || 0
      }
    })

    return NextResponse.json(updatedOption)
  } catch (error) {
    console.error('Erro ao atualizar opção:', error)
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; itemId: string; optionId: string } }
) {
  try {
    const user = await getAuthUser(request)
    
    if (!user) {
      return NextResponse.json(
        { message: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Verificar se o usuário tem permissão para gerenciar combos
    if (!(await checkAnyRole(request, ['ADMIN', 'MANAGER']))) {
      return NextResponse.json(
        { message: 'Sem permissão' },
        { status: 403 }
      )
    }

    const { optionId } = params

    // Excluir opção
    await prisma.comboCustomizationOption.delete({
      where: { id: optionId }
    })

    return NextResponse.json({ message: 'Opção excluída com sucesso' })
  } catch (error) {
    console.error('Erro ao excluir opção:', error)
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
