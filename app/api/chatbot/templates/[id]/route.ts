import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, hasAnyRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { UserRole } from '@/lib/constants'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthenticatedUser()
    
    if (!user || !(await hasAnyRole(['ADMIN', 'MANAGER']))) {
      return NextResponse.json(
        { message: 'Acesso negado' },
        { status: 403 }
      )
    }

    const { name, trigger, message, isActive, order } = await request.json()

    const template = await prisma.chatbotTemplate.update({
      where: { id: params.id },
      data: {
        name,
        trigger,
        message,
        isActive,
        order
      }
    })

    return NextResponse.json(template)
  } catch (error) {
    console.error('Erro ao atualizar template:', error)
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthenticatedUser()
    
    if (!user || !(await hasAnyRole(['ADMIN', 'MANAGER']))) {
      return NextResponse.json(
        { message: 'Acesso negado' },
        { status: 403 }
      )
    }

    await prisma.chatbotTemplate.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Template excluído com sucesso' })
  } catch (error) {
    console.error('Erro ao excluir template:', error)
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

