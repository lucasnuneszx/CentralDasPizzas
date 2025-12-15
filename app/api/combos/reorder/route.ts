import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser, checkAnyRole } from '@/lib/auth-helper'

/**
 * Rota para reordenar combos
 * Recebe um array de { id, order } e atualiza a ordem de todos
 */
export async function PUT(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    
    if (!user) {
      return NextResponse.json(
        { message: 'Não autorizado' },
        { status: 401 }
      )
    }

    if (!(await checkAnyRole(request, ['ADMIN', 'MANAGER']))) {
      return NextResponse.json(
        { message: 'Apenas administradores e gerentes podem reordenar combos' },
        { status: 403 }
      )
    }

    const { combos } = await request.json()

    if (!Array.isArray(combos)) {
      return NextResponse.json(
        { message: 'Formato inválido. Esperado array de combos' },
        { status: 400 }
      )
    }

    // Atualizar ordem de todos os combos em uma transação
    const updates = combos.map((combo: { id: string; order: number }) =>
      prisma.combo.update({
        where: { id: combo.id },
        data: { order: combo.order }
      })
    )

    await prisma.$transaction(updates)

    return NextResponse.json({
      success: true,
      message: 'Ordem dos combos atualizada com sucesso!'
    })
  } catch (error: any) {
    console.error('Erro ao reordenar combos:', error)
    return NextResponse.json(
      { 
        success: false,
        message: 'Erro ao reordenar combos',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}

