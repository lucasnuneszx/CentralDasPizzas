import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { prisma } from '@/lib/prisma'

export async function PUT(
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

    // Verificar se o usuário tem permissão para gerenciar motoboys
    const allowedRoles = ['ADMIN', 'MANAGER', 'CASHIER']
    if (!allowedRoles.includes(session.user.role as any)) {
      return NextResponse.json(
        { message: 'Sem permissão' },
        { status: 403 }
      )
    }

    const personId = params.id
    const { status } = await request.json()

    // Validar status
    const validStatuses = ['OFFLINE', 'ONLINE', 'DELIVERING', 'UNAVAILABLE', 'OUT_OF_ROTE']
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { message: 'Status inválido' },
        { status: 400 }
      )
    }

    // Atualizar status do motoboy
    const updatedPerson = await prisma.deliveryPerson.update({
      where: { id: personId },
      data: { status }
    })

    return NextResponse.json({
      message: 'Status atualizado com sucesso',
      person: updatedPerson
    })
  } catch (error) {
    console.error('Erro ao atualizar status do motoboy:', error)
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
