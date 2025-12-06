import jwt from 'jsonwebtoken'
import { prisma } from './prisma'

const JWT_SECRET = process.env.JWT_SECRET || 'central-das-pizzas-secret-key-change-in-production'

export interface TokenPayload {
  userId: string
  email: string
  role: string
}

/**
 * Gera um token JWT para o usuário
 */
export function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: '7d',
  })
}

/**
 * Verifica e decodifica um token JWT
 */
export function verifyToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload
    return decoded
  } catch (error) {
    return null
  }
}

/**
 * Obtém o usuário autenticado a partir do token
 */
export async function getAuthenticatedUser(token: string | null) {
  if (!token) return null

  const payload = verifyToken(token)
  if (!payload) return null

  try {
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
      },
    })

    if (!user || !user.isActive) return null

    return user
  } catch (error) {
    console.error('Error getting user:', error)
    return null
  }
}

/**
 * Verifica se o usuário tem uma role específica
 */
export async function hasRole(token: string | null, requiredRole: string): Promise<boolean> {
  const user = await getAuthenticatedUser(token)
  if (!user) return false
  
  if (user.role === 'ADMIN') return true
  return user.role === requiredRole
}

/**
 * Verifica se o usuário tem uma das roles permitidas
 */
export async function hasAnyRole(token: string | null, allowedRoles: string[]): Promise<boolean> {
  const user = await getAuthenticatedUser(token)
  if (!user) return false
  
  if (user.role === 'ADMIN') return true
  return allowedRoles.includes(user.role)
}

