'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import toast from 'react-hot-toast'

export default function SignIn() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        console.error('Erro no login:', result.error)
        // Mensagens mais específicas baseadas no erro
        if (result.error === 'CredentialsSignin') {
          toast.error('Email ou senha incorretos. Verifique suas credenciais.')
        } else {
          toast.error(`Erro: ${result.error}`)
        }
      } else if (result?.ok) {
        toast.success('Login realizado com sucesso!')
        router.push('/dashboard')
      } else {
        toast.error('Erro desconhecido ao fazer login')
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
      <div className="max-w-md w-full space-y-8 fade-in">
        <div className="text-center slide-in">
          <h1 className="text-3xl font-bold text-gray-900 hover-lift">Central Das Pizzas</h1>
          <p className="mt-2 text-sm text-gray-600 fade-in">Sistema PDV</p>
        </div>
        
        <Card className="card-hover">
          <CardHeader className="slide-in">
            <CardTitle className="bounce-in">Entrar</CardTitle>
            <CardDescription className="fade-in">
              Digite suas credenciais para acessar o sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="slide-in">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="fade-in">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="admin@centraldaspizzas.com"
                  className="input-focus"
                  autoComplete="email"
                />
              </div>
              
              <div className="fade-in">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Digite sua senha"
                  className="input-focus"
                  autoComplete="current-password"
                />
              </div>
              
              <div className="text-xs text-gray-500 text-center">
                <p>Primeira vez? Acesse: <a href="/api/setup/create-users" target="_blank" className="text-blue-500 hover:underline">/api/setup/create-users</a> para criar usuários</p>
              </div>
              
              <Button 
                type="submit" 
                className="w-full button-hover gradient-hover" 
                disabled={isLoading}
              >
                {isLoading ? 'Entrando...' : 'Entrar'}
              </Button>
            </form>
            
            <div className="mt-4 text-center fade-in">
              <p className="text-sm text-gray-600">
                Não tem uma conta?{' '}
                <Link 
                  href="/auth/signup" 
                  className="text-primary hover:underline hover:text-primary/80 transition-colors duration-200"
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



