import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser, checkRole, checkAnyRole } from '@/lib/auth-helper'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    
    if (!user) {
      return NextResponse.json(
        { message: 'Não autorizado' },
        { status: 401 }
      )
    }

    const addresses = await prisma.address.findMany({
      where: {
        userId: user.id
      },
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' }
      ]
    })

    return NextResponse.json(addresses)
  } catch (error) {
    console.error('Erro ao buscar endereços:', error)
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    
    if (!user) {
      return NextResponse.json(
        { message: 'Não autorizado' },
        { status: 401 }
      )
    }

    const { street, number, complement, neighborhood, city, state, zipCode, isDefault } = await request.json()

    // Se este será o endereço padrão, remover o padrão dos outros
    if (isDefault) {
      await prisma.address.updateMany({
        where: {
          userId: user.id,
          isDefault: true
        },
        data: {
          isDefault: false
        }
      })
    }

    const address = await prisma.address.create({
      data: {
        userId: user.id,
        street,
        number,
        complement,
        neighborhood,
        city,
        state,
        zipCode,
        isDefault: isDefault ?? false
      }
    })

    return NextResponse.json(address, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar endereço:', error)
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}



