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

    // Verificar se o usuário tem permissão para acessar configurações
    if (!(await checkAnyRole(request, ['ADMIN', 'MANAGER']))) {
      return NextResponse.json(
        { message: 'Sem permissão' },
        { status: 403 }
      )
    }

    // Buscar configurações do iFood
    const settings = await prisma.ifoodSettings.findFirst({
      where: {
        userId: user.id
      }
    })

    // Retornar configurações padrão se não existir
    const defaultSettings = {
      apiUrl: process.env.IFOOD_API_URL || '',
      apiKey: '',
      merchantId: '',
      autoPrint: false,
      autoAccept: false,
      notificationsEnabled: true,
      webhookUrl: '',
      logo: ''
    }

    return NextResponse.json(settings || defaultSettings)
  } catch (error) {
    console.error('Erro ao buscar configurações do iFood:', error)
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    
    if (!user) {
      return NextResponse.json(
        { message: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Verificar se o usuário tem permissão para acessar configurações
    if (!(await checkAnyRole(request, ['ADMIN', 'MANAGER']))) {
      return NextResponse.json(
        { message: 'Sem permissão' },
        { status: 403 }
      )
    }

    const settingsData = await request.json()

    // Upsert configurações do iFood
    const settings = await prisma.ifoodSettings.upsert({
      where: {
        userId: user.id
      },
      update: {
        apiUrl: settingsData.apiUrl,
        apiKey: settingsData.apiKey,
        merchantId: settingsData.merchantId,
        autoPrint: settingsData.autoPrint,
        autoAccept: settingsData.autoAccept,
        notificationsEnabled: settingsData.notificationsEnabled,
        webhookUrl: settingsData.webhookUrl,
        logo: settingsData.logo
      },
      create: {
        userId: user.id,
        apiUrl: settingsData.apiUrl,
        apiKey: settingsData.apiKey,
        merchantId: settingsData.merchantId,
        autoPrint: settingsData.autoPrint,
        autoAccept: settingsData.autoAccept,
        notificationsEnabled: settingsData.notificationsEnabled,
        webhookUrl: settingsData.webhookUrl,
        logo: settingsData.logo
      }
    })

    return NextResponse.json(settings)
  } catch (error) {
    console.error('Erro ao salvar configurações do iFood:', error)
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
