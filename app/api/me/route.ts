import { NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth'

export async function GET() {
  try {
    // Debug: verificar cookies recebidos
    const cookieHeader = await import('next/headers').then(m => m.cookies())
    const sessionCookie = cookieHeader.get('admin_session')
    const userIdCookie = cookieHeader.get('user_id')
    
    console.log('🔍 /api/me - Cookies recebidos:', {
      hasSession: !!sessionCookie,
      hasUserId: !!userIdCookie,
      userIdValue: userIdCookie?.value,
    })
    
    const user = await getAuthenticatedUser()
    
    if (!user) {
      console.log('❌ /api/me - Usuário não autenticado')
      return NextResponse.json(
        { authenticated: false, message: 'Usuário não autenticado' },
        { 
          status: 401,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Credentials': 'true',
            'Cache-Control': 'no-store, no-cache, must-revalidate',
          }
        }
      )
    }
    
    console.log('✅ /api/me - Usuário autenticado:', user.email)
    
    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isActive: user.isActive,
      }
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': 'true',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      }
    })
  } catch (error) {
    console.error('Error in /api/me:', error)
    return NextResponse.json(
      { error: 'Erro ao verificar autenticação' },
      { status: 500 }
    )
  }
}

