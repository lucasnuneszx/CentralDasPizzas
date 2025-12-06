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
        headers: {
          'Authorization': `Bearer ${token}`,
        },
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
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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
    localStorage.removeItem(TOKEN_KEY)
    setAuthState({
      user: null,
      loading: false,
      authenticated: false,
    })
    router.push('/auth/signin')
  }

  const getToken = () => {
    if (typeof window === 'undefined') return null
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

