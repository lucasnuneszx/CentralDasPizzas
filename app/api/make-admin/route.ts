import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    console.log('🔧 Tornando admin@teste.com como ADMINISTRADOR...')

    // Atualizar o usuário para ADMIN
    const updatedUser = await prisma.user.update({
      where: {
        email: 'admin@teste.com'
      },
      data: {
        role: 'ADMIN'
      }
    })

    console.log('✅ Usuário atualizado com sucesso!')

    return NextResponse.json({
      message: '✅ Usuário admin@teste.com agora é ADMINISTRADOR!',
      user: {
        email: updatedUser.email,
        role: updatedUser.role,
        name: updatedUser.name
      }
    })

  } catch (error) {
    console.error('❌ Erro:', error)
    return NextResponse.json({
      message: '❌ Erro ao atualizar usuário',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}
