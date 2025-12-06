'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import toast from 'react-hot-toast'
import { useAuth } from '@/hooks/useAuth'

// Forçar renderização dinâmica - desabilitar cache completamente
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'
export const runtime = 'nodejs'

// Versão única para forçar atualização
const BUILD_VERSION = `v5.3-${Date.now()}-${Math.random().toString(36).substring(7)}`

export default function SignIn() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { login } = useAuth()

  // Forçar atualização do cache do navegador
  useEffect(() => {
    // Limpar cache do Service Worker se existir
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => registration.unregister())
      })
    }
    
    // Limpar cache do navegador
    if ('caches' in window) {
      caches.keys().then((names) => {
        names.forEach((name) => caches.delete(name))
      })
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (isLoading) return
    
    setIsLoading(true)

    try {
      const result = await login(email, password)

      if (result.success) {
        toast.success('Login realizado com sucesso!')
        router.push('/dashboard')
        router.refresh()
      } else {
        toast.error(result.error || 'Email ou senha incorretos')
      }
    } catch (error) {
      console.error('Erro ao fazer login:', error)
      toast.error('Erro ao conectar com o servidor. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Central Das Pizzas</h1>
          <p className="mt-2 text-sm text-gray-600">Sistema PDV</p>
          <p className="mt-1 text-xs text-gray-400">v5.1 - JWT Auth System</p>
          <p className="mt-0.5 text-xs text-gray-300">Build: {BUILD_VERSION}</p>
          <p className="mt-0.5 text-xs text-gray-200">Time: {new Date().toISOString()}</p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Entrar</CardTitle>
            <CardDescription>
              Digite suas credenciais para acessar o sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="admin@centraldaspizzas.com"
                  autoComplete="email"
                />
              </div>
              
              <div>
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Digite sua senha"
                  autoComplete="current-password"
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading}
              >
                {isLoading ? 'Entrando...' : 'Entrar'}
              </Button>
            </form>
            
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-600">
                Não tem uma conta?{' '}
                <Link 
                  href="/auth/signup" 
                  className="text-primary hover:underline"
                >
                  Cadastre-se
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
