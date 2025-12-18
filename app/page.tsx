'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Pizza, ChefHat, Star, MapPin, Phone, Clock, ArrowRight, Flame, Heart } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

export default function Home() {
  const { user, loading, authenticated } = useAuth()
  const router = useRouter()
  const [settings, setSettings] = useState<any>(null)

  useEffect(() => {
    // Buscar configurações
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

  useEffect(() => {
    if (loading) return

    // Apenas redirecionar para dashboard se estiver autenticado
    // A landing page é sempre exibida para visitantes não autenticados
    if (authenticated && user) {
      router.push('/dashboard')
    }
    // NÃO redirecionar para /client/menu - a landing page é a página principal
  }, [user, loading, authenticated, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-red-900 to-orange-900">
        <div className="text-center">
          <div className="relative mb-8">
            <div className="absolute inset-0 bg-red-500/30 blur-3xl rounded-full scale-150"></div>
            <div className="relative w-32 h-32 mx-auto">
              {settings?.profileLogo ? (
                <img src={settings.profileLogo} alt="Logo" className="w-full h-full object-contain" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-red-500 to-orange-500 rounded-2xl flex items-center justify-center">
                  <Pizza className="w-16 h-16 text-white animate-pulse" />
                </div>
              )}
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Central Das Pizzas</h1>
          <p className="text-white/60">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Hero Section */}
      <section className="relative min-h-screen overflow-hidden">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1604382355076-af4b0eb60143?w=1920&q=80')`,
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-slate-900"></div>
        </div>

        {/* Partículas decorativas */}
        <div className="absolute top-20 left-[10%] w-3 h-3 bg-yellow-400 rounded-full animate-pulse opacity-60"></div>
        <div className="absolute top-40 right-[15%] w-4 h-4 bg-orange-400 rounded-full animate-bounce opacity-50" style={{ animationDelay: '0.5s' }}></div>
        <div className="absolute bottom-40 left-[20%] w-2 h-2 bg-red-400 rounded-full animate-pulse opacity-40" style={{ animationDelay: '1s' }}></div>

        {/* Header */}
        <header className="relative z-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div className="flex items-center gap-3">
                {settings?.profileLogo ? (
                  <img src={settings.profileLogo} alt="Logo" className="w-14 h-14 object-contain" />
                ) : (
                  <div className="w-14 h-14 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/30">
                    <Pizza className="h-8 w-8 text-white" />
                  </div>
                )}
                <div>
                  <h1 className="text-2xl font-bold text-white">Central Das Pizzas</h1>
                  <p className="text-white/60 text-sm">Desde 2021</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Link href="/client/menu">
                  <Button variant="ghost" className="text-white hover:text-white hover:bg-white/10 font-medium">
                    Ver Cardápio
                  </Button>
                </Link>
                <Link href="/auth/signin">
                  <Button className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 font-semibold shadow-lg shadow-red-500/30">
                    Entrar
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </header>

        {/* Hero Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Texto */}
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20 mb-6">
                <Flame className="w-4 h-4 text-orange-400" />
                <span className="text-white/90 text-sm font-medium">A melhor pizza da cidade</span>
              </div>
              
              <h1 className="text-5xl md:text-7xl font-black text-white mb-6 leading-tight">
                Sabor que
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-400 to-red-500">
                  Conquista
                </span>
              </h1>
              
              <p className="text-xl text-white/70 mb-8 max-w-lg">
                Pizzas artesanais feitas com ingredientes selecionados e muito amor. 
                Experimente o sabor autêntico que só a Central Das Pizzas oferece.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link href="/client/menu">
                  <Button size="lg" className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-lg font-bold px-8 py-6 shadow-2xl shadow-red-500/30 group">
                    Fazer Pedido
                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link href="/auth/signup">
                  <Button size="lg" variant="outline" className="text-lg font-semibold px-8 py-6 border-2 border-white/30 text-white hover:bg-white/10 backdrop-blur-sm">
                    Criar Conta
                  </Button>
                </Link>
              </div>

              {/* Stats */}
              <div className="flex gap-8 mt-12 justify-center lg:justify-start">
                <div className="text-center">
                  <div className="text-3xl font-bold text-white">+5000</div>
                  <div className="text-white/60 text-sm">Pizzas Vendidas</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-white flex items-center gap-1">
                    4.9 <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                  </div>
                  <div className="text-white/60 text-sm">Avaliação</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-white">+50</div>
                  <div className="text-white/60 text-sm">Sabores</div>
                </div>
              </div>
            </div>

            {/* Imagem Pizza */}
            <div className="relative hidden lg:block">
              <div className="absolute inset-0 bg-gradient-to-br from-red-500/20 to-orange-500/20 rounded-full blur-3xl scale-110"></div>
              <div className="relative">
                <img 
                  src="https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80" 
                  alt="Pizza deliciosa"
                  className="w-full max-w-lg mx-auto rounded-3xl shadow-2xl shadow-black/50 transform rotate-3 hover:rotate-0 transition-transform duration-500"
                />
                {/* Badge flutuante */}
                <div className="absolute -bottom-4 -left-4 bg-white rounded-2xl p-4 shadow-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-500 rounded-xl flex items-center justify-center">
                      <ChefHat className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="font-bold text-gray-900">Chef Especializado</div>
                      <div className="text-sm text-gray-500">Massa artesanal</div>
                    </div>
                  </div>
                </div>
                {/* Badge de desconto */}
                <div className="absolute -top-4 -right-4 bg-gradient-to-br from-red-500 to-orange-500 rounded-2xl p-4 shadow-xl text-white">
                  <div className="text-2xl font-black">-10%</div>
                  <div className="text-xs opacity-90">1º Pedido</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Wave divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="#0f172a"/>
          </svg>
        </div>
      </section>

      {/* Destaques Section */}
      <section className="bg-slate-900 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              Por que escolher a <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">Central Das Pizzas</span>?
            </h2>
            <p className="text-white/60 text-lg max-w-2xl mx-auto">
              Tradição, qualidade e sabor em cada fatia
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Card 1 */}
            <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm rounded-3xl p-8 border border-white/10 hover:border-orange-500/50 transition-all duration-300 group">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Pizza className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Ingredientes Premium</h3>
              <p className="text-white/60">
                Utilizamos apenas ingredientes frescos e selecionados para garantir o melhor sabor em cada pizza.
              </p>
            </div>

            {/* Card 2 */}
            <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm rounded-3xl p-8 border border-white/10 hover:border-orange-500/50 transition-all duration-300 group">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Clock className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Entrega Rápida</h3>
              <p className="text-white/60">
                Sua pizza quentinha na sua casa em até 45 minutos. Pontualidade é nosso compromisso.
              </p>
            </div>

            {/* Card 3 */}
            <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm rounded-3xl p-8 border border-white/10 hover:border-orange-500/50 transition-all duration-300 group">
              <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-rose-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Heart className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Feito com Amor</h3>
              <p className="text-white/60">
                Cada pizza é preparada com carinho e dedicação pela nossa equipe especializada.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-red-600 via-orange-500 to-yellow-500 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-black text-white mb-6">
            Está com fome? 🍕
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Faça seu pedido agora e receba em casa a melhor pizza da cidade!
          </p>
          <Link href="/client/menu">
            <Button size="lg" className="bg-white text-red-600 hover:bg-gray-100 text-xl font-bold px-12 py-6 shadow-2xl">
              Ver Cardápio Completo
              <ArrowRight className="ml-2 w-6 h-6" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-white/10 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            {/* Logo e descrição */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                {settings?.profileLogo ? (
                  <img src={settings.profileLogo} alt="Logo" className="w-12 h-12 object-contain" />
                ) : (
                  <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl flex items-center justify-center">
                    <Pizza className="h-6 w-6 text-white" />
                  </div>
                )}
                <div>
                  <h3 className="text-xl font-bold text-white">Central Das Pizzas</h3>
                  <p className="text-white/50 text-sm">Desde 2021</p>
                </div>
              </div>
              <p className="text-white/60">
                A melhor pizza da cidade, feita com amor e ingredientes de qualidade.
              </p>
            </div>

            {/* Contato */}
            <div>
              <h4 className="text-white font-semibold mb-4">Contato</h4>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-white/60">
                  <Phone className="w-5 h-5 text-orange-400" />
                  <span>(00) 00000-0000</span>
                </div>
                <div className="flex items-center gap-3 text-white/60">
                  <MapPin className="w-5 h-5 text-orange-400" />
                  <span>Rua Example, 123 - Centro</span>
                </div>
                <div className="flex items-center gap-3 text-white/60">
                  <Clock className="w-5 h-5 text-orange-400" />
                  <span>18h às 23h</span>
                </div>
              </div>
            </div>

            {/* Links */}
            <div>
              <h4 className="text-white font-semibold mb-4">Links Rápidos</h4>
              <div className="space-y-3">
                <Link href="/client/menu" className="block text-white/60 hover:text-orange-400 transition-colors">
                  Cardápio
                </Link>
                <Link href="/auth/signin" className="block text-white/60 hover:text-orange-400 transition-colors">
                  Entrar
                </Link>
                <Link href="/auth/signup" className="block text-white/60 hover:text-orange-400 transition-colors">
                  Criar Conta
                </Link>
              </div>
            </div>
          </div>

          <div className="border-t border-white/10 pt-8 text-center">
            <p className="text-white/40">
              &copy; 2024 Central Das Pizzas. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
