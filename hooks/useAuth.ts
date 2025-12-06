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

const TOKEN_KEY = 'auth_token'

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
      // Verificar se localStorage está disponível (compatibilidade com todos os dispositivos)
      if (typeof window === 'undefined' || !window.localStorage) {
        setAuthState({
          user: null,
          loading: false,
          authenticated: false,
        })
        return
      }

      const token = localStorage.getItem(TOKEN_KEY)
      if (!token) {
        setAuthState({
          user: null,
          loading: false,
          authenticated: false,
        })
        return
      }

      const response = await fetch('/api/auth/me', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
        cache: 'no-store',
      })

      const data = await response.json()

      if (data.authenticated && data.user) {
        setAuthState({
          user: data.user,
          loading: false,
          authenticated: true,
        })
      } else {
        localStorage.removeItem(TOKEN_KEY)
        setAuthState({
          user: null,
          loading: false,
          authenticated: false,
        })
      }
    } catch (error) {
      console.error('Error checking auth:', error)
      localStorage.removeItem(TOKEN_KEY)
      setAuthState({
        user: null,
        loading: false,
        authenticated: false,
      })
    }
  }

  const login = async (email: string, password: string) => {
    try {
      // Verificar se localStorage está disponível
      if (typeof window === 'undefined' || !window.localStorage) {
        return { success: false, error: 'LocalStorage não disponível neste dispositivo' }
      }

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
        cache: 'no-store',
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (data.success && data.token && data.user) {
        localStorage.setItem(TOKEN_KEY, data.token)
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
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem(TOKEN_KEY)
    }
    setAuthState({
      user: null,
      loading: false,
      authenticated: false,
    })
    router.push('/auth/signin')
  }

  const getToken = () => {
    if (typeof window === 'undefined' || !window.localStorage) return null
    return localStorage.getItem(TOKEN_KEY)
  }

  return {
    ...authState,
    login,
    logout,
    refresh: checkAuth,
    getToken,
  }
}

