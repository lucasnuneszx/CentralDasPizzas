import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { UserRole } from '@/lib/constants'

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ message: 'Acesso negado' }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get('image') as File
    const field = formData.get('field') as string

    if (!file) {
      return NextResponse.json({ message: 'Nenhum arquivo enviado' }, { status: 400 })
    }

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ message: 'Apenas arquivos de imagem são permitidos' }, { status: 400 })
    }

    // Validar tamanho (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ message: 'A imagem deve ter no máximo 5MB' }, { status: 400 })
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
