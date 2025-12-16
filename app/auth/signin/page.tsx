'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import toast from 'react-hot-toast'
import { useAuth } from '@/hooks/useAuth'
import { ArrowLeft, ChefHat, Pizza } from 'lucide-react'
import Image from 'next/image'

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
  const [settings, setSettings] = useState<any>(null)
  const router = useRouter()
  const { login } = useAuth()

  // Buscar configurações para obter o logo
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/settings')
        if (response.ok) {
          const data = await response.json()
          setSettings(data)
        }
      } catch (error) {
        console.error('Erro ao carregar configurações:', error)
      }
    }
    fetchSettings()
  }, [])

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
    <div className="min-h-screen flex bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50">
      {/* Seção Esquerda - Ilustração/Visual (oculta em mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-red-100 via-orange-100 to-yellow-100">
        <div className="absolute inset-0 flex items-center justify-center p-12">
          {/* Ilustração decorativa */}
          <div className="relative w-full h-full max-w-lg">
            {/* Nuvem decorativa no topo */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/30 rounded-full blur-3xl"></div>
            
            {/* Elementos decorativos de pizza */}
            <div className="absolute top-20 left-10 transform rotate-12 auth-illustration">
              <div className="w-32 h-32 bg-red-400/20 rounded-full flex items-center justify-center">
                <Pizza className="w-16 h-16 text-red-500" />
              </div>
            </div>
            
            <div className="absolute bottom-32 right-20 transform -rotate-12 auth-illustration-delayed">
              <div className="w-40 h-40 bg-orange-400/20 rounded-full flex items-center justify-center">
                <ChefHat className="w-20 h-20 text-orange-500" />
              </div>
            </div>
            
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div className="w-64 h-64 bg-yellow-400/20 rounded-full flex items-center justify-center">
                <div className="text-center">
                  {settings?.profileLogo ? (
                    <div className="w-32 h-32 mx-auto mb-4 relative">
                      {settings.profileLogo.startsWith('data:') ? (
                        <img
                          src={settings.profileLogo}
                          alt="Logo"
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <Image
                          src={settings.profileLogo}
                          alt="Logo"
                          fill
                          className="object-contain"
                          sizes="128px"
                        />
                      )}
                    </div>
                  ) : (
                    <Pizza className="w-24 h-24 text-red-500 mx-auto mb-4" />
                  )}
                  <h2 className="text-5xl font-bold text-gray-800">Central Das Pizzas</h2>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Seção Direita - Formulário */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-8 lg:p-12">
        <div className="w-full max-w-md">
          {/* Logo e botão voltar (mobile) */}
          <div className="mb-8 lg:mb-12">
            <div className="flex items-center justify-between mb-6">
              <Link href="/" className="lg:hidden">
                <Button variant="ghost" size="sm" className="text-gray-600">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar
                </Button>
              </Link>
              <div className="lg:hidden text-center flex-1">
                <h1 className="text-2xl font-bold text-red-600">Central Das Pizzas</h1>
              </div>
              <div className="w-16"></div>
            </div>
          </div>

          {/* Card do Formulário */}
          <Card className="bg-white shadow-xl border-0 rounded-2xl">
            <CardContent className="p-8 sm:p-10">
              {/* Título */}
              <div className="mb-8">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 text-center">
                  Entrar no sistema
                </h2>
                <p className="text-sm text-gray-500 text-center">
                  Digite suas credenciais para acessar
                </p>
              </div>

              {/* Formulário */}
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="Informe o seu e-mail"
                    autoComplete="email"
                    className="h-12 border-gray-300 focus:border-red-500 focus:ring-red-500 rounded-lg text-base"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                    Senha
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="Digite sua senha"
                    autoComplete="current-password"
                    className="h-12 border-gray-300 focus:border-red-500 focus:ring-red-500 rounded-lg text-base"
                  />
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full h-12 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold rounded-lg text-base shadow-lg transition-all duration-200 transform hover:scale-[1.02]" 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Entrando...
                    </span>
                  ) : (
                    'Continuar'
                  )}
                </Button>
              </form>
              
              {/* Link para cadastro */}
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  Não tem uma conta?{' '}
                  <Link 
                    href="/auth/signup" 
                    className="text-red-600 font-semibold hover:text-red-700 hover:underline transition-colors"
                  >
                    Cadastre-se
                  </Link>
                </p>
              </div>

              {/* Mensagem de privacidade */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-xs text-gray-500 text-center leading-relaxed">
                  Ao continuar, você concorda com nossos termos de uso e política de privacidade.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
