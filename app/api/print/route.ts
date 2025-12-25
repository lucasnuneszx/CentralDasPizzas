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
  
  // Mapeamento de sabores fixos (IDs hardcoded do item-customizer)
  const fixedFlavorsMap = new Map([
    ['trad-1', 'Baiana'],
    ['trad-2', 'Banana com canela'],
    ['trad-3', 'Brigadeiro de panela'],
    ['trad-4', 'Caipira'],
    ['trad-5', 'Calabresa'],
    ['trad-6', 'Calabresa c/ cheddar'],
    ['trad-7', 'Churros'],
    ['trad-8', 'Dois queijos'],
    ['trad-9', 'Frango c/ catupiry'],
    ['trad-10', 'Frango c/ cheddar'],
    ['trad-11', 'Lombinho'],
    ['trad-12', 'Marguerita'],
    ['trad-13', 'Milho verde'],
    ['trad-14', 'Mista especial'],
    ['trad-15', 'Moda vegetariana'],
    ['trad-16', 'Portuguesa'],
    ['trad-17', 'Romeu e julieta'],
    ['esp-1', '4 queijos'],
    ['esp-2', 'Atum'],
    ['esp-3', 'Atum acebolado'],
    ['esp-4', 'Atum a moda do chef'],
    ['esp-5', 'Atum especial'],
    ['esp-6', 'Bacon'],
    ['esp-7', 'Bacon crocante'],
    ['esp-8', 'Bacon especial'],
    ['esp-9', 'Frango a moda da casa'],
    ['esp-10', 'Frango a moda do chef'],
    ['esp-11', 'Frango especial'],
    ['esp-12', 'Lombinho'],
    ['esp-13', 'Nordestina'],
    ['esp-14', 'Nordestina a moda do chef'],
    ['esp-15', 'Nordestina especial'],
    ['prem-1', 'Camarão aos três queijos'],
    ['prem-2', 'Camarão com catupiry philadelphia'],
    ['prem-3', 'Camarão especial'],
    ['prem-4', 'Carne do Sol aos três Queijos'],
    ['prem-5', 'Carne do sol apimentada'],
    ['prem-6', 'Carne do sol com catupiry philadelphia'],
    ['prem-7', 'Mega nordestina'],
    ['prem-8', 'Sabor do chef'],
    ['prem-9', 'Strogonoff de Camarão']
  ])
  
  // Combinar sabores do banco com sabores fixos
  return new Map([
    ...Array.from(allFlavors.map(f => [f.id, f.name] as [string, string])),
    ...Array.from(fixedFlavorsMap)
  ])
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
          const parsed = JSON.parse(item.selectedFlavors)
          if (Array.isArray(parsed) && parsed.length > 0) {
            const flavorNames = parsed.map((f: any) => {
              // Se for objeto com id, buscar nome no mapa
              if (typeof f === 'object' && f.id) {
                return flavorsMap.get(f.id) || f.name || f.id
              }
              // Se for string (ID), buscar nome no mapa
              return flavorsMap.get(f) || f
            })
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
            const flavorNames = extras.flavorsPizza2.map((f: any) => {
              // Se for objeto com id, buscar nome no mapa
              if (typeof f === 'object' && f.id) {
                return flavorsMap.get(f.id) || f.name || f.id
              }
              // Se for string (ID), buscar nome no mapa
              return flavorsMap.get(f) || f
            })
            content += `   Sabores Pizza 2: ${flavorNames.join(', ')}\n`
          }
        } catch (e) {
          // Ignorar erro de parse
        }
      }
      
      content += `   R$ ${item.price.toFixed(2).replace('.', ',')} cada\n`
      
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
    content += `TOTAL: R$ ${order.total.toFixed(2).replace('.', ',')}\n`
    
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
    
    // Endereço completo se for entrega
    if (order.deliveryType === 'DELIVERY' && order.address) {
      content += '\nENDEREÇO DE ENTREGA:\n'
      content += `${order.address.street}, ${order.address.number}\n`
      if (order.address.complement) {
        content += `${order.address.complement}\n`
      }
      content += `${order.address.neighborhood}\n`
      content += `${order.address.city} - ${order.address.state}\n`
      if (order.address.zipCode) {
        content += `CEP: ${order.address.zipCode}\n`
      }
    }
    
    // Informações do cliente
    content += '\nCLIENTE:\n'
    content += `Nome: ${order.user.name}\n`
    if (order.user.phone) {
      content += `Telefone: ${order.user.phone}\n`
    }
    
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




