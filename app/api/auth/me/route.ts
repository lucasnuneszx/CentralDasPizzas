import { NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/jwt'

// Forçar renderização dinâmica - sem cache
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '') || null
    
    const user = await getAuthenticatedUser(token)
    
    if (!user) {
      return NextResponse.json(
        { authenticated: false },
        { status: 401 }
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
      },
    })
  } catch (error) {
    console.error('Error in /api/auth/me:', error)
    return NextResponse.json(
      { error: 'Erro ao verificar autenticação' },
      { status: 500 }
    )
  }
}

