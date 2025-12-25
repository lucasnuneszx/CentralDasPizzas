import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser, checkRole, checkAnyRole } from '@/lib/auth-helper'
import { prisma } from '@/lib/prisma'
import { UserRole } from '@/lib/constants'

export async function GET(request: NextRequest) {
  try {
    let settings = null
    
    try {
      // Tentar buscar com todas as colunas
      settings = await prisma.systemSettings.findFirst({
        select: {
          id: true,
          restaurantName: true,
          restaurantAddress: true,
          restaurantPhone: true,
          restaurantEmail: true,
          restaurantLogo: true,
          restaurantBanner: true,
          profileLogo: true,
          deliveryEstimate: true,
          isOpen: true,
          openingHours: true,
          ifoodApiKey: true,
          ifoodApiSecret: true,
          printerIp: true,
          printerPort: true,
          printerName: true,
          printerSerialPort: true,
          autoPrint: true,
          taxRate: true,
          deliveryFee: true,
          minOrderValue: true,
          autoCloseTime: true,
          autoCloseEnabled: true,
          premiumFlavorPrice: true,
          especialFlavorPrice: true,
          stuffedCrustPrice: true,
          whatsappProvider: true,
          whatsappApiUrl: true,
          whatsappApiKey: true,
          whatsappInstanceName: true,
          whatsappPhoneNumberId: true,
          whatsappAccessToken: true,
          whatsappBusinessAccountId: true,
          whatsappConnected: true,
          notificationSound: true,
          createdAt: true,
          updatedAt: true,
        }
      })
    } catch (error: any) {
      // Se houver erro por colunas faltantes, buscar apenas colunas básicas
      if (error.code === 'P2022' || error.message?.includes('does not exist')) {
        console.warn('⚠️ Algumas colunas não existem ainda. Buscando apenas colunas básicas...')
        try {
          settings = await prisma.systemSettings.findFirst({
            select: {
              id: true,
              restaurantName: true,
              restaurantAddress: true,
              restaurantPhone: true,
              restaurantEmail: true,
              deliveryEstimate: true,
              isOpen: true,
              openingHours: true,
              createdAt: true,
              updatedAt: true,
            }
          })
        } catch (innerError) {
          console.warn('⚠️ Erro ao buscar configurações básicas. Usando padrões.')
          settings = null
        }
      } else {
        throw error
      }
    }
    
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
      profileLogo: '',
      deliveryEstimate: '35 - 70min',
      isOpen: true,
      openingHours: '',
      ifoodApiKey: '',
      ifoodApiSecret: '',
      printerIp: '',
      printerPort: '9100',
      printerName: '',
      printerSerialPort: null,
      autoPrint: true,
      taxRate: 0,
      deliveryFee: 0,
      minOrderValue: 0,
      autoCloseTime: '23:00',
      autoCloseEnabled: false,
      premiumFlavorPrice: 15.00,
      especialFlavorPrice: 20.00,
      stuffedCrustPrice: 4.99,
      whatsappProvider: 'business',
      whatsappApiUrl: '',
      whatsappApiKey: '',
      whatsappInstanceName: '',
      whatsappPhoneNumberId: '',
      whatsappAccessToken: '',
      whatsappBusinessAccountId: '',
      whatsappConnected: false
    }

    return NextResponse.json(defaultSettings)
  } catch (error: any) {
    console.error('Erro ao buscar configurações:', error)
    // Retornar configurações padrão em vez de erro para não quebrar o frontend
    return NextResponse.json({
      restaurantName: 'Central Das Pizzas',
      restaurantAddress: '',
      restaurantPhone: '',
      restaurantEmail: '',
      restaurantLogo: '',
      restaurantBanner: '',
      profileLogo: '',
      deliveryEstimate: '35 - 70min',
      isOpen: true,
      openingHours: '',
      ifoodApiKey: '',
      ifoodApiSecret: '',
      printerIp: '',
      printerPort: '9100',
      printerName: '',
      printerSerialPort: null,
      autoPrint: true,
      taxRate: 0,
      deliveryFee: 0,
      minOrderValue: 0,
      autoCloseTime: '23:00',
      autoCloseEnabled: false,
      premiumFlavorPrice: 15.00,
      especialFlavorPrice: 20.00,
      stuffedCrustPrice: 4.99,
      whatsappProvider: 'business',
      whatsappApiUrl: '',
      whatsappApiKey: '',
      whatsappInstanceName: '',
      whatsappPhoneNumberId: '',
      whatsappAccessToken: '',
      whatsappBusinessAccountId: '',
      whatsappConnected: false
    })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    
    if (!user) {
      return NextResponse.json({ message: 'Não autorizado' }, { status: 401 })
    }

    if (!(await checkAnyRole(request, ['ADMIN', 'MANAGER']))) {
      return NextResponse.json({ message: 'Sem permissão' }, { status: 403 })
    }

    const settingsData = await request.json()
    
    // Log para debug
    console.log('Salvando configurações:', {
      restaurantName: settingsData.restaurantName,
      hasLogo: !!settingsData.restaurantLogo,
      hasBanner: !!settingsData.restaurantBanner,
      logoLength: settingsData.restaurantLogo?.length || 0,
      bannerLength: settingsData.restaurantBanner?.length || 0,
      isOpen: settingsData.isOpen,
      deliveryEstimate: settingsData.deliveryEstimate
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


