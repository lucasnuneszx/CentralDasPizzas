import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth-helper'
import { prisma } from '@/lib/prisma'

// Função auxiliar para buscar sabores (definida fora para ser reutilizada)
async function getFlavorsMap() {
  const allFlavors = await prisma.pizzaFlavor.findMany({
    select: {
      id: true,
      name: true
    }
  })
  return new Map(allFlavors.map(f => [f.id, f.name]))
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

    const { orderId, printType } = await request.json()

    // Buscar o pedido
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            combo: true
          }
        },
        address: true,
        user: true
      }
    })

    // Buscar sabores para mapear IDs para nomes
    const flavorsMap = await getFlavorsMap()

    if (!order) {
      return NextResponse.json(
        { message: 'Pedido não encontrado' },
        { status: 404 }
      )
    }

    // Gerar conteúdo para impressão (texto simples para download)
    const printContent = await generatePrintContent(order, printType)

    // Formatar dados para impressão nativa
    const orderData = {
      id: order.id,
      dateTime: new Date(order.createdAt).toLocaleString('pt-BR'),
      customerName: order.user.name,
      customerPhone: order.user.phone || undefined,
      items: order.items.map((item: any) => ({
        name: item.combo.name,
        quantity: item.quantity,
        price: parseFloat(item.price.toString())
      })),
      total: parseFloat(order.total.toString()),
      deliveryType: order.deliveryType as 'DELIVERY' | 'PICKUP',
      paymentMethod: order.paymentMethod,
      address: order.address ? {
        street: order.address.street,
        number: order.address.number,
        complement: order.address.complement || undefined,
        neighborhood: order.address.neighborhood,
        city: order.address.city,
        state: order.address.state,
        zipCode: order.address.zipCode
      } : undefined,
      notes: order.notes || undefined
    }

    return NextResponse.json({ 
      message: 'Dados do pedido preparados',
      content: printContent, // Mantido para compatibilidade com download
      order: orderData
    })
  } catch (error) {
    console.error('Erro ao buscar dados do pedido:', error)
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

async function generatePrintContent(order: any, printType: string) {
  // Buscar sabores para mapear IDs para nomes
  const flavorsMap = await getFlavorsMap()
  const now = new Date()
  const dateTime = now.toLocaleString('pt-BR')
  
  let content = ''
  
  // Cabeçalho
  content += '='.repeat(40) + '\n'
  content += 'CENTRAL DAS PIZZAS\n'
  content += '='.repeat(40) + '\n'
  content += `Data/Hora: ${dateTime}\n`
  content += `Pedido: #${order.id.slice(-8)}\n`
  content += `Cliente: ${order.user.name}\n`
  content += `Telefone: ${order.user.phone || 'N/A'}\n`
  content += '-'.repeat(40) + '\n'

  if (printType === 'kitchen') {
    // Impressão para cozinha
    content += 'PEDIDO PARA COZINHA\n'
    content += '-'.repeat(40) + '\n'
    
    order.items.forEach((item: any) => {
      content += `${item.quantity}x ${item.combo.name}\n`
      
      // Sabores
      if (item.selectedFlavors) {
        try {
          const flavorIds = JSON.parse(item.selectedFlavors)
          if (Array.isArray(flavorIds) && flavorIds.length > 0) {
            const flavorNames = flavorIds.map((id: string) => flavorsMap.get(id) || id)
            content += `   Sabores: ${flavorNames.join(', ')}\n`
          }
        } catch (e) {
          // Ignorar erro de parse
        }
      }
      
      // Sabores Pizza 2
      if (item.extras) {
        try {
          const extras = JSON.parse(item.extras)
          if (extras.flavorsPizza2 && Array.isArray(extras.flavorsPizza2) && extras.flavorsPizza2.length > 0) {
            const flavorNames = extras.flavorsPizza2.map((id: string) => flavorsMap.get(id) || id)
            content += `   Sabores Pizza 2: ${flavorNames.join(', ')}\n`
          }
        } catch (e) {
          // Ignorar erro de parse
        }
      }
      
      content += `   R$ ${item.price.toFixed(2)} cada\n`
      
      // Observações do item
      if (item.observations) {
        content += `   Obs: ${item.observations}\n`
      }
      
      if (order.notes && order.items.indexOf(item) === 0) {
        content += `   Obs Geral: ${order.notes}\n`
      }
      content += '\n'
    })
    
    content += '-'.repeat(40) + '\n'
    content += `TOTAL: R$ ${order.total.toFixed(2)}\n`
    
    if (order.deliveryType === 'DELIVERY') {
      content += '\nENTREGA\n'
      if (order.address) {
        content += `${order.address.street}, ${order.address.number}\n`
        if (order.address.complement) {
          content += `${order.address.complement}\n`
        }
        content += `${order.address.neighborhood}\n`
        content += `${order.address.city} - ${order.address.state}\n`
        content += `CEP: ${order.address.zipCode}\n`
      }
    } else {
      content += '\nRETIRADA NO BALCÃO\n'
    }
    
  } else if (printType === 'receipt') {
    // Impressão de cupom fiscal
    content += 'CUPOM FISCAL\n'
    content += '-'.repeat(40) + '\n'
    
    order.items.forEach((item: any) => {
      content += `${item.combo.name}\n`
      
      // Sabores
      if (item.selectedFlavors) {
        try {
          const flavorIds = JSON.parse(item.selectedFlavors)
          if (Array.isArray(flavorIds) && flavorIds.length > 0) {
            const flavorNames = flavorIds.map((id: string) => flavorsMap.get(id) || id)
            content += `   Sabores: ${flavorNames.join(', ')}\n`
          }
        } catch (e) {
          // Ignorar erro de parse
        }
      }
      
      // Sabores Pizza 2
      if (item.extras) {
        try {
          const extras = JSON.parse(item.extras)
          if (extras.flavorsPizza2 && Array.isArray(extras.flavorsPizza2) && extras.flavorsPizza2.length > 0) {
            const flavorNames = extras.flavorsPizza2.map((id: string) => flavorsMap.get(id) || id)
            content += `   Sabores Pizza 2: ${flavorNames.join(', ')}\n`
          }
        } catch (e) {
          // Ignorar erro de parse
        }
      }
      
      content += `   ${item.quantity} x R$ ${item.price.toFixed(2)} = R$ ${(item.price * item.quantity).toFixed(2)}\n`
      
      // Observações do item
      if (item.observations) {
        content += `   Obs: ${item.observations}\n`
      }
    })
    
    content += '-'.repeat(40) + '\n'
    content += `SUBTOTAL: R$ ${order.total.toFixed(2)}\n`
    
    if (order.deliveryType === 'DELIVERY') {
      content += `TAXA ENTREGA: R$ 5,00\n`
      content += `TOTAL: R$ ${(order.total + 5).toFixed(2)}\n`
    } else {
      content += `TOTAL: R$ ${order.total.toFixed(2)}\n`
    }
    
    content += '-'.repeat(40) + '\n'
    content += `FORMA DE PAGAMENTO: ${getPaymentMethodText(order.paymentMethod)}\n`
    content += `TIPO: ${order.deliveryType === 'DELIVERY' ? 'ENTREGA' : 'RETIRADA'}\n`
    
    if (order.notes) {
      content += `\nOBSERVAÇÕES:\n${order.notes}\n`
    }
    
    content += '\n' + '='.repeat(40) + '\n'
    content += 'OBRIGADO PELA PREFERÊNCIA!\n'
    content += '='.repeat(40) + '\n'
  }

  return content
}

function getPaymentMethodText(method: string) {
  switch (method) {
    case 'CASH':
      return 'DINHEIRO'
    case 'CREDIT_CARD':
      return 'CARTÃO DE CRÉDITO'
    case 'DEBIT_CARD':
      return 'CARTÃO DE DÉBITO'
    case 'PIX':
      return 'PIX'
    case 'IFOOD':
      return 'IFOOD'
    default:
      return method
  }
}




