'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Printer, Download } from 'lucide-react'
import toast from 'react-hot-toast'
import { printNative } from '@/lib/print-native'

interface PrintOrderProps {
  orderId: string
  orderNumber: string
}

export function PrintOrder({ orderId, orderNumber }: PrintOrderProps) {
  const [isPrinting, setIsPrinting] = useState(false)

  const handlePrint = async (printType: 'kitchen' | 'receipt') => {
    setIsPrinting(true)
    
    try {
      // Buscar dados do pedido
      const response = await fetch('/api/print', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId,
          printType
        }),
      })

      if (!response.ok) {
        throw new Error('Erro ao buscar dados do pedido')
      }

      const data = await response.json()
      
      if (!data.order) {
        throw new Error('Dados do pedido não encontrados')
      }
      
      // Usar impressão nativa do navegador (reconhece TODAS as impressoras)
      printNative({
        orderId: data.order.id,
        orderNumber: orderNumber,
        dateTime: data.order.dateTime || new Date().toLocaleString('pt-BR'),
        customerName: data.order.customerName || '',
        customerPhone: data.order.customerPhone,
        items: data.order.items || [],
        total: data.order.total || 0,
        deliveryType: data.order.deliveryType || 'PICKUP',
        paymentMethod: data.order.paymentMethod || 'CASH',
        address: data.order.address,
        notes: data.order.notes,
        printType
      })
      
      toast.success(`${printType === 'kitchen' ? 'Abrindo impressão para cozinha' : 'Abrindo cupom fiscal'}...`)
    } catch (error: any) {
      console.error('Erro ao imprimir:', error)
      toast.error(error.message || 'Erro ao imprimir')
    } finally {
      setIsPrinting(false)
    }
  }

  const handleDownload = async () => {
    try {
      const response = await fetch('/api/print', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId,
          printType: 'receipt'
        }),
      })

      if (response.ok) {
        const data = await response.json()
        
        // Criar e baixar arquivo de texto
        const blob = new Blob([data.content], { type: 'text/plain' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `pedido-${orderNumber}.txt`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        
        toast.success('Arquivo baixado!')
      } else {
        toast.error('Erro ao gerar arquivo')
      }
    } catch (error) {
      toast.error('Erro ao gerar arquivo')
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Printer className="h-5 w-5" />
          Impressão
        </CardTitle>
        <CardDescription>
          Imprimir pedido #{orderNumber}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <Button
            onClick={() => handlePrint('kitchen')}
            disabled={isPrinting}
            className="w-full"
          >
            <Printer className="h-4 w-4 mr-2" />
            {isPrinting ? 'Imprimindo...' : 'Imprimir para Cozinha'}
          </Button>
          
          <Button
            onClick={() => handlePrint('receipt')}
            disabled={isPrinting}
            variant="outline"
            className="w-full"
          >
            <Printer className="h-4 w-4 mr-2" />
            {isPrinting ? 'Imprimindo...' : 'Imprimir Cupom Fiscal'}
          </Button>
          
          <Button
            onClick={handleDownload}
            variant="outline"
            className="w-full"
          >
            <Download className="h-4 w-4 mr-2" />
            Baixar Arquivo
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}



