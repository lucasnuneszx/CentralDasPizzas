import { NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth'

export async function GET() {
  try {
    const user = await getAuthenticatedUser()
    
    if (!user) {
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

