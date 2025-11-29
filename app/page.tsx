'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Pizza, ShoppingCart, Users, ChefHat, Star, Clock, Shield, Zap } from 'lucide-react'

export default function Home() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return

    if (session) {
      router.push('/dashboard')
    } else {
      // Redirecionar para o cardápio público se não estiver logado
      router.push('/client/menu')
    }
  }, [session, status, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-red-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50">
      <header className="bg-white/90 backdrop-blur-sm shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <div className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-orange-500 rounded-lg flex items-center justify-center">
                  <Pizza className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Central Das Pizzas</h1>
                  <p className="text-xs text-gray-500">Sistema PDV</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Link href="/auth/signin">
                <Button variant="outline" className="font-medium">
                  Entrar
                </Button>
              </Link>
              <Link href="/auth/signup">
                <Button className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 font-medium">
                  Cadastrar
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="relative">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-20">
            <div className="inline-flex items-center px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full border border-red-100 mb-6">
              <Star className="h-4 w-4 text-yellow-500 mr-2" />
              <span className="text-sm font-medium text-gray-700">Sistema Profissional</span>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Sistema PDV
              <span className="block bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">
                Completo
              </span>
            </h1>
            
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Gerencie sua pizzaria com eficiência. Sistema completo para clientes, 
              funcionários e administradores com integração ao iFood e controle de caixa.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
            <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm hover:-translate-y-2">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <ShoppingCart className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-lg font-semibold text-gray-900">Pedidos Online</CardTitle>
                <CardDescription className="text-gray-600">
                  Sistema completo de pedidos com carrinho e checkout
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm hover:-translate-y-2">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-lg font-semibold text-gray-900">Gestão de Usuários</CardTitle>
                <CardDescription className="text-gray-600">
                  Controle de acesso para diferentes tipos de usuário
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm hover:-translate-y-2">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <ChefHat className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-lg font-semibold text-gray-900">Integração iFood</CardTitle>
                <CardDescription className="text-gray-600">
                  Sincronização automática com plataformas de delivery
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm hover:-translate-y-2">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Pizza className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-lg font-semibold text-gray-900">Gestão de Produtos</CardTitle>
                <CardDescription className="text-gray-600">
                  Cadastro completo de combos com fotos e descrições
                </CardDescription>
              </CardHeader>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Clock className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">24/7</h3>
              <p className="text-gray-600">Disponível sempre</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">100%</h3>
              <p className="text-gray-600">Seguro e confiável</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Rápido</h3>
              <p className="text-gray-600">Performance otimizada</p>
            </div>
          </div>

          <div className="text-center bg-white/80 backdrop-blur-sm rounded-3xl p-12 border border-red-100">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Pronto para começar?
            </h2>
            <p className="text-gray-600 mb-8 text-lg">
              Acesse o sistema ou cadastre-se para começar a usar
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link href="/auth/signin">
                <Button size="lg" className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 px-8 py-3 text-lg font-semibold">
                  Acessar Sistema
                </Button>
              </Link>
              <Link href="/auth/signup">
                <Button variant="outline" size="lg" className="px-8 py-3 text-lg font-semibold border-2 hover:bg-gray-50">
                  Criar Conta
                </Button>
              </Link>
              <Link href="/credentials">
                <Button variant="outline" size="lg" className="px-8 py-3 text-lg font-semibold border-2 border-blue-200 text-blue-600 hover:bg-blue-50">
                  Ver Credenciais
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-white/90 backdrop-blur-sm border-t border-gray-200">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-orange-500 rounded-lg flex items-center justify-center mr-3">
                <Pizza className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-bold text-gray-900">Central Das Pizzas</span>
            </div>
            <p className="text-gray-600">
              &copy; 2024 Central Das Pizzas. Todos os direitos reservados.
            </p>
            <p className="text-gray-500 text-sm mt-2">
              Powered By: <span className="font-semibold">Lucas Nunes</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}