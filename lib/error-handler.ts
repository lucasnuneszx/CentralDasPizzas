import { NextRequest, NextResponse } from 'next/server'

export function errorHandler(error: any, request: NextRequest) {
  console.error('Erro capturado pelo middleware:', {
    message: error.message,
    stack: error.stack,
    url: request.url,
    method: request.method,
    timestamp: new Date().toISOString()
  })

  // Retornar resposta de erro padronizada
  return NextResponse.json(
    { 
      message: 'Erro interno do servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    },
    { status: 500 }
  )
}

export function validateOrderData(data: any) {
  const errors: string[] = []

  if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
    errors.push('Nenhum item encontrado no pedido')
  }

  if (!data.deliveryType) {
    errors.push('Tipo de entrega obrigatório')
  }

  if (!data.paymentMethod) {
    errors.push('Método de pagamento obrigatório')
  }

  if (!data.total || data.total <= 0) {
    errors.push('Total do pedido inválido')
  }

  if (data.deliveryType === 'DELIVERY' && !data.addressId && !data.address) {
    errors.push('Endereço obrigatório para entrega')
  }

  // Validar itens
  if (data.items && Array.isArray(data.items)) {
    data.items.forEach((item: any, index: number) => {
      if (!item.comboId) {
        errors.push(`Item ${index + 1}: ID do combo obrigatório`)
      }
      if (!item.quantity || item.quantity <= 0) {
        errors.push(`Item ${index + 1}: Quantidade inválida`)
      }
      if (!item.price || item.price <= 0) {
        errors.push(`Item ${index + 1}: Preço inválido`)
      }
    })
  }

  return errors
}
