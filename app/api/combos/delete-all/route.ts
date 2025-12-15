import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser, checkAnyRole } from '@/lib/auth-helper'

/**
 * Rota para excluir TODOS os combos do sistema
 * ATENÇÃO: Esta operação é irreversível!
 */
export async function DELETE(request: NextRequest) {
  try {
    // Verificar autenticação
    const user = await getAuthUser(request)
    
    if (!user) {
      return NextResponse.json(
        { message: 'Não autorizado' },
        { status: 401 }
      )
    }

    if (!(await checkAnyRole(request, ['ADMIN']))) {
      return NextResponse.json(
        { message: 'Apenas administradores podem excluir todos os combos' },
        { status: 403 }
      )
    }

    // Contar combos antes de excluir
    const countBefore = await prisma.combo.count()

    // Excluir todos os combos
    // Nota: OrderItems relacionados serão tratados pelo Prisma
    const result = await prisma.combo.deleteMany({})

    return NextResponse.json({
      success: true,
      message: `Todos os combos foram excluídos com sucesso`,
      deleted: result.count,
      totalBefore: countBefore
    })
  } catch (error: any) {
    console.error('Erro ao excluir todos os combos:', error)
    return NextResponse.json(
      { 
        success: false,
        message: 'Erro ao excluir combos',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}

