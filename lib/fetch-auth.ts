/**
 * Helper para fazer fetch com autenticação JWT
 */
export async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null
  
  const headers = new Headers(options.headers)
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }
  
  return fetch(url, {
    ...options,
    headers,
  })
}

