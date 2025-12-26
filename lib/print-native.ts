/**
 * Sistema de impressão simplificado usando API nativa do navegador
 * Reconhece automaticamente TODAS as impressoras instaladas no Windows
 * Funciona igual ao app da 99 - simples e direto
 */

interface PrintData {
  orderId: string
  orderNumber: string
  dateTime: string
  customerName: string
  customerPhone?: string
  items: Array<{
    name: string
    quantity: number
    price: number
    flavors?: string[]
    observations?: string
  }>
  total: number
  deliveryType: 'DELIVERY' | 'PICKUP'
  paymentMethod: string
  address?: {
    street: string
    number: string
    complement?: string
    neighborhood: string
    city: string
    state: string
    zipCode: string
  }
  notes?: string
  printType: 'kitchen' | 'receipt'
}

/**
 * Imprimir usando a API nativa do navegador
 * Abre o diálogo de impressão do Windows com TODAS as impressoras disponíveis
 */
export function printNative(data: PrintData) {
  try {
    const printWindow = window.open('', '_blank', 'width=800,height=600')
    if (!printWindow) {
      throw new Error('Não foi possível abrir a janela de impressão. Verifique se os pop-ups estão bloqueados.')
    }

    const html = generatePrintHTML(data)
    printWindow.document.write(html)
    printWindow.document.close()

    // Aguardar o conteúdo carregar antes de imprimir
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.focus()
        printWindow.print()
        // Fechar a janela após impressão (usuário pode cancelar)
        setTimeout(() => {
          printWindow.close()
        }, 1000)
      }, 500)
    }

    // Fallback caso onload não dispare
    setTimeout(() => {
      if (printWindow.document.readyState === 'complete') {
        printWindow.focus()
        printWindow.print()
        setTimeout(() => {
          printWindow.close()
        }, 1000)
      }
    }, 1000)
  } catch (error: any) {
    console.error('Erro ao imprimir:', error)
    throw new Error(error.message || 'Erro ao abrir janela de impressão')
  }
}

/**
 * Gerar HTML formatado para impressão
 */
function generatePrintHTML(data: PrintData): string {
  const isKitchen = data.printType === 'kitchen'
  
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${isKitchen ? 'Comanda Cozinha' : 'Cupom Fiscal'} - Pedido #${data.orderNumber}</title>
  <style>
    @media print {
      @page {
        size: 80mm auto;
        margin: 0;
      }
      body {
        margin: 0;
        padding: 10mm;
        font-family: 'Courier New', monospace;
        font-size: 12pt;
        line-height: 1.4;
      }
      .no-print {
        display: none;
      }
    }
    body {
      font-family: 'Courier New', monospace;
      font-size: 12pt;
      line-height: 1.4;
      max-width: 80mm;
      margin: 0 auto;
      padding: 10mm;
    }
    .header {
      text-align: center;
      border-bottom: 2px dashed #000;
      padding-bottom: 10px;
      margin-bottom: 10px;
    }
    .header h1 {
      font-size: 16pt;
      font-weight: bold;
      margin: 5px 0;
    }
    .section {
      margin: 10px 0;
    }
    .section-title {
      font-weight: bold;
      text-align: center;
      border-top: 1px dashed #000;
      border-bottom: 1px dashed #000;
      padding: 5px 0;
      margin: 10px 0;
    }
    .item {
      margin: 8px 0;
    }
    .item-name {
      font-weight: bold;
    }
    .item-details {
      margin-left: 10px;
      font-size: 10pt;
    }
    .total {
      border-top: 2px solid #000;
      padding-top: 10px;
      margin-top: 15px;
      font-weight: bold;
      font-size: 14pt;
      text-align: center;
    }
    .footer {
      text-align: center;
      border-top: 2px dashed #000;
      padding-top: 10px;
      margin-top: 15px;
      font-size: 10pt;
    }
    .info-line {
      margin: 3px 0;
    }
    .address {
      margin-left: 10px;
      font-size: 10pt;
    }
    .notes {
      margin-top: 10px;
      padding: 5px;
      background: #f0f0f0;
      font-style: italic;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>CENTRAL DAS PIZZAS</h1>
    <div class="info-line">${data.dateTime}</div>
    <div class="info-line">Pedido: #${data.orderNumber}</div>
  </div>

  ${isKitchen ? `
    <div class="section">
      <div class="section-title">PEDIDO PARA COZINHA</div>
      
      <div class="info-line"><strong>Cliente:</strong> ${data.customerName}</div>
      ${data.customerPhone ? `<div class="info-line"><strong>Telefone:</strong> ${data.customerPhone}</div>` : ''}
      
      <div style="margin-top: 15px;">
        ${data.items.map(item => {
          // Formatar sabores
          let saboresText = ''
          if (item.flavors && item.flavors.length > 0) {
            if (item.flavors.length === 1) {
              saboresText = item.flavors[0]
            } else if (item.flavors.length === 2) {
              saboresText = `${item.flavors[0]} E ${item.flavors[1]}`
            } else {
              const todosMenosUltimo = item.flavors.slice(0, -1).join(', ')
              const ultimo = item.flavors[item.flavors.length - 1]
              saboresText = `${todosMenosUltimo} E ${ultimo}`
            }
          }
          
          return `
          <div class="item">
            <div class="item-name">${item.quantity}x ${item.name}</div>
            ${saboresText ? `<div class="item-details"><strong>Sabores:</strong> ${saboresText}</div>` : ''}
            ${item.observations ? `<div class="item-details"><strong>Obs:</strong> ${item.observations}</div>` : ''}
            <div class="item-details">R$ ${item.price.toFixed(2)} cada</div>
          </div>
        `
        }).join('')}
      </div>
      
      ${data.notes ? `
        <div class="notes">
          <strong>OBSERVAÇÕES GERAIS:</strong><br>
          ${data.notes}
        </div>
      ` : ''}
      
      <div class="total">
        TOTAL: R$ ${data.total.toFixed(2)}
      </div>
      
      ${data.deliveryType === 'DELIVERY' && data.address ? `
        <div class="section">
          <div class="section-title">ENTREGA</div>
          <div class="address">
            ${data.address.street}, ${data.address.number}<br>
            ${data.address.complement ? data.address.complement + '<br>' : ''}
            ${data.address.neighborhood}<br>
            ${data.address.city} - ${data.address.state}<br>
            CEP: ${data.address.zipCode}
          </div>
        </div>
      ` : data.deliveryType === 'PICKUP' ? `
        <div class="section">
          <div class="section-title">RETIRADA NO BALCÃO</div>
        </div>
      ` : ''}
    </div>
  ` : `
    <div class="section">
      <div class="section-title">CUPOM FISCAL</div>
      
      <div class="info-line"><strong>Cliente:</strong> ${data.customerName}</div>
      ${data.customerPhone ? `<div class="info-line"><strong>Telefone:</strong> ${data.customerPhone}</div>` : ''}
      
      <div style="margin-top: 15px;">
        ${data.items.map(item => {
          // Formatar sabores no formato IFOOD
          let saboresText = ''
          if (item.flavors && item.flavors.length > 0) {
            if (item.flavors.length === 1) {
              saboresText = item.flavors[0]
            } else if (item.flavors.length === 2) {
              saboresText = `${item.flavors[0]} E ${item.flavors[1]}`
            } else {
              const todosMenosUltimo = item.flavors.slice(0, -1).join(', ')
              const ultimo = item.flavors[item.flavors.length - 1]
              saboresText = `${todosMenosUltimo} E ${ultimo}`
            }
          }
          
          return `
          <div class="item">
            <div class="item-name">${item.quantity}X ${item.name.toUpperCase()}</div>
            ${saboresText ? `<div class="item-details">SABORES - ${saboresText}</div>` : ''}
            ${item.observations ? `<div class="item-details">Obs: ${item.observations}</div>` : ''}
          </div>
        `
        }).join('')}
      </div>
      
      <div class="total">
        ${data.deliveryType === 'DELIVERY' ? `
          SUBTOTAL: R$ ${data.total.toFixed(2)}<br>
          TAXA ENTREGA: R$ 5,00<br>
          TOTAL: R$ ${(data.total + 5).toFixed(2)}
        ` : `
          TOTAL: R$ ${data.total.toFixed(2)}
        `}
      </div>
      
      <div class="section">
        <div class="info-line"><strong>Forma de Pagamento:</strong> ${getPaymentMethodText(data.paymentMethod)}</div>
        <div class="info-line"><strong>Tipo:</strong> ${data.deliveryType === 'DELIVERY' ? 'ENTREGA' : 'RETIRADA'}</div>
      </div>
      
      ${data.notes ? `
        <div class="notes">
          <strong>OBSERVAÇÕES:</strong><br>
          ${data.notes}
        </div>
      ` : ''}
    </div>
  `}

  <div class="footer">
    OBRIGADO PELA PREFERÊNCIA!
  </div>
</body>
</html>
  `
}

function getPaymentMethodText(method: string): string {
  const methods: Record<string, string> = {
    'CASH': 'DINHEIRO',
    'CREDIT_CARD': 'CARTÃO DE CRÉDITO',
    'DEBIT_CARD': 'CARTÃO DE DÉBITO',
    'PIX': 'PIX',
    'IFOOD': 'IFOOD'
  }
  return methods[method] || method
}

