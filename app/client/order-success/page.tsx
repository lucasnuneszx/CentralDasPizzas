'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle2, Pizza, Home, ShoppingBag, Sparkles } from 'lucide-react'
import Link from 'next/link'

export default function OrderSuccessPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [orderId, setOrderId] = useState<string | null>(null)
  const [orderTotal, setOrderTotal] = useState<number | null>(null)

  useEffect(() => {
    // Buscar dados do pedido da URL ou localStorage
    const orderIdParam = searchParams.get('orderId')
    const totalParam = searchParams.get('total')
    
    if (orderIdParam) {
      setOrderId(orderIdParam)
    }
    
    if (totalParam) {
      setOrderTotal(parseFloat(totalParam))
    } else {
      // Tentar buscar do localStorage se não estiver na URL
      const lastOrder = localStorage.getItem('lastOrder')
      if (lastOrder) {
        try {
          const order = JSON.parse(lastOrder)
          setOrderId(order.id || null)
          setOrderTotal(order.total || null)
        } catch (e) {
          console.error('Erro ao parsear último pedido:', e)
        }
      }
    }
  }, [searchParams])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-red-900 to-orange-900 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Efeito de partículas decorativas */}
        <div className="absolute top-20 left-[10%] w-3 h-3 bg-yellow-400 rounded-full animate-pulse opacity-60"></div>
        <div className="absolute top-40 right-[15%] w-4 h-4 bg-orange-400 rounded-full animate-bounce opacity-50" style={{ animationDelay: '0.5s' }}></div>
        <div className="absolute bottom-40 left-[20%] w-2 h-2 bg-red-400 rounded-full animate-pulse opacity-40" style={{ animationDelay: '1s' }}></div>

        <Card className="relative overflow-hidden border-2 border-orange-500/30 shadow-2xl">
          {/* Gradiente de fundo */}
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-red-500/10"></div>
          
          <CardHeader className="relative text-center pb-4">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-green-500/30 blur-3xl rounded-full scale-150"></div>
                <div className="relative w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-2xl">
                  <CheckCircle2 className="w-14 h-14 text-white" />
                </div>
              </div>
            </div>
            
            <CardTitle className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-emerald-400 to-green-500 mb-2">
              Pedido Concluído!
            </CardTitle>
            
            <CardDescription className="text-lg text-white/80">
              Seu pedido foi recebido com sucesso
            </CardDescription>
          </CardHeader>

          <CardContent className="relative space-y-6">
            {/* Informações do pedido */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="flex items-center gap-3 mb-4">
                <Sparkles className="w-6 h-6 text-yellow-400" />
                <h3 className="text-xl font-bold text-white">Detalhes do Pedido</h3>
              </div>
              
              {orderId && (
                <div className="space-y-2 text-white/90">
                  <div className="flex justify-between items-center">
                    <span className="text-white/70">Número do Pedido:</span>
                    <span className="font-mono font-bold text-yellow-400">#{orderId.slice(-8).toUpperCase()}</span>
                  </div>
                  {orderTotal && (
                    <div className="flex justify-between items-center">
                      <span className="text-white/70">Valor Total:</span>
                      <span className="font-bold text-green-400 text-xl">
                        R$ {orderTotal.toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                  )}
                </div>
              )}
              
              <div className="mt-4 p-4 bg-blue-500/20 rounded-lg border border-blue-400/30">
                <p className="text-sm text-white/90">
                  <strong className="text-white">📱</strong> Você receberá uma confirmação em breve. 
                  Nosso time está preparando seu pedido com muito carinho!
                </p>
              </div>
            </div>

            {/* Mensagem de agradecimento */}
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <Pizza className="w-16 h-16 text-orange-400 animate-bounce" style={{ animationDelay: '0.3s' }} />
              </div>
              <p className="text-xl font-semibold text-white">
                Obrigado por escolher a Central Das Pizzas! 🍕
              </p>
              <p className="text-white/70">
                Seu pedido está sendo preparado e logo estará a caminho!
              </p>
            </div>

            {/* Botões de ação */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
              <Link href="/client/menu" className="w-full">
                <Button 
                  variant="outline" 
                  className="w-full bg-white/10 hover:bg-white/20 border-white/30 text-white backdrop-blur-sm h-14 text-lg font-semibold group"
                >
                  <ShoppingBag className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                  Ver Cardápio
                </Button>
              </Link>
              
              <Link href="/" className="w-full">
                <Button 
                  className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white h-14 text-lg font-bold shadow-xl shadow-orange-500/30 group"
                >
                  <Home className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                  Página Inicial
                </Button>
              </Link>
            </div>

            {/* Informações adicionais */}
            <div className="pt-6 border-t border-white/10">
              <div className="text-center space-y-2">
                <p className="text-sm text-white/60">
                  Tempo estimado de entrega: <span className="text-white font-semibold">30-45 minutos</span>
                </p>
                <p className="text-xs text-white/50">
                  Em caso de dúvidas, entre em contato: <span className="text-orange-400">(71) 99156-5893</span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}



