'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Clock, 
  CheckCircle, 
  ChefHat, 
  Truck, 
  MapPin,
  User,
  Phone,
  DollarSign,
  Package,
  MessageSquare,
  Send,
  Trash2
} from 'lucide-react'
import toast from 'react-hot-toast'

interface Order {
  id: string
  total: number
  status: string
  paymentMethod: string
  deliveryType: string
  createdAt: string
  customerName: string
  customerPhone?: string
  deliveryPerson?: string
  address?: {
    street: string
    number: string
    neighborhood: string
    city: string
    state: string
  }
  items: Array<{
    id: string
    quantity: number
    combo: {
      name: string
    }
  }>
}

const statusSteps = [
  { key: 'PENDING', label: 'Aguardando', icon: Clock, color: 'bg-yellow-500' },
  { key: 'CONFIRMED', label: 'Confirmado', icon: CheckCircle, color: 'bg-blue-500' },
  { key: 'PREPARING', label: 'Preparando', icon: ChefHat, color: 'bg-orange-500' },
  { key: 'READY', label: 'Pronto', icon: Package, color: 'bg-green-500' },
  { key: 'OUT_FOR_DELIVERY', label: 'Saiu para Entrega', icon: Truck, color: 'bg-purple-500' }
]

export function ActiveOrders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchActiveOrders()
    // Atualizar a cada 5 segundos
    const interval = setInterval(fetchActiveOrders, 5000)
    return () => clearInterval(interval)
  }, [])

  const fetchActiveOrders = async () => {
    try {
      const response = await fetch('/api/orders')
      if (!response.ok) {
        console.error('Erro ao buscar pedidos:', response.status, response.statusText)
        setOrders([])
        return
      }
      
      const allOrders = await response.json()
      
      // Garantir que é um array
      if (!Array.isArray(allOrders)) {
        console.error('Dados recebidos não são um array:', allOrders)
        setOrders([])
        return
      }
      
      // Filtrar apenas pedidos ativos (não entregues e não cancelados)
      const activeOrders = allOrders.filter(
        (order: Order) => order.status !== 'DELIVERED' && order.status !== 'CANCELLED'
      )
      setOrders(activeOrders)
    } catch (error) {
      console.error('Erro ao carregar pedidos:', error)
      setOrders([])
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusIndex = (status: string) => {
    // Normalizar variações de status
    const normalizedStatus = status === 'OUTFOR_DELIVERY' ? 'OUT_FOR_DELIVERY' : status
    const index = statusSteps.findIndex(step => step.key === normalizedStatus)
    // Se não encontrar, retornar -1 para status desconhecido
    return index >= 0 ? index : 0
  }

  const getProgressPercentage = (status: string) => {
    const index = getStatusIndex(status)
    if (index === -1) return 0
    return ((index + 1) / statusSteps.length) * 100
  }

  const getStatusColor = (status: string) => {
    const step = statusSteps.find(s => s.key === status)
    return step?.color || 'bg-gray-500'
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price)
  }

  const handleSendMessage = async (order: Order, trigger: string) => {
    try {
      const response = await fetch('/api/chatbot/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.id,
          trigger
        })
      })

      if (response.ok) {
        toast.success('Mensagem enviada com sucesso!')
      } else {
        const error = await response.json()
        toast.error(error.message || 'Erro ao enviar mensagem')
      }
    } catch (error) {
      toast.error('Erro ao enviar mensagem')
    }
  }

  const handleDeleteOrder = async (order: Order) => {
    if (!confirm(`Tem certeza que deseja cancelar o pedido #${order.id.slice(-6).toUpperCase()}?`)) {
      return
    }

    try {
      const response = await fetch(`/api/orders/${order.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      if (response.ok) {
        toast.success('Pedido cancelado com sucesso!')
        // Recarregar pedidos após um pequeno delay
        setTimeout(() => {
          fetchActiveOrders()
        }, 500)
      } else {
        const error = await response.json()
        toast.error(error.message || 'Erro ao cancelar pedido')
      }
    } catch (error) {
      console.error('Erro ao cancelar pedido:', error)
      toast.error('Erro ao cancelar pedido')
    }
  }

  if (isLoading) {
    return (
      <div className="mt-8">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-red-500 border-t-transparent mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Carregando pedidos...</p>
        </div>
      </div>
    )
  }

  if (orders.length === 0) {
    return (
      <div className="mt-8">
        <Card className="border-2 border-dashed border-gray-300 dark:border-gray-700">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-gray-400 mb-4" />
            <p className="text-lg font-semibold text-gray-600 dark:text-gray-400">
              Nenhum pedido em andamento
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
              Os pedidos aparecerão aqui quando forem criados
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="mt-8">
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-foreground mb-2">Pedidos em Andamento</h3>
        <p className="text-sm text-muted-foreground">
          Acompanhe o progresso dos pedidos em tempo real
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {orders.map((order) => {
          const progress = getProgressPercentage(order.status)
          const currentStepIndex = getStatusIndex(order.status)
          const StatusIcon = statusSteps[currentStepIndex]?.icon || Clock

          return (
            <Card
              key={order.id}
              className="group relative overflow-hidden border-2 hover:border-red-500 dark:hover:border-red-600 transition-all duration-300 hover:shadow-xl hover:shadow-red-500/20 hover:-translate-y-1 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800"
            >
              {/* Barra de progresso animada no topo */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-700">
                <div
                  className={`h-full transition-all duration-1000 ease-out ${getStatusColor(order.status)}`}
                  style={{ width: `${progress}%` }}
                >
                  <div className="h-full w-full bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"></div>
                </div>
              </div>

              <CardContent className="p-6 pt-7">
                {/* Header do pedido */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <StatusIcon className={`h-5 w-5 ${getStatusColor(order.status).replace('bg-', 'text-')}`} />
                      <h4 className="font-bold text-lg text-foreground">
                        Pedido #{order.id.slice(-6).toUpperCase()}
                      </h4>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(order.createdAt)}
                    </p>
                  </div>
                  <Badge
                    className={`${getStatusColor(order.status)} text-white border-0`}
                  >
                    {statusSteps[currentStepIndex]?.label || order.status}
                  </Badge>
                </div>

                {/* Informações do cliente */}
                <div className="space-y-2 mb-4 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-gray-500" />
                    <span className="font-medium text-foreground">{order.customerName}</span>
                  </div>
                  {order.customerPhone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-gray-500" />
                      <span className="text-muted-foreground">{order.customerPhone}</span>
                    </div>
                  )}
                  {order.deliveryType === 'DELIVERY' && order.address && (
                    <div className="flex items-start gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-gray-500 mt-0.5" />
                      <span className="text-muted-foreground">
                        {order.address.street}, {order.address.number} - {order.address.neighborhood}
                      </span>
                    </div>
                  )}
                  {order.deliveryType === 'PICKUP' && (
                    <div className="flex items-center gap-2 text-sm">
                      <Package className="h-4 w-4 text-gray-500" />
                      <span className="text-muted-foreground">Retirada no local</span>
                    </div>
                  )}
                </div>

                {/* Itens do pedido */}
                <div className="mb-4">
                  <p className="text-xs font-semibold text-muted-foreground mb-2">ITENS:</p>
                  <div className="space-y-1">
                    {order.items.slice(0, 3).map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between text-sm">
                        <span className="text-foreground">
                          {item.quantity}x {item.combo.name}
                        </span>
                      </div>
                    ))}
                    {order.items.length > 3 && (
                      <p className="text-xs text-muted-foreground">
                        +{order.items.length - 3} item(s)
                      </p>
                    )}
                  </div>
                </div>

                {/* Barra de progresso visual */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-muted-foreground">PROGRESSO</span>
                    <span className="text-xs font-bold text-foreground">{Math.round(progress)}%</span>
                  </div>
                  <div className="relative h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`absolute top-0 left-0 h-full ${getStatusColor(order.status)} transition-all duration-1000 ease-out rounded-full`}
                      style={{ width: `${progress}%` }}
                    >
                      <div className="h-full w-full bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer"></div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    {statusSteps.map((step, idx) => {
                      const StepIcon = step.icon
                      const isActive = idx <= currentStepIndex
                      const isCurrent = idx === currentStepIndex
                      
                      return (
                        <div
                          key={step.key}
                          className={`flex flex-col items-center gap-1 transition-all duration-300 ${
                            isActive ? 'opacity-100' : 'opacity-30'
                          }`}
                        >
                          <div
                            className={`p-1.5 rounded-full transition-all duration-300 ${
                              isCurrent
                                ? `${step.color} text-white scale-110 animate-pulse`
                                : isActive
                                ? `${step.color} text-white`
                                : 'bg-gray-300 dark:bg-gray-600 text-gray-500'
                            }`}
                          >
                            <StepIcon className="h-3 w-3" />
                          </div>
                          <span className={`text-[10px] font-medium ${
                            isCurrent ? 'text-foreground font-bold' : 'text-muted-foreground'
                          }`}>
                            {step.label.split(' ')[0]}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Footer com total e método de pagamento */}
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
                      <span className="font-bold text-lg text-foreground">
                        {formatPrice(order.total)}
                      </span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {order.paymentMethod === 'PIX' ? 'PIX' : 
                       order.paymentMethod === 'CREDIT_CARD' ? 'Cartão' : 
                       order.paymentMethod === 'CASH' ? 'Dinheiro' : order.paymentMethod}
                    </Badge>
                  </div>
                  
                  {/* Botões de ação */}
                  <div className="flex gap-2">
                    {order.customerPhone && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 dark:text-blue-400 dark:border-blue-700"
                        onClick={() => {
                          const triggers: { [key: string]: string } = {
                            'CONFIRMED': 'ORDER_CONFIRMED',
                            'PREPARING': 'ORDER_PREPARING',
                            'READY': 'ORDER_READY',
                            'OUT_FOR_DELIVERY': 'ORDER_OUT_FOR_DELIVERY'
                          }
                          const trigger = triggers[order.status]
                          if (trigger) {
                            handleSendMessage(order, trigger)
                          }
                        }}
                      >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Enviar Mensagem
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteOrder(order)}
                      className="bg-red-50 hover:bg-red-100 text-red-700 border-red-300 dark:bg-red-900/20 dark:hover:bg-red-900/30 dark:text-red-400 dark:border-red-700"
                      title="Cancelar pedido"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>

              {/* Efeito de brilho ao passar o mouse */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-red-500/10 to-transparent animate-shimmer"></div>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

