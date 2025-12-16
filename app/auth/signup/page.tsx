'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import toast from 'react-hot-toast'
import { ArrowLeft, ChefHat, Pizza } from 'lucide-react'

export default function SignUp() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    cpf: '',
  })
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Validações
    if (!formData.name || !formData.email || !formData.password) {
      toast.error('Preencha todos os campos obrigatórios')
      setIsLoading(false)
      return
    }

    if (formData.password.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres')
      setIsLoading(false)
      return
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('As senhas não coincidem')
      setIsLoading(false)
      return
    }

    try {
      // Enviar senha em texto plano (o backend fará o hash)
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password, // Senha em texto plano - backend fará hash
          phone: formData.phone || null,
          cpf: formData.cpf || null,
        }),
      })

      const data = await response.json()
      
      if (response.ok) {
        toast.success('Conta criada com sucesso!')
        setTimeout(() => {
          router.push('/auth/signin')
        }, 1000)
      } else {
        toast.error(data.message || 'Erro ao criar conta')
        console.error('Erro no registro:', data)
      }
    } catch (error) {
      console.error('Erro ao criar conta:', error)
      toast.error('Erro ao conectar com o servidor. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
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
            
            {/* Elementos decorativos */}
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
              <div className="w-48 h-48 bg-yellow-400/20 rounded-full flex items-center justify-center">
                <div className="text-center">
                  <ChefHat className="w-24 h-24 text-red-500 mx-auto mb-2" />
                  <h2 className="text-3xl font-bold text-gray-800">Central Das Pizzas</h2>
                  <p className="text-gray-600 mt-2">Crie sua conta</p>
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
              <Link href="/auth/signin" className="lg:hidden">
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
                  Criar conta
                </h2>
                <p className="text-sm text-gray-500 text-center">
                  Preencha os dados para criar sua conta
                </p>
              </div>

              {/* Formulário */}
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                    Nome Completo
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="Seu nome completo"
                    className="h-12 border-gray-300 focus:border-red-500 focus:ring-red-500 rounded-lg text-base"
                  />
                </div>
              
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                    Email
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="seu@email.com"
                    className="h-12 border-gray-300 focus:border-red-500 focus:ring-red-500 rounded-lg text-base"
                  />
                </div>
              
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                    Telefone
                  </Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="(11) 99999-9999"
                    className="h-12 border-gray-300 focus:border-red-500 focus:ring-red-500 rounded-lg text-base"
                  />
                </div>
              
                <div className="space-y-2">
                  <Label htmlFor="cpf" className="text-sm font-medium text-gray-700">
                    CPF <span className="text-gray-400 font-normal">(Opcional)</span>
                  </Label>
                  <Input
                    id="cpf"
                    name="cpf"
                    type="text"
                    value={formData.cpf}
                    onChange={handleChange}
                    placeholder="000.000.000-00"
                    className="h-12 border-gray-300 focus:border-red-500 focus:ring-red-500 rounded-lg text-base"
                  />
                </div>
              
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                    Senha
                  </Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    placeholder="Sua senha"
                    className="h-12 border-gray-300 focus:border-red-500 focus:ring-red-500 rounded-lg text-base"
                  />
                </div>
              
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                    Confirmar Senha
                  </Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    placeholder="Confirme sua senha"
                    className="h-12 border-gray-300 focus:border-red-500 focus:ring-red-500 rounded-lg text-base"
                  />
                </div>
              
                <Button 
                  type="submit" 
                  className="w-full h-12 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold rounded-lg text-base shadow-lg transition-all duration-200 transform hover:scale-[1.02] mt-6" 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Criando conta...
                    </span>
                  ) : (
                    'Criar Conta'
                  )}
                </Button>
              </form>
            
              {/* Link para login */}
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  Já tem uma conta?{' '}
                  <Link 
                    href="/auth/signin" 
                    className="text-red-600 font-semibold hover:text-red-700 hover:underline transition-colors"
                  >
                    Faça login
                  </Link>
                </p>
              </div>

              {/* Mensagem de privacidade */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-xs text-gray-500 text-center leading-relaxed">
                  Ao criar uma conta, você concorda com nossos termos de uso e política de privacidade.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}



