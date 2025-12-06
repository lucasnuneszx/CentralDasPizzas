import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser, checkRole, checkAnyRole } from '@/lib/auth-helper'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUser(request)
    
    if (!user) {
      return NextResponse.json(
        { message: 'Não autorizado' },
        { status: 401 }
      )
    }

    const notificationId = params.id

    // Marcar notificação como lida
    const notification = await prisma.notification.update({
      where: {
        id: notificationId,
        userId: user.id // Garantir que só o usuário pode marcar suas notificações
      },
      data: {
        read: true
      }
    })

    return NextResponse.json(notification)
  } catch (error) {
    console.error('Erro ao marcar notificação como lida:', error)
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
