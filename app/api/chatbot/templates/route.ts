import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { prisma } from '@/lib/prisma'
import { UserRole } from '@/lib/constants'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Não autorizado' },
        { status: 401 }
      )
    }

    const templates = await prisma.chatbotTemplate.findMany({
      orderBy: {
        order: 'asc'
      }
    })

    return NextResponse.json(templates)
  } catch (error) {
    console.error('Erro ao buscar templates:', error)
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || ![UserRole.ADMIN, UserRole.MANAGER].includes(session.user.role as any)) {
      return NextResponse.json(
        { message: 'Acesso negado' },
        { status: 403 }
      )
    }

    const { name, trigger, message, isActive, order } = await request.json()

    if (!name || !trigger || !message) {
      return NextResponse.json(
        { message: 'Dados obrigatórios ausentes' },
        { status: 400 }
      )
    }

    // Verificar se já existe template com este trigger
    const existing = await prisma.chatbotTemplate.findUnique({
      where: { trigger }
    })

    if (existing) {
      return NextResponse.json(
        { message: 'Já existe um template com este trigger' },
        { status: 400 }
      )
    }

    const template = await prisma.chatbotTemplate.create({
      data: {
        name,
        trigger,
        message,
        isActive: isActive ?? true,
        order: order ?? 0
      }
    })

    return NextResponse.json(template, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar template:', error)
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

