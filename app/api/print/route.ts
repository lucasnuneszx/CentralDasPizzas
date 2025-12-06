import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ThermalPrinter, PrinterTypes, CharacterSet, BreakLine } from 'node-thermal-printer'

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser()
    
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

    if (!order) {
      return NextResponse.json(
        { message: 'Pedido não encontrado' },
        { status: 404 }
      )
    }

    // Gerar conteúdo para impressão
    const printContent = generatePrintContent(order, printType)

    // Em produção, enviar para a impressora
    await sendToPrinter(printContent, printType)

    return NextResponse.json({ 
      message: 'Impressão enviada com sucesso',
      content: printContent 
    })
  } catch (error) {
    console.error('Erro ao imprimir:', error)
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

function generatePrintContent(order: any, printType: string) {
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
      content += `   R$ ${item.price.toFixed(2)} cada\n`
      if (order.notes) {
        content += `   Obs: ${order.notes}\n`
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
      content += `   ${item.quantity} x R$ ${item.price.toFixed(2)} = R$ ${(item.price * item.quantity).toFixed(2)}\n`
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

async function sendToPrinter(content: string, printType: string) {
  try {
    // Buscar configurações da impressora
    const settings = await prisma.systemSettings.findFirst()
    // Tentar usar nome da impressora das configurações, variável de ambiente ou padrão
    const printerName = settings?.printerName || process.env.PRINTER_NAME || 'ELGIN i8'
    
    console.log(`Tentando imprimir na impressora: ${printerName}`)
    console.log(`Tipo: ${printType}`)
    
    // Criar instância da impressora térmica
    const printer = new ThermalPrinter({
      type: PrinterTypes.EPSON, // Elgin i8 usa comandos ESC/POS compatíveis com Epson
      interface: 'printer:' + printerName, // Nome da impressora no Windows
      characterSet: CharacterSet.PC852_LATIN2,
      removeSpecialCharacters: false,
      lineCharacter: '-',
      breakLine: BreakLine.WORD,
      options: {
        timeout: 5000
      }
    })

    // Verificar se a impressora está conectada
    const isConnected = await printer.isPrinterConnected()
    
    if (!isConnected) {
      console.warn('Impressora não encontrada. Tentando usar nome padrão ou porta USB...')
      
      // Tentar alternativas
      const alternativeNames = [
        'ELGIN i8',
        'ELGIN',
        'Bematech',
        'EPSON TM-T20'
      ]
      
      let connected = false
      for (const name of alternativeNames) {
        try {
          const altPrinter = new ThermalPrinter({
            type: PrinterTypes.EPSON,
            interface: 'printer:' + name,
            characterSet: CharacterSet.PC852_LATIN2,
            removeSpecialCharacters: false,
            lineCharacter: '-',
            breakLine: BreakLine.WORD,
            options: {
              timeout: 3000
            }
          })
          
          if (await altPrinter.isPrinterConnected()) {
            console.log(`Impressora encontrada: ${name}`)
            Object.assign(printer, altPrinter)
            connected = true
            break
          }
        } catch (e) {
          // Continuar tentando
        }
      }
      
      if (!connected) {
        console.log('Impressora não encontrada. Conteúdo para impressão:')
        console.log(content)
        console.log('\n--- Para configurar a impressora: ---')
        console.log('1. Instale o driver da Elgin i8')
        console.log('2. Configure o nome da impressora nas Configurações do Sistema')
        console.log('3. Ou defina a variável PRINTER_NAME no .env')
        return
      }
    }

    // Preparar conteúdo para impressão formatado
    printer.alignCenter()
    printer.bold(true)
    printer.println('CENTRAL DAS PIZZAS')
    printer.bold(false)
    printer.drawLine()
    printer.alignLeft()
    
    // Adicionar conteúdo linha por linha
    const lines = content.split('\n')
    for (const line of lines) {
      const trimmedLine = line.trim()
      
      if (trimmedLine === '') {
        printer.newLine()
      } else if (trimmedLine.startsWith('=')) {
        printer.drawLine()
      } else if (trimmedLine.includes('PEDIDO PARA COZINHA') || trimmedLine.includes('CUPOM FISCAL')) {
        printer.alignCenter()
        printer.bold(true)
        printer.println(trimmedLine.replace(/[=]/g, '').trim())
        printer.bold(false)
        printer.alignLeft()
        printer.drawLine()
      } else if (trimmedLine.includes('TOTAL:') || trimmedLine.includes('SUBTOTAL:')) {
        printer.bold(true)
        printer.println(trimmedLine)
        printer.bold(false)
      } else if (trimmedLine.includes('Data/Hora:') || trimmedLine.includes('Pedido:') || trimmedLine.includes('Cliente:')) {
        printer.println(trimmedLine)
      } else {
        printer.println(trimmedLine)
      }
    }
    
    // Adicionar linhas finais
    printer.newLine()
    printer.drawLine()
    printer.alignCenter()
    printer.println('OBRIGADO PELA PREFERÊNCIA!')
    printer.newLine()
    printer.newLine()
    
    // Cortar papel (se a impressora suportar)
    printer.cut()
    
    // Executar impressão
    await printer.execute()
    
    console.log('✅ Comanda impressa com sucesso na impressora:', printerName)
    
  } catch (error: any) {
    console.error('Erro ao enviar para impressora:', error)
    console.log('Conteúdo que seria impresso:')
    console.log(content)
    
    // Não lançar erro para não quebrar o fluxo, apenas logar
    // throw error
  }
}



