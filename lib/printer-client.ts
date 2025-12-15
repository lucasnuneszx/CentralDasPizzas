/**
 * Função para imprimir usando Web Serial API (client-side)
 * Funciona apenas no navegador quando a impressora está conectada via USB
 * Otimizado para impressora Elgin i8
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
    // Elgin i8 usa 9600 baud rate por padrão
    if (!port.readable || !port.writable) {
      await port.open({ baudRate: 9600 })
    }

    const writer = port.writable?.getWriter()
    if (!writer) {
      throw new Error('Não foi possível obter writer da porta')
    }

    // Converter conteúdo para bytes (ESC/POS)
    const encoder = new TextEncoder()
    
    // Comandos ESC/POS iniciais otimizados para Elgin i8
    // ESC @ - Inicializar impressora (reset)
    // ESC a 0 - Alinhar à esquerda
    // ESC ! 0 - Fonte normal
    const initCommands = new Uint8Array([
      0x1B, 0x40, // ESC @ - Inicializar impressora (Elgin i8)
      0x1B, 0x61, 0x00, // ESC a 0 - Alinhar à esquerda
      0x1B, 0x21, 0x00, // ESC ! 0 - Fonte normal
    ])
    
    await writer.write(initCommands)
    
    // Pequeno delay para garantir que a impressora processou o comando
    await new Promise(resolve => setTimeout(resolve, 50))
    
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
    
    // Comandos finais otimizados para Elgin i8
    // Avançar papel antes de cortar
    await writer.write(new Uint8Array([
      0x0A, 0x0A, 0x0A, // 3 linhas em branco
    ]))
    
    // Comando de corte para Elgin i8
    // GS V 0 - Cortar papel (corte parcial)
    // Alternativa: GS V 1 - Corte total (se necessário)
    await writer.write(new Uint8Array([
      0x1D, 0x56, 0x00, // GS V 0 - Cortar papel (corte parcial - Elgin i8)
    ]))
    
    // Garantir que todos os dados foram enviados
    await new Promise(resolve => setTimeout(resolve, 100))
    
    writer.releaseLock()
    
    return true
  } catch (error) {
    console.error('Erro ao imprimir na porta serial:', error)
    throw error
  }
}

/**
 * Solicitar acesso à porta serial e retornar a porta
 * Permite filtrar por dispositivos USB específicos
 */
export async function requestSerialPort(filters?: SerialPortFilter[]): Promise<SerialPort | null> {
  try {
    if (!('serial' in navigator)) {
      throw new Error('Web Serial API não está disponível neste navegador')
    }

    const requestOptions: any = {}
    if (filters && filters.length > 0) {
      requestOptions.filters = filters
    }

    const port = await (navigator as any).serial.requestPort(requestOptions)
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

/**
 * Interface para filtros de porta serial
 */
export interface SerialPortFilter {
  usbVendorId?: number
  usbProductId?: number
}

/**
 * Descobrir todas as impressoras USB disponíveis no sistema
 * Abre o diálogo de seleção do navegador para o usuário escolher
 */
export async function discoverPrinters(): Promise<SerialPort[]> {
  try {
    if (!('serial' in navigator)) {
      throw new Error('Web Serial API não está disponível neste navegador')
    }

    const discoveredPorts: SerialPort[] = []
    
    // Tentar descobrir impressoras comuns (Elgin, Bematech, Epson, etc)
    // Nota: A Web Serial API requer interação do usuário, então vamos
    // abrir o diálogo de seleção sem filtros para mostrar todas as opções
    try {
      const port = await (navigator as any).serial.requestPort({
        // Sem filtros para mostrar todas as portas disponíveis
      })
      discoveredPorts.push(port)
    } catch (error: any) {
      if (error.name !== 'NotFoundError') {
        throw error
      }
    }

    return discoveredPorts
  } catch (error) {
    console.error('Erro ao descobrir impressoras:', error)
    throw error
  }
}

/**
 * Listar todas as portas USB/seriais disponíveis que já foram autorizadas
 */
export async function getAvailablePorts(): Promise<SerialPort[]> {
  try {
    if (!('serial' in navigator)) {
      return []
    }

    const ports = await (navigator as any).serial.getPorts()
    return ports
  } catch (error) {
    console.error('Erro ao listar portas disponíveis:', error)
    return []
  }
}

/**
 * Solicitar acesso a uma impressora USB específica usando filtros
 * Útil para descobrir impressoras Elgin i8 ou outras marcas conhecidas
 */
export async function requestPrinterWithFilter(vendorId?: number, productId?: number): Promise<SerialPort | null> {
  try {
    if (!('serial' in navigator)) {
      throw new Error('Web Serial API não está disponível neste navegador')
    }

    const filters: SerialPortFilter[] = []
    if (vendorId) {
      filters.push({ usbVendorId: vendorId })
      if (productId) {
        filters[0].usbProductId = productId
      }
    }

    const port = await requestSerialPort(filters.length > 0 ? filters : undefined)
    return port
  } catch (error: any) {
    if (error.name === 'NotFoundError') {
      throw new Error('Nenhuma impressora encontrada com os filtros especificados')
    }
    throw error
  }
}

/**
 * Obter informações detalhadas de uma porta USB
 */
export function getPortInfo(port: SerialPort): {
  vendorId?: number
  productId?: number
  name?: string
} {
  try {
    const info = port.getInfo()
    const vendorId = info.usbVendorId
    const productId = info.usbProductId
    
    // Identificar se é Elgin i8 baseado nos IDs USB conhecidos
    // Nota: IDs podem variar, mas podemos adicionar lógica de detecção
    let printerName = 'Impressora USB'
    if (vendorId && productId) {
      // Elgin geralmente usa vendor IDs específicos
      // Se conhecermos o vendor ID da Elgin, podemos identificar
      printerName = `Elgin i8 (Vendor: 0x${vendorId.toString(16).toUpperCase().padStart(4, '0')}, Product: 0x${productId.toString(16).toUpperCase().padStart(4, '0')})`
    }
    
    return {
      vendorId,
      productId,
      name: printerName
    }
  } catch (error) {
    console.error('Erro ao obter informações da porta:', error)
    return {}
  }
}


