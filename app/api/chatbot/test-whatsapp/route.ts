import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser, checkRole, checkAnyRole } from '@/lib/auth-helper'
import { prisma } from '@/lib/prisma'
import { UserRole } from '@/lib/constants'

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    
    if (!user || !(await checkAnyRole(request, ['ADMIN', 'MANAGER']))) {
      return NextResponse.json(
        { message: 'Acesso negado' },
        { status: 403 }
      )
    }

    const { phoneNumberId, accessToken } = await request.json()

    if (!phoneNumberId || !accessToken) {
      return NextResponse.json(
        { message: 'Dados incompletos. Preencha Phone Number ID e Access Token.' },
        { status: 400 }
      )
    }

    let connected = false
    let message = ''

    try {
      // Testar conexão com WhatsApp Business API
      const testResponse = await fetch(
        `https://graph.facebook.com/v18.0/${phoneNumberId}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      )

      if (testResponse.ok) {
        connected = true
        message = 'Conexão com WhatsApp Business API estabelecida com sucesso!'
      } else {
        const errorData = await testResponse.json().catch(() => ({}))
        message = errorData.error?.message || 'Erro ao conectar com WhatsApp Business API. Verifique as credenciais.'
      }
    } catch (error: any) {
      console.error('Erro ao testar conexão:', error)
      message = `Erro ao testar conexão: ${error.message}`
    }

    return NextResponse.json({
      connected,
      message
    })
  } catch (error) {
    console.error('Erro ao testar WhatsApp:', error)
    return NextResponse.json(
      { message: 'Erro interno do servidor', connected: false },
      { status: 500 }
    )
  }
}

