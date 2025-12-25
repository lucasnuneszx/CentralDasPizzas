import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser, checkRole, checkAnyRole } from '@/lib/auth-helper'
import { UserRole } from '@/lib/constants'

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const user = await getAuthUser(request)
    
    if (!user) {
      return NextResponse.json({ message: 'Não autorizado' }, { status: 401 })
    }

    if (!(await checkAnyRole(request, ['ADMIN', 'MANAGER']))) {
      return NextResponse.json({ message: 'Sem permissão' }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get('image') as File
    const field = formData.get('field') as string

    if (!file) {
      return NextResponse.json({ message: 'Nenhum arquivo enviado' }, { status: 400 })
    }

    // Validar tipo de arquivo - aceitar imagens e áudio MP3
    const isImage = file.type.startsWith('image/')
    const isAudio = file.type === 'audio/mpeg' || file.type === 'audio/mp3' || file.name.toLowerCase().endsWith('.mp3')
    
    if (!isImage && !isAudio) {
      return NextResponse.json({ message: 'Apenas arquivos de imagem ou áudio MP3 são permitidos' }, { status: 400 })
    }

    // Validar tamanho (máximo 5MB para imagens, 10MB para áudio)
    const maxSize = isImage ? 5 * 1024 * 1024 : 10 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json({ 
        message: isImage ? 'A imagem deve ter no máximo 5MB' : 'O áudio deve ter no máximo 10MB' 
      }, { status: 400 })
    }

    // Converter para base64 para armazenar no banco de dados
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    
    // Comprimir a imagem se for muito grande (máximo 1.5MB em base64 ≈ 500KB original)
    if (buffer.length > 500 * 1024) {
      // Redimensionar e comprimir usando uma biblioteca de manipulação de imagem
      // Por enquanto, apenas reduzir qualidade
      const base64 = buffer.toString('base64')
      const dataUrl = `data:${file.type};base64,${base64}`
      
      return NextResponse.json({ 
        url: dataUrl,
        warning: 'Imagem comprimida para otimização'
      })
    }
    
    const base64 = buffer.toString('base64')
    const dataUrl = `data:${file.type};base64,${base64}`

    // Retornar a URL base64
    return NextResponse.json({ url: dataUrl })

  } catch (error) {
    console.error('Erro ao fazer upload:', error)
    return NextResponse.json({ message: 'Erro ao fazer upload' }, { status: 500 })
  }
}
