'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface User {
  id: string
  email: string
  name: string
  role: string
  isActive: boolean
}

interface AuthState {
  user: User | null
  loading: boolean
  authenticated: boolean
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    authenticated: false,
  })
  const router = useRouter()

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/me', {
        credentials: 'include', // CRÍTICO: Incluir cookies na requisição
        cache: 'no-store', // Não usar cache
      })
      const data = await response.json()

      if (data.authenticated && data.user) {
        setAuthState({
          user: data.user,
          loading: false,
          authenticated: true,
        })
      } else {
        setAuthState({
          user: null,
          loading: false,
          authenticated: false,
        })
      }
    } catch (error) {
      console.error('Error checking auth:', error)
      setAuthState({
        user: null,
        loading: false,
        authenticated: false,
      })
    }
  }

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // CRÍTICO: Incluir cookies na requisição
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (data.success && data.user) {
        setAuthState({
          user: data.user,
          loading: false,
          authenticated: true,
        })
        return { success: true, user: data.user }
      } else {
        return { success: false, error: data.error || 'Erro ao fazer login' }
      }
    } catch (error) {
      console.error('Error in login:', error)
      return { success: false, error: 'Erro ao conectar com o servidor' }
    }
  }

  const logout = async () => {
    try {
      await fetch('/api/logout', { 
        method: 'POST',
        credentials: 'include', // CRÍTICO: Incluir cookies na requisição
      })
      setAuthState({
        user: null,
        loading: false,
        authenticated: false,
      })
      router.push('/auth/signin')
    } catch (error) {
      console.error('Error in logout:', error)
    }
  }

  return {
    ...authState,
    login,
    logout,
    refresh: checkAuth,
  }
}

