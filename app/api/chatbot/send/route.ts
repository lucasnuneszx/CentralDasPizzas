import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser, checkRole, checkAnyRole } from '@/lib/auth-helper'
import { prisma } from '@/lib/prisma'
import { UserRole } from '@/lib/constants'

async function sendWhatsAppMessage(phone: string, message: string, settings: any) {
  const { whatsappPhoneNumberId, whatsappAccessToken } = settings

  if (!whatsappPhoneNumberId || !whatsappAccessToken) {
    throw new Error('Configurações do WhatsApp Business API incompletas')
  }

  const response = await fetch(
    `https://graph.facebook.com/v18.0/${whatsappPhoneNumberId}/messages`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${whatsappAccessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: phone,
        type: 'text',
        text: {
          body: message
        }
      })
    }
  )

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: { message: 'Erro desconhecido' } }))
    throw new Error(error.error?.message || 'Erro ao enviar mensagem via WhatsApp Business API')
  }

  return await response.json()
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

    const { templateId, orderId, phone, trigger, templateData } = await request.json()

    // Buscar template ou usar dados fornecidos diretamente (para testes)
    let template
    if (templateData) {
      // Usar dados do template fornecidos diretamente (para testes com templates não salvos)
      template = templateData
    } else if (templateId) {
      template = await prisma.chatbotTemplate.findUnique({
        where: { id: templateId }
      })
    } else if (trigger) {
      template = await prisma.chatbotTemplate.findUnique({
        where: { trigger }
      })
    }

    if (!template) {
      return NextResponse.json(
        { message: 'Template não encontrado' },
        { status: 404 }
      )
    }

    // Verificar se está ativo (apenas se for do banco de dados)
    if (templateData) {
      // Template de teste, não precisa verificar isActive
    } else if (!template.isActive) {
      return NextResponse.json(
        { message: 'Template está inativo' },
        { status: 400 }
      )
    }

    // Buscar dados do pedido se orderId fornecido
    let order = null
    if (orderId) {
      order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          user: {
            select: {
              name: true,
              phone: true
            }
          },
          address: true
        }
      })
    }

    // Substituir variáveis na mensagem
    let message = template.message
    if (order) {
      message = message.replace(/{customerName}/g, order.user?.name || 'Cliente')
      message = message.replace(/{orderNumber}/g, order.id.slice(-8))
      message = message.replace(/{orderTotal}/g, `R$ ${order.total.toFixed(2).replace('.', ',')}`)
      message = message.replace(/{deliveryType}/g, order.deliveryType === 'DELIVERY' ? 'Entrega' : 'Retirada')
      message = message.replace(/{estimatedTime}/g, '35-70min')
      message = message.replace(/{deliveryPerson}/g, (order as any).deliveryPerson || 'Entregador')
    } else {
      // Valores padrão para teste
      message = message.replace(/{customerName}/g, 'Cliente')
      message = message.replace(/{orderNumber}/g, '00000000')
      message = message.replace(/{orderTotal}/g, 'R$ 0,00')
      message = message.replace(/{deliveryType}/g, 'Entrega')
      message = message.replace(/{estimatedTime}/g, '35-70min')
      message = message.replace(/{deliveryPerson}/g, 'Entregador')
    }

    // Obter número de telefone
    const targetPhone = phone || order?.user?.phone
    if (!targetPhone) {
      return NextResponse.json(
        { message: 'Número de telefone não encontrado' },
        { status: 400 }
      )
    }

    // Limpar número de telefone (remover caracteres não numéricos)
    const cleanPhone = targetPhone.replace(/\D/g, '')

    // Buscar configurações do WhatsApp
    const settings = await prisma.systemSettings.findFirst()
    
    // Enviar mensagem via WhatsApp se estiver configurado
    if (settings?.whatsappConnected && settings?.whatsappProvider) {
      try {
        await sendWhatsAppMessage(cleanPhone, message, settings)
        console.log('Mensagem enviada via WhatsApp:', {
          phone: cleanPhone,
          template: template.name
        })
      } catch (whatsappError: any) {
        console.error('Erro ao enviar via WhatsApp:', whatsappError)
        // Continuar mesmo se falhar, apenas logar
      }
    } else {
      // Se WhatsApp não estiver configurado, apenas logar
      console.log('Mensagem do chatbot (WhatsApp não configurado):', {
        phone: cleanPhone,
        message,
        template: template.name,
        orderId: orderId || null
      })
    }

    // Registrar envio no log (apenas se orderId for válido e não for teste)
    if (orderId && orderId !== 'TEST12345678') {
      try {
        await prisma.cashLog.create({
          data: {
            orderId: orderId,
            type: 'ORDER', // Usar tipo existente
            amount: 0,
            description: `Mensagem enviada: ${template.name}`
          }
        })
      } catch (logError) {
        // Não bloquear o envio se falhar ao registrar no log
        console.error('Erro ao registrar no log:', logError)
      }
    }

    // Em produção, aqui você integraria com a API do WhatsApp
    // Exemplo:
    // await sendWhatsAppMessage(cleanPhone, message)

    return NextResponse.json({
      message: 'Mensagem enviada com sucesso',
      sentTo: cleanPhone,
      content: message
    })
  } catch (error) {
    console.error('Erro ao enviar mensagem:', error)
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

