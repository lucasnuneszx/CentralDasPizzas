import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { prisma } from '@/lib/prisma'
import { UserRole } from '@/lib/constants'

export async function GET() {
  try {
    // Buscar configurações do banco ou retornar padrões
    const settings = await prisma.systemSettings.findFirst()
    
    if (settings) {
      return NextResponse.json(settings)
    }

    // Retornar configurações padrão se não existirem
    const defaultSettings = {
      restaurantName: 'Central Das Pizzas',
      restaurantAddress: '',
      restaurantPhone: '',
      restaurantEmail: '',
      restaurantLogo: '',
      restaurantBanner: '',
      deliveryEstimate: '35 - 70min',
      isOpen: true,
      openingHours: '',
      ifoodApiKey: '',
      ifoodApiSecret: '',
      printerIp: '',
      printerPort: '9100',
      autoPrint: true,
      taxRate: 0,
      deliveryFee: 0,
      minOrderValue: 0
    }

    return NextResponse.json(defaultSettings)
  } catch (error) {
    console.error('Erro ao buscar configurações:', error)
    return NextResponse.json({ message: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ message: 'Acesso negado' }, { status: 403 })
    }

    const settingsData = await request.json()
    
    // Log para debug
    console.log('Salvando configurações:', {
      restaurantName: settingsData.restaurantName,
      hasLogo: !!settingsData.restaurantLogo,
      hasBanner: !!settingsData.restaurantBanner,
      logoLength: settingsData.restaurantLogo?.length || 0,
      bannerLength: settingsData.restaurantBanner?.length || 0
    })

    // Verificar se já existem configurações
    const existingSettings = await prisma.systemSettings.findFirst()

    if (existingSettings) {
      // Atualizar configurações existentes
      const updatedSettings = await prisma.systemSettings.update({
        where: { id: existingSettings.id },
        data: settingsData
      })
      
      console.log('Configurações atualizadas com sucesso')
      return NextResponse.json(updatedSettings)
    } else {
      // Criar novas configurações
      const newSettings = await prisma.systemSettings.create({
        data: settingsData
      })
      
      console.log('Configurações criadas com sucesso')
      return NextResponse.json(newSettings)
    }
  } catch (error) {
    console.error('Erro ao salvar configurações:', error)
    return NextResponse.json({ 
      message: 'Erro interno do servidor',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}


