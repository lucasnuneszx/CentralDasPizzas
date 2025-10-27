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

    // Verificar se o usuário tem permissão para acessar configurações
    const allowedRoles = ['ADMIN', 'MANAGER']
    if (!allowedRoles.includes(session.user.role as any)) {
      return NextResponse.json(
        { message: 'Sem permissão' },
        { status: 403 }
      )
    }

    // Buscar configurações do iFood
    const settings = await prisma.ifoodSettings.findFirst({
      where: {
        userId: session.user.id
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
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Verificar se o usuário tem permissão para acessar configurações
    const allowedRoles = ['ADMIN', 'MANAGER']
    if (!allowedRoles.includes(session.user.role as any)) {
      return NextResponse.json(
        { message: 'Sem permissão' },
        { status: 403 }
      )
    }

    const settingsData = await request.json()

    // Upsert configurações do iFood
    const settings = await prisma.ifoodSettings.upsert({
      where: {
        userId: session.user.id
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
        userId: session.user.id,
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
