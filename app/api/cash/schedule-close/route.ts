import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser, checkRole, checkAnyRole } from '@/lib/auth-helper'
import { prisma } from '@/lib/prisma'
import { UserRole } from '@/lib/constants'

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    
    if (!user || !(await checkAnyRole(request, ['ADMIN', 'MANAGER']))) {
      return NextResponse.json({ message: 'Acesso negado' }, { status: 403 })
    }

    const { time, enabled } = await request.json()

    // Salvar configuração de fechamento automático
    const settings = await prisma.systemSettings.findFirst()
    
    if (settings) {
      await prisma.systemSettings.update({
        where: { id: settings.id },
        data: {
          autoCloseTime: time,
          autoCloseEnabled: enabled
        }
      })
    } else {
      await prisma.systemSettings.create({
        data: {
          restaurantName: 'Central Das Pizzas',
          autoCloseTime: time,
          autoCloseEnabled: enabled
        }
      })
    }

    return NextResponse.json({ 
      message: 'Fechamento automático configurado com sucesso',
      time,
      enabled 
    })

  } catch (error) {
    console.error('Erro ao configurar fechamento automático:', error)
    return NextResponse.json({ message: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    
    if (!user || !(await checkAnyRole(request, ['ADMIN', 'MANAGER']))) {
      return NextResponse.json({ message: 'Acesso negado' }, { status: 403 })
    }

    const settings = await prisma.systemSettings.findFirst()
    
    return NextResponse.json({
      autoCloseTime: settings?.autoCloseTime || '23:00',
      autoCloseEnabled: settings?.autoCloseEnabled || false
    })

  } catch (error) {
    console.error('Erro ao buscar configurações:', error)
    return NextResponse.json({ message: 'Erro interno do servidor' }, { status: 500 })
  }
}


