import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, hasRole, hasAnyRole } from './auth'

/**
 * Helper para verificar autenticação em rotas de API
 * Retorna o usuário autenticado ou null
 */
export async function requireAuth(request?: NextRequest) {
  const user = await getAuthenticatedUser()
  return user
}

/**
 * Helper para verificar se o usuário tem uma role específica
 * Retorna o usuário ou uma resposta de erro
 */
export async function requireRole(role: string) {
  const user = await getAuthenticatedUser()
  
  if (!user) {
    return {
      error: NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      ),
      user: null,
    }
  }
  
  const hasAccess = await hasRole(role)
  if (!hasAccess) {
    return {
      error: NextResponse.json(
        { error: 'Acesso negado' },
        { status: 403 }
      ),
      user: null,
    }
  }
  
  return { error: null, user }
}

/**
 * Helper para verificar se o usuário tem uma das roles permitidas
 * Retorna o usuário ou uma resposta de erro
 */
export async function requireAnyRole(roles: string[]) {
  const user = await getAuthenticatedUser()
  
  if (!user) {
    return {
      error: NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      ),
      user: null,
    }
  }
  
  const hasAccess = await hasAnyRole(roles)
  if (!hasAccess) {
    return {
      error: NextResponse.json(
        { error: 'Acesso negado' },
        { status: 403 }
      ),
      user: null,
    }
  }
  
  return { error: null, user }
}

