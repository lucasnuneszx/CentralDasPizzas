import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Verificar se o usuário tem permissão para acessar motoboys
    const allowedRoles = ['ADMIN', 'MANAGER']
    if (!allowedRoles.includes(session.user.role as any)) {
      return NextResponse.json(
        { message: 'Sem permissão' },
        { status: 403 }
      )
    }

    // Buscar todos os motoboys
    const deliveryPersons = await prisma.deliveryPerson.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(deliveryPersons)
  } catch (error) {
    console.error('Erro ao buscar motoboys:', error)
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Verificar se o usuário tem permissão para gerenciar motoboys
    const allowedRoles = ['ADMIN', 'MANAGER']
    if (!allowedRoles.includes(session.user.role as any)) {
      return NextResponse.json(
        { message: 'Sem permissão' },
        { status: 403 }
      )
    }

    const { name, phone, plate, status, isActive } = await request.json()

    // Validar campos obrigatórios
    if (!name || !phone) {
      return NextResponse.json(
        { message: 'Nome e telefone são obrigatórios' },
        { status: 400 }
      )
    }

    // Verificar se já existe um motoboy com o mesmo telefone
    const existingPerson = await prisma.deliveryPerson.findFirst({
      where: { phone }
    })

    if (existingPerson) {
      return NextResponse.json(
        { message: 'Já existe um motoboy cadastrado com este telefone' },
        { status: 400 }
      )
    }

    // Criar motoboy
    const deliveryPerson = await prisma.deliveryPerson.create({
      data: {
        name,
        phone,
        plate: plate || null,
        status: status || 'OFFLINE',
        isActive: isActive !== undefined ? isActive : true
      }
    })

    return NextResponse.json(deliveryPerson)
  } catch (error) {
    console.error('Erro ao criar motoboy:', error)
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
