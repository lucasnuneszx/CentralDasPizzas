import { cookies } from 'next/headers'
import bcrypt from 'bcryptjs'
import { prisma } from './prisma'

// Re-exportar funções de hash/verify que já existiam
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

const SESSION_COOKIE = 'admin_session'
const USER_ID_COOKIE = 'user_id'

/**
 * Verifica credenciais de login
 */
export async function verifyCredentials(email: string, password: string) {
  try {
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) return null
    
    if (!user.password) return null
    if (!user.isActive) return null
    
    const isValid = await bcrypt.compare(password, user.password)
    if (!isValid) return null
    
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    }
  } catch (error) {
    console.error('Error verifying credentials:', error)
    return null
  }
}

/**
 * Define a sessão do usuário após login bem-sucedido
 * Configuração otimizada para funcionar em todos os dispositivos
 */
export function setSession(userId: string) {
  // Railway sempre usa HTTPS, então sempre usar secure: true
  // Usar 'lax' que funciona na maioria dos casos e é mais compatível
  const cookieOptions: any = {
    httpOnly: true,
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 dias
    secure: true, // Sempre true em Railway (HTTPS)
    sameSite: 'lax' as const, // Mais compatível que 'none'
  }
  
  try {
    cookies().set(SESSION_COOKIE, '1', cookieOptions)
    cookies().set(USER_ID_COOKIE, userId, cookieOptions)
    console.log('✅ Cookies definidos com sucesso para userId:', userId)
  } catch (error) {
    console.error('❌ Erro ao definir cookies:', error)
    throw error
  }
}

/**
 * Remove a sessão do usuário (logout)
 * Garante que os cookies sejam removidos corretamente
 */
export function clearSession() {
  const cookieOptions: any = {
    httpOnly: true,
    path: '/',
    secure: true,
    sameSite: 'lax' as const,
    maxAge: 0, // Expira imediatamente
  }
  
  try {
    cookies().set(SESSION_COOKIE, '', cookieOptions)
    cookies().set(USER_ID_COOKIE, '', cookieOptions)
    cookies().delete(SESSION_COOKIE)
    cookies().delete(USER_ID_COOKIE)
    console.log('✅ Cookies removidos com sucesso')
  } catch (error) {
    console.error('❌ Erro ao remover cookies:', error)
  }
}

/**
 * Verifica se o usuário está autenticado
 */
export function isAuthenticated(): boolean {
  return cookies().get(SESSION_COOKIE)?.value === '1'
}

/**
 * Obtém o ID do usuário autenticado
 */
export function getUserId(): string | null {
  return cookies().get(USER_ID_COOKIE)?.value || null
}

/**
 * Obtém o usuário autenticado completo do banco de dados
 */
export async function getAuthenticatedUser() {
  try {
    if (!isAuthenticated()) return null
    
    const userId = getUserId()
    if (!userId) return null
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
      }
    })
    
    if (!user || !user.isActive) {
      clearSession()
      return null
    }
    
    return user
  } catch (error) {
    console.error('Error getting authenticated user:', error)
    return null
  }
}

/**
 * Verifica se o usuário tem uma role específica
 */
export async function hasRole(requiredRole: string): Promise<boolean> {
  const user = await getAuthenticatedUser()
  if (!user) return false
  
  // ADMIN tem acesso a tudo
  if (user.role === 'ADMIN') return true
  
  return user.role === requiredRole
}

/**
 * Verifica se o usuário tem uma das roles permitidas
 */
export async function hasAnyRole(allowedRoles: string[]): Promise<boolean> {
  const user = await getAuthenticatedUser()
  if (!user) return false
  
  // ADMIN tem acesso a tudo
  if (user.role === 'ADMIN') return true
  
  return allowedRoles.includes(user.role)
}
