'use client'

import { useCallback, useRef } from 'react'
import { printNative } from '@/lib/print-native'
import toast from 'react-hot-toast'

interface Order {
  id: string
  total: number
  status: string
  paymentMethod: string
  deliveryType: string
  createdAt: string
  customerName: string
  customerPhone?: string
  deliveryPerson?: string
  address?: {
    street: string
    number: string
    neighborhood: string
    city: string
    state: string
    zipCode?: string
    complement?: string
  }
  items: Array<{
    id: string
    quantity: number
    price?: number
    combo: {
      name: string
    }
    selectedFlavors?: any
    extras?: any
    observations?: string
  }>
  notes?: string
}

interface AutoPrintSettings {
  autoPrint: boolean
  printKitchen?: boolean   // Imprimir nota da cozinha
  printDelivery?: boolean  // Imprimir nota de entrega
}

interface UseAutoPrintReturn {
  autoPrintOrder: (order: Order) => Promise<void>
  printedOrdersRef: React.MutableRefObject<Set<string>>
}

/**
 * Hook para impressão automática de pedidos
 * Imprime automaticamente nota de cozinha e nota de entrega quando um novo pedido chega
 */
export function useAutoPrint(): UseAutoPrintReturn {
  // Rastrear pedidos já impressos para evitar duplicatas
  const printedOrdersRef = useRef<Set<string>>(new Set())

  const fetchPrintData = async (orderId: string, printType: 'kitchen' | 'receipt') => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null
    const response = await fetch('/api/print', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        orderId,
        printType
      })
    })

    if (!response.ok) {
      throw new Error('Erro ao buscar dados do pedido para impressão')
    }

    return response.json()
  }

  const printOrder = async (order: Order, printType: 'kitchen' | 'receipt') => {
    try {
      const data = await fetchPrintData(order.id, printType)
      
      if (!data.order) {
        throw new Error('Dados do pedido não encontrados')
      }

      // Usar impressão nativa do navegador
      printNative({
        orderId: data.order.id,
        orderNumber: order.id.slice(-8),
        dateTime: data.order.dateTime || new Date().toLocaleString('pt-BR'),
        customerName: data.order.customerName || order.customerName || '',
        customerPhone: data.order.customerPhone || order.customerPhone,
        items: data.order.items || [],
        total: data.order.total || order.total || 0,
        deliveryType: data.order.deliveryType || order.deliveryType || 'PICKUP',
        paymentMethod: data.order.paymentMethod || order.paymentMethod || 'CASH',
        address: data.order.address,
        notes: data.order.notes || order.notes,
        printType
      })

      return true
    } catch (error: any) {
      console.error(`Erro ao imprimir ${printType}:`, error)
      throw error
    }
  }

  const autoPrintOrder = useCallback(async (order: Order) => {
    // Verificar se já foi impresso
    if (printedOrdersRef.current.has(order.id)) {
      return
    }


    try {
      // Marcar como impresso antes de iniciar para evitar duplicatas
      printedOrdersRef.current.add(order.id)

      // Primeiro: Imprimir nota da COZINHA
      await printOrder(order, 'kitchen')
      
      // Aguardar um pouco entre as impressões para não sobrecarregar
      await new Promise(resolve => setTimeout(resolve, 1500))

      // Segundo: Imprimir nota de ENTREGA/CLIENTE
      await printOrder(order, 'receipt')

      toast.success(`🖨️ Pedido #${order.id.slice(-8)} impresso automaticamente (Cozinha + Entrega)`, {
        duration: 3000
      })

    } catch (error: any) {
      console.error(`Erro na impressão automática do pedido ${order.id.slice(-8)}:`, error)
      // Remover do conjunto para permitir nova tentativa
      printedOrdersRef.current.delete(order.id)
      toast.error(`Erro ao imprimir pedido #${order.id.slice(-8)} automaticamente`, {
        duration: 4000
      })
    }
  }, [])

  return {
    autoPrintOrder,
    printedOrdersRef
  }
}
