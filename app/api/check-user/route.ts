import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({
        authenticated: false,
        message: 'Usuário não autenticado'
      })
    }

    // Buscar dados completos do usuário
    const user = await prisma.user.findUnique({
      where: { email: session.user.email || '' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true
      }
    })

    if (!user) {
      return NextResponse.json({
        authenticated: false,
        message: 'Usuário não encontrado no banco de dados'
      })
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive
      },
      session: {
        user: session.user,
        expires: session.expires
      }
    })

  } catch (error) {
    console.error('Erro ao verificar usuário:', error)
    return NextResponse.json({
      authenticated: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}
