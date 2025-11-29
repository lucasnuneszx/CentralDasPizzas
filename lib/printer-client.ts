/**
 * Função para imprimir usando Web Serial API (client-side)
 * Funciona apenas no navegador quando a impressora está conectada via USB
 */

// Tipos para Web Serial API
declare global {
  interface SerialPort {
    readable: ReadableStream<Uint8Array> | null
    writable: WritableStream<Uint8Array> | null
    open(options: { baudRate: number }): Promise<void>
    close(): Promise<void>
    getInfo(): { usbVendorId?: number; usbProductId?: number }
  }

  interface Navigator {
    serial?: {
      requestPort(): Promise<SerialPort>
      getPorts(): Promise<SerialPort[]>
    }
  }
}

export async function printToSerialPort(content: string, port: SerialPort): Promise<boolean> {
  try {
    // Verificar se a porta está aberta
    if (!port.readable || !port.writable) {
      await port.open({ baudRate: 9600 })
    }

    const writer = port.writable?.getWriter()
    if (!writer) {
      throw new Error('Não foi possível obter writer da porta')
    }

    // Converter conteúdo para bytes (ESC/POS)
    const encoder = new TextEncoder()
    
    // Comandos ESC/POS iniciais
    const initCommands = new Uint8Array([
      0x1B, 0x40, // ESC @ - Inicializar impressora
      0x1B, 0x61, 0x01, // ESC a 1 - Centralizar
    ])
    
    await writer.write(initCommands)
    
    // Enviar conteúdo linha por linha
    const lines = content.split('\n')
    for (const line of lines) {
      if (line.trim() === '') {
        // Linha vazia
        await writer.write(encoder.encode('\n'))
      } else if (line.startsWith('=')) {
        // Linha de separação
        await writer.write(new Uint8Array([0x1B, 0x61, 0x01])) // Centralizar
        await writer.write(encoder.encode('-'.repeat(32) + '\n'))
        await writer.write(new Uint8Array([0x1B, 0x61, 0x00])) // Alinhar à esquerda
      } else if (line.includes('CENTRAL DAS PIZZAS') || line.includes('PEDIDO PARA COZINHA') || line.includes('CUPOM FISCAL')) {
        // Título em negrito e centralizado
        await writer.write(new Uint8Array([0x1B, 0x61, 0x01])) // Centralizar
        await writer.write(new Uint8Array([0x1B, 0x45, 0x01])) // Negrito ON
        await writer.write(encoder.encode(line.replace(/[=]/g, '').trim() + '\n'))
        await writer.write(new Uint8Array([0x1B, 0x45, 0x00])) // Negrito OFF
        await writer.write(new Uint8Array([0x1B, 0x61, 0x00])) // Alinhar à esquerda
      } else if (line.includes('TOTAL:') || line.includes('SUBTOTAL:')) {
        // Total em negrito
        await writer.write(new Uint8Array([0x1B, 0x45, 0x01])) // Negrito ON
        await writer.write(encoder.encode(line + '\n'))
        await writer.write(new Uint8Array([0x1B, 0x45, 0x00])) // Negrito OFF
      } else {
        await writer.write(encoder.encode(line + '\n'))
      }
    }
    
    // Comandos finais
    await writer.write(new Uint8Array([
      0x0A, 0x0A, 0x0A, // 3 linhas em branco
      0x1D, 0x56, 0x00, // GS V 0 - Cortar papel (corte parcial)
    ]))
    
    writer.releaseLock()
    
    return true
  } catch (error) {
    console.error('Erro ao imprimir na porta serial:', error)
    throw error
  }
}

/**
 * Solicitar acesso à porta serial e retornar a porta
 */
export async function requestSerialPort(): Promise<SerialPort | null> {
  try {
    if (!('serial' in navigator)) {
      throw new Error('Web Serial API não está disponível neste navegador')
    }

    const port = await (navigator as any).serial.requestPort()
    return port
  } catch (error: any) {
    if (error.name === 'NotFoundError') {
      throw new Error('Nenhuma impressora selecionada')
    } else if (error.name === 'SecurityError') {
      throw new Error('Permissão negada para acessar a impressora')
    }
    throw error
  }
}


