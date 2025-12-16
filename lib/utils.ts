import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Mascara um email, mostrando apenas o início e o domínio
 * Exemplo: admin@centraldaspizzas.com -> ad***@centraldaspizzas.com
 */
export function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return email
  const [local, domain] = email.split('@')
  if (local.length <= 2) {
    return `${local[0]}***@${domain}`
  }
  return `${local.substring(0, 2)}***@${domain}`
}

/**
 * Mascara uma senha, mostrando apenas asteriscos
 * Exemplo: 123456 -> ••••••
 */
export function maskPassword(password: string): string {
  if (!password) return ''
  return '•'.repeat(Math.min(password.length, 8))
}

/**
 * Mascara um ID, mostrando apenas os primeiros e últimos caracteres
 * Exemplo: abc123def456 -> abc***456
 */
export function maskId(id: string): string {
  if (!id || id.length <= 6) return '***'
  return `${id.substring(0, 3)}***${id.substring(id.length - 3)}`
}

/**
 * Mascara um nome, mostrando apenas o primeiro nome e inicial do último
 * Exemplo: João Silva -> João S***
 */
export function maskName(name: string): string {
  if (!name) return ''
  const parts = name.trim().split(' ')
  if (parts.length === 1) {
    return `${parts[0].substring(0, 3)}***`
  }
  return `${parts[0]} ${parts[parts.length - 1][0]}***`
}

/**
 * Mascara um telefone, mostrando apenas os últimos dígitos
 * Exemplo: (11) 99999-9999 -> (11) 9****-9999
 */
export function maskPhone(phone: string): string {
  if (!phone) return ''
  // Mantém DDD e últimos 4 dígitos
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.length <= 4) return '***'
  return `(${cleaned.substring(0, 2)}) ${cleaned.substring(2, 3)}****-${cleaned.substring(cleaned.length - 4)}`
}

/**
 * Mascara um CPF, mostrando apenas os últimos dígitos
 * Exemplo: 123.456.789-00 -> ***.***.***-00
 */
export function maskCpf(cpf: string): string {
  if (!cpf) return ''
  const cleaned = cpf.replace(/\D/g, '')
  if (cleaned.length < 4) return '***'
  return `***.***.***-${cleaned.substring(cleaned.length - 2)}`
}


