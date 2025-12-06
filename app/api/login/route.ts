import { NextResponse } from 'next/server'
import { verifyCredentials, setSession } from '@/lib/auth'

export async function POST(request: Request) {
  console.log('🔐 POST /api/login chamado')
  
  try {
    const body = await request.json()
    console.log('📥 Body recebido:', { email: body.email, hasPassword: !!body.password })
    
    const { email, password } = body
    
    if (!email || !password) {
      console.log('❌ Campos faltando:', { hasEmail: !!email, hasPassword: !!password })
      return NextResponse.json(
        { error: 'Email e senha são obrigatórios' },
        { status: 400 }
      )
    }
    
    console.log('🔍 Verificando credenciais para:', email)
    const user = await verifyCredentials(email, password)
    
    if (!user) {
      console.log('❌ Login falhou: credenciais inválidas para', email)
      return NextResponse.json(
        { error: 'Credenciais inválidas' },
        { status: 401 }
      )
    }
    
    console.log('✅ Login bem-sucedido para:', email, 'userId:', user.id)
    
    // Definir sessão ANTES de retornar resposta
    try {
      setSession(user.id)
      console.log('✅ Sessão definida com sucesso')
    } catch (error) {
      console.error('❌ Erro ao definir sessão:', error)
      return NextResponse.json(
        { error: 'Erro ao criar sessão' },
        { status: 500 }
      )
    }
    
    console.log('📤 Retornando resposta de sucesso')
    // Retornar resposta com headers que garantem funcionamento cross-device
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      }
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': 'true',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Set-Cookie': `admin_session=1; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${60 * 60 * 24 * 7}, user_id=${user.id}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${60 * 60 * 24 * 7}`,
      }
    })
  } catch (error) {
    console.error('❌ Erro inesperado em /api/login:', error)
    return NextResponse.json(
      { error: 'Erro ao processar login' },
      { status: 500 }
    )
  }
}

