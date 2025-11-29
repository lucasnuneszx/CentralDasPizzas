'use client'

import { useState, useEffect, useCallback } from 'react'
import { printToSerialPort, requestSerialPort } from '@/lib/printer-client'
import toast from 'react-hot-toast'

// Tipo para SerialPort (definido em printer-client.ts)
declare global {
  interface SerialPort {
    readable: ReadableStream<Uint8Array> | null
    writable: WritableStream<Uint8Array> | null
    open(options: { baudRate: number }): Promise<void>
    close(): Promise<void>
    getInfo(): { usbVendorId?: number; usbProductId?: number }
  }
}

interface PrinterState {
  port: SerialPort | null
  isConnected: boolean
  printerName: string
}

export function usePrinter() {
  const [printerState, setPrinterState] = useState<PrinterState>({
    port: null,
    isConnected: false,
    printerName: ''
  })

  // Carregar impressora salva
  useEffect(() => {
    const loadSavedPrinter = async () => {
      try {
        const response = await fetch('/api/settings')
        if (response.ok) {
          const data = await response.json()
          if (data.printerName) {
            setPrinterState(prev => ({
              ...prev,
              printerName: data.printerName
            }))
          }
        }
      } catch (error) {
        console.error('Erro ao carregar impressora:', error)
      }
    }

    loadSavedPrinter()
  }, [])

  const selectPrinter = useCallback(async () => {
    try {
      const port = await requestSerialPort()
      
      if (port) {
        // Abrir porta
        await port.open({ baudRate: 9600 })
        
        const portInfo = port.getInfo()
        const printerName = portInfo.usbVendorId && portInfo.usbProductId 
          ? `USB Printer (${portInfo.usbVendorId}:${portInfo.usbProductId})`
          : 'Impressora USB Selecionada'
        
        setPrinterState({
          port,
          isConnected: true,
          printerName
        })

        // Salvar nas configurações
        await fetch('/api/settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            printerName: printerName,
            printerSerialPort: JSON.stringify({
              vendorId: portInfo.usbVendorId,
              productId: portInfo.usbProductId
            })
          })
        })

        toast.success('Impressora selecionada com sucesso!')
        return true
      }
      return false
    } catch (error: any) {
      toast.error(error.message || 'Erro ao selecionar impressora')
      return false
    }
  }, [])

  const disconnectPrinter = useCallback(async () => {
    if (printerState.port) {
      try {
        await printerState.port.close()
        setPrinterState({
          port: null,
          isConnected: false,
          printerName: ''
        })
        toast.success('Impressora desconectada')
      } catch (error) {
        console.error('Erro ao desconectar:', error)
      }
    }
  }, [printerState.port])

  const printOrder = useCallback(async (orderId: string, printType: 'kitchen' | 'receipt' = 'kitchen') => {
    if (!printerState.port || !printerState.isConnected) {
      toast.error('Nenhuma impressora conectada. Selecione uma impressora primeiro.')
      return false
    }

    try {
      // Buscar dados do pedido
      const response = await fetch(`/api/print`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, printType })
      })

      if (!response.ok) {
        throw new Error('Erro ao buscar dados do pedido')
      }

      const data = await response.json()
      const content = data.content

      // Imprimir usando a porta serial
      await printToSerialPort(content, printerState.port)
      
      toast.success('Comanda impressa com sucesso!')
      return true
    } catch (error: any) {
      console.error('Erro ao imprimir:', error)
      toast.error(error.message || 'Erro ao imprimir comanda')
      return false
    }
  }, [printerState.port, printerState.isConnected])

  return {
    ...printerState,
    selectPrinter,
    disconnectPrinter,
    printOrder
  }
}

