import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const user = await getAuthenticatedUser()
    
    if (!user) {
      return NextResponse.json(
        { message: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Buscar notificações não lidas primeiro, depois as lidas
    const notifications = await prisma.notification.findMany({
      where: {
        userId: user.id
      },
      orderBy: [
        { read: 'asc' },
        { createdAt: 'desc' }
      ],
      take: 50 // Limitar a 50 notificações
    })

    return NextResponse.json(notifications)
  } catch (error) {
    console.error('Erro ao buscar notificações:', error)
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser()
    
    if (!user) {
      return NextResponse.json(
        { message: 'Não autorizado' },
        { status: 401 }
      )
    }

    const { type, source, title, message, orderId, logo } = await request.json()

    // Criar notificação
    const notification = await prisma.notification.create({
      data: {
        userId: user.id,
        type,
        source,
        title,
        message,
        orderId,
        logo,
        read: false
      }
    })

    return NextResponse.json(notification)
  } catch (error) {
    console.error('Erro ao criar notificação:', error)
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
