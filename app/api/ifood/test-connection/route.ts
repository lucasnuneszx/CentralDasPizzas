import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Verificar se o usuário tem permissão para acessar configurações
    const allowedRoles = ['ADMIN', 'MANAGER']
    if (!allowedRoles.includes(session.user.role as any)) {
      return NextResponse.json(
        { message: 'Sem permissão' },
        { status: 403 }
      )
    }

    const { apiUrl, apiKey, merchantId } = await request.json()

    if (!apiUrl || !apiKey || !merchantId) {
      return NextResponse.json(
        { message: 'URL da API, chave e ID do merchant são obrigatórios' },
        { status: 400 }
      )
    }

    try {
      // Testar conexão com a API do iFood
      const response = await fetch(`${apiUrl}/merchants/${merchantId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000 // 10 segundos de timeout
      })

      if (response.ok) {
        const data = await response.json()
        return NextResponse.json({
          success: true,
          message: 'Conexão estabelecida com sucesso!',
          merchantInfo: {
            name: data.name,
            status: data.status
          }
        })
      } else {
        return NextResponse.json(
          { 
            success: false,
            message: `Erro na API: ${response.status} - ${response.statusText}` 
          },
          { status: 400 }
        )
      }
    } catch (error) {
      console.error('Erro ao testar conexão com iFood:', error)
      return NextResponse.json(
        { 
          success: false,
          message: 'Erro ao conectar com a API do iFood. Verifique as credenciais.' 
        },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Erro ao testar conexão:', error)
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
