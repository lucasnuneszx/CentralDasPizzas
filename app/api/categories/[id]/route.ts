import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser, checkAnyRole } from '@/lib/auth-helper'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar autenticação
    const user = await getAuthUser(request)
    
    if (!user) {
      return NextResponse.json(
        { message: 'Não autorizado' },
        { status: 401 }
      )
    }

    if (!(await checkAnyRole(request, ['ADMIN', 'MANAGER']))) {
      return NextResponse.json(
        { message: 'Sem permissão' },
        { status: 403 }
      )
    }

    const { name, description, image, isActive, order } = await request.json()

    // Verificar se a categoria existe
    const existingCategory = await prisma.category.findUnique({
      where: { id: params.id }
    })

    if (!existingCategory) {
      return NextResponse.json(
        { message: 'Categoria não encontrada' },
        { status: 404 }
      )
    }

    const category = await prisma.category.update({
      where: { id: params.id },
      data: {
        name,
        description,
        image,
        isActive,
        order: order || 0
      }
    })

    return NextResponse.json(category)
  } catch (error: any) {
    console.error('Erro ao atualizar categoria:', error)
    
    // Tratamento específico de erros
    if (error.code === 'P2025') {
      return NextResponse.json(
        { message: 'Categoria não encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { 
        message: 'Erro ao atualizar categoria',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar autenticação
    const user = await getAuthUser(request)
    
    if (!user) {
      return NextResponse.json(
        { message: 'Não autorizado' },
        { status: 401 }
      )
    }

    if (!(await checkAnyRole(request, ['ADMIN', 'MANAGER']))) {
      return NextResponse.json(
        { message: 'Sem permissão' },
        { status: 403 }
      )
    }

    const categoryId = params.id

    // Verificar se a categoria existe
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      include: {
        combos: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    if (!category) {
      return NextResponse.json(
        { message: 'Categoria não encontrada' },
        { status: 404 }
      )
    }

    // Buscar ou criar categoria "Combos" para mover os combos
    let combosCategory = await prisma.category.findFirst({
      where: { name: 'Combos' }
    })

    if (!combosCategory) {
      // Criar categoria "Combos" se não existir
      combosCategory = await prisma.category.create({
        data: {
          name: 'Combos',
          description: 'Combos diversos',
          isActive: true,
          order: 999
        }
      })
    }

    // Usar transação para garantir que tudo seja feito atomicamente
    await prisma.$transaction(async (tx) => {
      // Mover todos os combos desta categoria para "Combos"
      if (category.combos.length > 0) {
        const updateResult = await tx.combo.updateMany({
          where: { categoryId: categoryId },
          data: { categoryId: combosCategory.id }
        })
        console.log(`✅ ${updateResult.count} produto(s) movido(s) para categoria "Combos"`)
      }

      // Verificar se ainda há combos na categoria (pode ter havido algum problema)
      const remainingCombos = await tx.combo.count({
        where: { categoryId: categoryId }
      })

      if (remainingCombos > 0) {
        throw new Error(`Ainda há ${remainingCombos} produto(s) nesta categoria. Não foi possível mover todos os produtos.`)
      }

      // Excluir a categoria
      await tx.category.delete({
        where: { id: categoryId }
      })
    })

    return NextResponse.json({ 
      message: 'Categoria excluída com sucesso',
      movedCombos: category.combos.length
    })
  } catch (error: any) {
    console.error('Erro ao excluir categoria:', error)
    
    // Tratamento específico de erros
    if (error.code === 'P2025') {
      return NextResponse.json(
        { message: 'Categoria não encontrada' },
        { status: 404 }
      )
    }

    if (error.code === 'P2003') {
      return NextResponse.json(
        { message: 'Não é possível excluir categoria com itens relacionados' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { 
        message: 'Erro ao excluir categoria',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}
