import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser, checkAnyRole } from '@/lib/auth-helper'

/**
 * Rota para processar imagem de cardápio usando OCR/IA
 * Extrai informações como nome, descrição e preço dos itens
 */
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const user = await getAuthUser(request)
    
    if (!user) {
      return NextResponse.json(
        { message: 'Não autorizado' },
        { status: 401 }
      )
    }

    if (!(await checkAnyRole(request, ['ADMIN', 'MANAGER']))) {
      return NextResponse.json(
        { message: 'Sem permissão' },
        { status: 403 }
      )
    }

    const formData = await request.formData()
    const imageFile = formData.get('image') as File

    if (!imageFile) {
      return NextResponse.json(
        { message: 'Nenhuma imagem fornecida' },
        { status: 400 }
      )
    }

    // Validar tipo de arquivo
    if (!imageFile.type.startsWith('image/')) {
      return NextResponse.json(
        { message: 'Apenas arquivos de imagem são permitidos' },
        { status: 400 }
      )
    }

    // Converter imagem para base64
    const bytes = await imageFile.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64Image = buffer.toString('base64')
    const imageDataUrl = `data:${imageFile.type};base64,${base64Image}`

    // Usar OpenAI Vision API ou Google Vision API para extrair texto
    // Por enquanto, vamos usar uma API de OCR gratuita ou Tesseract
    // Vou criar uma função que usa OpenAI se disponível, senão usa Tesseract via API
    
    const extractedText = await extractTextFromImage(base64Image, imageFile.type)
    
    // Processar texto extraído para identificar itens do cardápio
    const menuItems = parseMenuText(extractedText)

    return NextResponse.json({
      success: true,
      extractedText,
      menuItems,
      imagePreview: imageDataUrl,
      count: menuItems.length
    })
  } catch (error: any) {
    console.error('Erro ao processar imagem:', error)
    return NextResponse.json(
      { 
        success: false,
        message: 'Erro ao processar imagem',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}

/**
 * Extrai texto de uma imagem usando OCR
 * Tenta usar OpenAI Vision primeiro, depois fallback para Tesseract
 */
async function extractTextFromImage(base64Image: string, mimeType: string): Promise<string> {
  // Tentar usar OpenAI Vision API se disponível
  const openaiApiKey = process.env.OPENAI_API_KEY
  
  if (openaiApiKey) {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: 'Extraia todo o texto desta imagem de cardápio. Retorne apenas o texto puro, sem formatação adicional. Se houver preços, mantenha-os junto com os itens.'
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:${mimeType};base64,${base64Image}`
                  }
                }
              ]
            }
          ],
          max_tokens: 2000
        })
      })

      if (response.ok) {
        const data = await response.json()
        return data.choices[0]?.message?.content || ''
      }
    } catch (error) {
      console.warn('Erro ao usar OpenAI Vision, tentando alternativa...', error)
    }
  }

  // Fallback: Usar Tesseract.js via API externa ou processar no servidor
  // Por enquanto, retornar uma mensagem indicando que precisa configurar API
  throw new Error('Configure OPENAI_API_KEY no .env para usar OCR com IA, ou implemente Tesseract.js no servidor')
}

/**
 * Processa texto extraído e identifica itens do cardápio
 * Procura por padrões como: nome, descrição, preço
 */
function parseMenuText(text: string): Array<{
  name: string
  description?: string
  price?: number
  confidence: number
}> {
  const items: Array<{
    name: string
    description?: string
    price?: number
    confidence: number
  }> = []

  // Dividir texto em linhas
  const lines = text.split('\n').filter(line => line.trim().length > 0)

  let currentItem: {
    name: string
    description?: string
    price?: number
    confidence: number
  } | null = null

  for (const line of lines) {
    const trimmedLine = line.trim()
    
    // Procurar por padrões de preço (R$, R$, números com vírgula/ponto)
    const priceMatch = trimmedLine.match(/(?:R\$\s*)?([\d.,]+)/)
    const price = priceMatch ? parseFloat(priceMatch[1].replace(',', '.')) : null

    // Se a linha contém um preço, provavelmente é um item
    if (price && price > 0 && price < 1000) {
      // Se já temos um item em construção, finalizar ele
      if (currentItem) {
        items.push(currentItem)
      }

      // Extrair nome (tudo antes do preço)
      const namePart = trimmedLine.substring(0, priceMatch.index).trim()
      
      currentItem = {
        name: namePart || 'Item sem nome',
        price: price,
        confidence: 0.7
      }
    } else if (currentItem) {
      // Se não tem preço mas temos um item, pode ser descrição
      if (!currentItem.description) {
        currentItem.description = trimmedLine
      } else {
        // Se já tem descrição, finalizar item e começar novo
        items.push(currentItem)
        currentItem = {
          name: trimmedLine,
          confidence: 0.5
        }
      }
    } else if (trimmedLine.length > 3) {
      // Linha sem preço pode ser início de novo item
      currentItem = {
        name: trimmedLine,
        confidence: 0.4
      }
    }
  }

  // Adicionar último item se existir
  if (currentItem) {
    items.push(currentItem)
  }

  // Filtrar itens muito curtos ou sem sentido
  return items.filter(item => 
    item.name.length >= 3 && 
    (!item.price || (item.price > 0 && item.price < 1000))
  )
}

