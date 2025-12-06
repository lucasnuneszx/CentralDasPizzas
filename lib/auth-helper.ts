import { NextRequest } from 'next/server'
import { getAuthenticatedUser, hasRole, hasAnyRole } from './jwt'

/**
 * Extrai o token do header Authorization
 */
export function getTokenFromRequest(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization')
  return authHeader?.replace('Bearer ', '') || null
}

/**
 * Obtém o usuário autenticado a partir da requisição
 */
export async function getAuthUser(request: NextRequest) {
  const token = getTokenFromRequest(request)
  return await getAuthenticatedUser(token)
}

/**
 * Verifica se o usuário tem uma role específica
 */
export async function checkRole(request: NextRequest, requiredRole: string): Promise<boolean> {
  const token = getTokenFromRequest(request)
  return await hasRole(token, requiredRole)
}

/**
 * Verifica se o usuário tem uma das roles permitidas
 */
export async function checkAnyRole(request: NextRequest, allowedRoles: string[]): Promise<boolean> {
  const token = getTokenFromRequest(request)
  return await hasAnyRole(token, allowedRoles)
}

