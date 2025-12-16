'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ProtectedRoute } from '@/components/protected-route'
import { UserRole, OrderStatus } from '@/lib/constants'
import { ArrowLeft, Clock, CheckCircle, XCircle, Truck, Home, Package, CreditCard, DollarSign, MapPin, MessageSquare, Calendar } from 'lucide-react'

interface Order {
  id: string
  total: number
  status: OrderStatus
  deliveryType: string
  paymentMethod: string
  notes?: string
  createdAt: string
  items: {
    id: string
    quantity: number
    price: number
    combo: {
      id: string
      name: string
      image?: string
    }
  }[]
  address?: {
    street: string
    number: string
    complement?: string
    neighborhood: string
    city: string
    state: string
  }
}

export default function ClientOrders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/orders')
      const data = await response.json()
      setOrders(data)
    } catch (error) {
      console.error('Erro ao carregar pedidos:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusConfig = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.PENDING:
        return {
          icon: <Clock className="h-5 w-5" />,
          text: 'Aguardando confirmação',
          color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          iconColor: 'text-yellow-600',
          bgGradient: 'from-yellow-50 to-orange-50'
        }
      case OrderStatus.CONFIRMED:
        return {
          icon: <Package className="h-5 w-5" />,
          text: 'Confirmado',
          color: 'bg-blue-100 text-blue-800 border-blue-200',
          iconColor: 'text-blue-600',
          bgGradient: 'from-blue-50 to-cyan-50'
        }
      case OrderStatus.PREPARING:
        return {
          icon: <Clock className="h-5 w-5" />,
          text: 'Preparando',
          color: 'bg-orange-100 text-orange-800 border-orange-200',
          iconColor: 'text-orange-600',
          bgGradient: 'from-orange-50 to-amber-50'
        }
      case OrderStatus.READY:
        return {
          icon: <CheckCircle className="h-5 w-5" />,
          text: 'Pronto para retirada',
          color: 'bg-green-100 text-green-800 border-green-200',
          iconColor: 'text-green-600',
          bgGradient: 'from-green-50 to-emerald-50'
        }
      case OrderStatus.DELIVERED:
        return {
          icon: <CheckCircle className="h-5 w-5" />,
          text: 'Entregue',
          color: 'bg-green-100 text-green-800 border-green-200',
          iconColor: 'text-green-600',
          bgGradient: 'from-green-50 to-emerald-50'
        }
      case OrderStatus.CANCELLED:
        return {
          icon: <XCircle className="h-5 w-5" />,
          text: 'Cancelado',
          color: 'bg-red-100 text-red-800 border-red-200',
          iconColor: 'text-red-600',
          bgGradient: 'from-red-50 to-rose-50'
        }
      default:
        return {
          icon: <Clock className="h-5 w-5" />,
          text: 'Desconhecido',
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          iconColor: 'text-gray-600',
          bgGradient: 'from-gray-50 to-slate-50'
        }
    }
  }

  const getPaymentIcon = (method: string) => {
    switch (method) {
      case 'PIX':
        return <DollarSign className="h-4 w-4" />
      case 'CREDIT_CARD':
      case 'DEBIT_CARD':
        return <CreditCard className="h-4 w-4" />
      case 'CASH':
        return <DollarSign className="h-4 w-4" />
      default:
        return <CreditCard className="h-4 w-4" />
    }
  }

  const getPaymentText = (method: string) => {
    switch (method) {
      case 'PIX':
        return 'PIX'
      case 'CREDIT_CARD':
        return 'Cartão de Crédito'
      case 'DEBIT_CARD':
        return 'Cartão de Débito'
      case 'CASH':
        return 'Dinheiro'
      default:
        return method
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDateShort = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const diffTime = today.getTime() - date.getTime()
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'Hoje'
    if (diffDays === 1) return 'Ontem'
    if (diffDays < 7) return `${diffDays} dias atrás`
    
    return date.toLocaleDateString('pt-BR')
  }

  return (
    <ProtectedRoute allowedRoles={[UserRole.CLIENT]}>
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50">
        {/* Header com gradiente */}
        <header className="bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  onClick={() => router.push('/dashboard')}
                  className="bg-white/20 border-white/30 text-white hover:bg-white/30 backdrop-blur-sm"
                  size="sm"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar
                </Button>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold">
                    Meus Pedidos
                  </h1>
                  <p className="text-sm opacity-90">Acompanhe seus pedidos em tempo real</p>
                </div>
              </div>
              <Button 
                onClick={() => router.push('/client/menu')}
                className="bg-white text-red-600 hover:bg-gray-100 font-semibold"
              >
                Fazer Novo Pedido
              </Button>
            </div>
          </div>
        </header>

        <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {isLoading ? (
            <div className="flex justify-center py-20">
              <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-red-500 border-t-transparent mx-auto mb-4"></div>
                <p className="text-gray-600">Carregando seus pedidos...</p>
              </div>
            </div>
          ) : orders.length === 0 ? (
            <Card className="border-0 shadow-xl">
              <CardContent className="text-center py-16">
                <div className="w-24 h-24 bg-gradient-to-br from-red-100 to-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Package className="h-12 w-12 text-red-500" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Nenhum pedido ainda
                </h3>
                <p className="text-gray-600 mb-8">
                  Que tal fazer seu primeiro pedido?
                </p>
                <Button 
                  onClick={() => router.push('/client/menu')}
                  className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-semibold px-8"
                  size="lg"
                >
                  Fazer Pedido
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {orders.map((order) => {
                const statusConfig = getStatusConfig(order.status)
                
                return (
                  <Card 
                    key={order.id} 
                    className={`border-2 shadow-lg overflow-hidden transition-all hover:shadow-xl ${statusConfig.color.split(' ')[0]}/20`}
                  >
                    {/* Header com gradiente de status */}
                    <div className={`bg-gradient-to-r ${statusConfig.bgGradient} border-b-2 ${statusConfig.color.split(' ')[2]}`}>
                      <CardHeader className="pb-4">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                          <div className="flex items-start gap-3">
                            <div className={`p-2 rounded-lg ${statusConfig.color} border ${statusConfig.color.split(' ')[2]} shadow-sm`}>
                              {statusConfig.icon}
                            </div>
                            <div>
                              <CardTitle className="text-lg sm:text-xl font-bold">
                                Pedido #{order.id.slice(-8).toUpperCase()}
                              </CardTitle>
                              <CardDescription className="flex items-center gap-2 mt-1">
                                <Calendar className="h-3 w-3" />
                                <span className="text-xs sm:text-sm">{formatDate(order.createdAt)}</span>
                              </CardDescription>
                            </div>
                          </div>
                          <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${statusConfig.color} border ${statusConfig.color.split(' ')[2]} shadow-sm`}>
                            <span className={`${statusConfig.iconColor}`}>
                              {statusConfig.icon}
                            </span>
                            <span className="font-semibold text-sm">
                              {statusConfig.text}
                            </span>
                          </div>
                        </div>
                      </CardHeader>
                    </div>

                    <CardContent className="pt-6">
                      <div className="space-y-6">
                        {/* Itens do Pedido */}
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                            <Package className="h-5 w-5 text-red-500" />
                            Itens do Pedido
                          </h4>
                          <div className="space-y-3">
                            {order.items.map((item) => (
                              <div 
                                key={item.id} 
                                className="flex items-center gap-3 p-3 bg-white rounded-lg shadow-sm border border-gray-100"
                              >
                                {item.combo.image && item.combo.image.startsWith('data:') ? (
                                  <img
                                    src={item.combo.image}
                                    alt={item.combo.name}
                                    className="w-14 h-14 sm:w-16 sm:h-16 object-contain sm:object-cover rounded-lg bg-gray-50"
                                  />
                                ) : item.combo.image ? (
                                  <img
                                    src={item.combo.image}
                                    alt={item.combo.name}
                                    className="w-14 h-14 sm:w-16 sm:h-16 object-contain sm:object-cover rounded-lg bg-gray-50"
                                  />
                                ) : (
                                  <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-red-100 to-orange-100 rounded-lg flex items-center justify-center">
                                    <Package className="h-8 w-8 text-red-400" />
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <div className="font-semibold text-gray-900 truncate">
                                    {item.combo.name}
                                  </div>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="text-sm text-gray-600">
                                      Quantidade: {item.quantity}x
                                    </span>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="font-bold text-red-600">
                                    R$ {(item.price * item.quantity).toFixed(2)}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    R$ {item.price.toFixed(2)} cada
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Grid de Informações */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {/* Tipo de Entrega */}
                          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg p-4 border border-blue-100">
                            <div className="flex items-center gap-2 mb-2">
                              {order.deliveryType === 'DELIVERY' ? (
                                <Truck className="h-5 w-5 text-blue-600" />
                              ) : (
                                <Home className="h-5 w-5 text-blue-600" />
                              )}
                              <h4 className="font-semibold text-gray-900">
                                {order.deliveryType === 'DELIVERY' ? 'Entrega' : 'Retirada'}
                              </h4>
                            </div>
                            {order.deliveryType === 'DELIVERY' && order.address && (
                              <div className="text-sm text-gray-700 ml-7">
                                <div className="flex items-start gap-1">
                                  <MapPin className="h-3 w-3 mt-0.5 flex-shrink-0 text-blue-600" />
                                  <span>
                                    {order.address.street}, {order.address.number}
                                    {order.address.complement && ` - ${order.address.complement}`}
                                    <br />
                                    {order.address.neighborhood}, {order.address.city} - {order.address.state}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Forma de Pagamento */}
                          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4 border border-green-100">
                            <div className="flex items-center gap-2 mb-2">
                              {getPaymentIcon(order.paymentMethod)}
                              <h4 className="font-semibold text-gray-900">Pagamento</h4>
                            </div>
                            <p className="text-sm text-gray-700 ml-7">
                              {getPaymentText(order.paymentMethod)}
                            </p>
                          </div>
                        </div>

                        {/* Observações */}
                        {order.notes && (
                          <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                            <div className="flex items-center gap-2 mb-2">
                              <MessageSquare className="h-4 w-4 text-yellow-700" />
                              <h4 className="font-semibold text-gray-900">Observações</h4>
                            </div>
                            <p className="text-sm text-gray-700 ml-6">{order.notes}</p>
                          </div>
                        )}

                        {/* Total */}
                        <div className="bg-gradient-to-r from-red-500 to-orange-500 rounded-lg p-4 text-white shadow-lg">
                          <div className="flex justify-between items-center">
                            <span className="text-lg font-bold">Total do Pedido:</span>
                            <span className="text-2xl font-extrabold">R$ {order.total.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  )
}



