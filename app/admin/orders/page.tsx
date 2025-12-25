'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ProtectedRoute } from '@/components/protected-route'
import { UserRole } from '@/lib/constants'
import { 
  ArrowLeft, 
  CheckCircle, 
  XCircle, 
  Printer, 
  Clock,
  Smartphone,
  Store,
  Eye,
  EyeOff,
  RefreshCw,
  Filter,
  Truck,
  MessageSquare,
  Send
} from 'lucide-react'
import toast from 'react-hot-toast'
import { maskName, maskPhone, maskId } from '@/lib/utils'

interface Order {
  id: string
  ifoodOrderId?: string
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
    zipCode: string
  }
  items: Array<{
    id: string
    quantity: number
    price: number
    combo: {
      id: string
      name: string
      description: string
      image?: string
    }
    selectedFlavors?: any
    extras?: any
    observations?: string
  }>
  notes?: string
}

interface DeliveryPerson {
  id: string
  name: string
  phone: string
  plate?: string
  status: string
  isActive: boolean
}

export default function OrdersManagement() {
  const [orders, setOrders] = useState<Order[]>([])
  const [deliveryPersons, setDeliveryPersons] = useState<DeliveryPerson[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [sourceFilter, setSourceFilter] = useState<string>('ALL')
  const [deliveryPerson, setDeliveryPerson] = useState<{ [key: string]: string }>({})
  const [showSensitiveData, setShowSensitiveData] = useState<{ [key: string]: boolean }>({})
  const [settings, setSettings] = useState<any>(null)
  const [allSeenOrderIds, setAllSeenOrderIds] = useState<Set<string>>(new Set())
  const router = useRouter()

  useEffect(() => {
    fetchSettings()
    fetchOrders()
    fetchDeliveryPersons()
    // Polling para novos pedidos - reduzido para 3 segundos para detecção mais rápida
    const interval = setInterval(() => {
      fetchOrders()
    }, 3000)
    return () => clearInterval(interval)
  }, [])

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

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/orders')
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `Erro HTTP: ${response.status}`)
      }
      const data = await response.json()
      
      // Garantir que os dados estão no formato esperado
      if (Array.isArray(data)) {
        // Detectar novos pedidos PENDING que nunca foram vistos antes
        const pendingOrders = data.filter((order: Order) => order.status === 'PENDING')
        
        // Verificar se há pedidos PENDING que nunca foram vistos (realmente novos)
        const newPendingOrders = pendingOrders.filter((order: Order) => !allSeenOrderIds.has(order.id))
        
        if (newPendingOrders.length > 0 && settings?.notificationSound) {
          try {
            const audio = new Audio(settings.notificationSound)
            audio.volume = 0.7
            audio.play().catch(err => console.log('Erro ao reproduzir som (esperado em alguns navegadores):', err))
            console.log('🔔 Som de notificação reproduzido para', newPendingOrders.length, 'novo(s) pedido(s)')
          } catch (error) {
            console.error('Erro ao criar elemento de áudio:', error)
          }
        }
        
        // Adicionar todos os IDs dos pedidos atuais ao conjunto de IDs vistos
        const currentOrderIds = new Set(data.map((o: Order) => o.id))
        setAllSeenOrderIds(prev => new Set([...prev, ...Array.from(currentOrderIds)]))
        
        setOrders(data)
      } else {
        console.error('Dados recebidos não são um array:', data)
        setOrders([])
        toast.error('Formato de dados inválido')
      }
    } catch (error: any) {
      console.error('Erro ao carregar pedidos:', error)
      toast.error(error?.message || 'Erro ao carregar pedidos')
      setOrders([])
    } finally {
      setIsLoading(false)
    }
  }

  const fetchDeliveryPersons = async () => {
    try {
      const response = await fetch('/api/delivery-persons')
      const data = await response.json()
      setDeliveryPersons(data)
    } catch (error) {
      toast.error('Erro ao carregar motoboys')
    }
  }

  const handleOrderAction = async (orderId: string, action: 'ACCEPT' | 'REJECT' | 'PRINT') => {
    setIsProcessing(orderId)
    try {
      const response = await fetch(`/api/orders/${orderId}/${action.toLowerCase()}`, {
        method: 'POST'
      })

      if (response.ok) {
        const actionText = action === 'ACCEPT' ? 'aceito' : action === 'REJECT' ? 'rejeitado' : 'impresso'
        toast.success(`Pedido ${actionText} com sucesso!`)
        fetchOrders()
      } else {
        toast.error('Erro ao processar pedido')
      }
    } catch (error) {
      toast.error('Erro ao processar pedido')
    } finally {
      setIsProcessing(null)
    }
  }

  const updateDeliveryPerson = async (orderId: string, person: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ deliveryPerson: person }),
      })

      if (response.ok) {
        toast.success('Motoboy atualizado!')
        fetchOrders()
      } else {
        toast.error('Erro ao atualizar motoboy')
      }
    } catch (error) {
      toast.error('Erro ao atualizar motoboy')
    }
  }

  const markAsDelivered = async (orderId: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'DELIVERED' }),
      })

      if (response.ok) {
        toast.success('Pedido marcado como entregue!')
        fetchOrders()
      } else {
        toast.error('Erro ao marcar como entregue')
      }
    } catch (error) {
      toast.error('Erro ao marcar como entregue')
    }
  }

  const handleSendMessage = async (order: Order, trigger: string) => {
    if (!order.customerPhone) {
      toast.error('Telefone do cliente não disponível para enviar mensagem.')
      return
    }
    try {
      const response = await fetch('/api/chatbot/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.id,
          phone: order.customerPhone,
          trigger: trigger,
        }),
      })
      if (response.ok) {
        toast.success('Mensagem enviada com sucesso!')
      } else {
        const errorData = await response.json()
        toast.error(errorData.message || 'Erro ao enviar mensagem.')
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error)
      toast.error('Erro ao enviar mensagem.')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800'
      case 'CONFIRMED':
        return 'bg-blue-100 text-blue-800'
      case 'PREPARING':
        return 'bg-orange-100 text-orange-800'
      case 'READY':
        return 'bg-green-100 text-green-800'
      case 'DELIVERED':
        return 'bg-gray-100 text-gray-800'
      case 'CANCELLED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="w-4 h-4" />
      case 'CONFIRMED':
        return <CheckCircle className="w-4 h-4" />
      case 'PREPARING':
        return <Clock className="w-4 h-4" />
      case 'READY':
        return <CheckCircle className="w-4 h-4" />
      case 'DELIVERED':
        return <CheckCircle className="w-4 h-4" />
      case 'CANCELLED':
        return <XCircle className="w-4 h-4" />
      default:
        return <Clock className="w-4 h-4" />
    }
  }

  const getSourceIcon = (order: Order) => {
    if (order.ifoodOrderId) {
      return <Smartphone className="w-4 h-4 text-orange-500" />
    }
    return <Store className="w-4 h-4 text-blue-500" />
  }

  const getSourceText = (order: Order) => {
    if (order.ifoodOrderId) {
      return 'iFood'
    }
    return 'Sistema'
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR')
  }

  const filteredOrders = orders.filter(order => {
    const statusMatch = statusFilter === 'ALL' || order.status === statusFilter
    const sourceMatch = sourceFilter === 'ALL' || 
      (sourceFilter === 'IFOOD' && order.ifoodOrderId) ||
      (sourceFilter === 'SYSTEM' && !order.ifoodOrderId)
    
    return statusMatch && sourceMatch
  })

  return (
    <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER]}>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div className="flex items-center">
                <Button
                  variant="outline"
                  onClick={() => router.push('/dashboard')}
                  className="mr-4"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar
                </Button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    Gestão de Pedidos
                  </h1>
                  <p className="text-sm text-gray-600">
                    Aceite, imprima ou negue pedidos
                  </p>
                </div>
              </div>
              
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={fetchOrders}
                  disabled={isLoading}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                  Atualizar
                </Button>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            
            {/* Filtros */}
            <Card className="mb-6">
              <CardContent className="p-4">
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center space-x-2">
                    <Filter className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium">Filtros:</span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <label className="text-sm">Status:</label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="rounded-md border border-gray-300 px-2 py-1 text-sm"
                    >
                      <option value="ALL">Todos</option>
                      <option value="PENDING">Pendente</option>
                      <option value="CONFIRMED">Confirmado</option>
                      <option value="PREPARING">Preparando</option>
                      <option value="READY">Pronto</option>
                      <option value="DELIVERED">Entregue</option>
                      <option value="CANCELLED">Cancelado</option>
                    </select>
                  </div>

                  <div className="flex items-center space-x-2">
                    <label className="text-sm">Origem:</label>
                    <select
                      value={sourceFilter}
                      onChange={(e) => setSourceFilter(e.target.value)}
                      className="rounded-md border border-gray-300 px-2 py-1 text-sm"
                    >
                      <option value="ALL">Todos</option>
                      <option value="IFOOD">iFood</option>
                      <option value="SYSTEM">Sistema</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Lista de Pedidos */}
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-gray-500">Carregando pedidos...</p>
              </div>
            ) : filteredOrders.length > 0 ? (
              <div className="space-y-4">
                {filteredOrders.map((order) => (
                  <Card key={order.id} className="overflow-hidden">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-3">
                            <div className="flex items-center space-x-2">
                              {getSourceIcon(order)}
                              <span className="font-medium">
                                #{order.ifoodOrderId || order.id.slice(-8)}
                              </span>
                            </div>
                            
                            <Badge className={`${getStatusColor(order.status)} flex items-center space-x-1`}>
                              {getStatusIcon(order.status)}
                              <span>{order.status}</span>
                            </Badge>

                            <Badge variant="outline" className="text-xs">
                              {getSourceText(order)}
                            </Badge>
                          </div>

                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-gray-900">Informações do Pedido</h4>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setShowSensitiveData({ ...showSensitiveData, [order.id]: !showSensitiveData[order.id] })}
                              className="h-7 text-xs"
                            >
                              {showSensitiveData[order.id] ? (
                                <>
                                  <EyeOff className="h-3 w-3 mr-1" />
                                  Ocultar
                                </>
                              ) : (
                                <>
                                  <Eye className="h-3 w-3 mr-1" />
                                  Mostrar
                                </>
                              )}
                            </Button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                              <p className="text-sm text-gray-600">
                                <strong>Cliente:</strong> {showSensitiveData[order.id] ? order.customerName : maskName(order.customerName)}
                              </p>
                              {order.customerPhone && (
                                <p className="text-sm text-gray-600">
                                  <strong>Telefone:</strong> {showSensitiveData[order.id] ? order.customerPhone : maskPhone(order.customerPhone)}
                                </p>
                              )}
                              <p className="text-sm text-gray-600">
                                <strong>Pagamento:</strong> {order.paymentMethod}
                              </p>
                              <p className="text-sm text-gray-600">
                                <strong>Entrega:</strong> {order.deliveryType}
                              </p>
                            </div>

                            <div>
                              <p className="text-sm text-gray-600">
                                <strong>Data:</strong> {formatDate(order.createdAt)}
                              </p>
                              <p className="text-sm text-gray-600">
                                <strong>Total:</strong> {formatCurrency(order.total)}
                              </p>
                              {order.deliveryPerson && (
                                <p className="text-sm text-gray-600">
                                  <strong>Motoboy:</strong> {order.deliveryPerson}
                                </p>
                              )}
                              {order.address && (
                                <div className="text-sm text-gray-600">
                                  <strong>Endereço:</strong>
                                  {showSensitiveData[order.id] ? (
                                    <>
                                      <p>{order.address.street}, {order.address.number}</p>
                                      <p>{order.address.neighborhood} - {order.address.city}/{order.address.state}</p>
                                      <p>CEP: {order.address.zipCode}</p>
                                    </>
                                  ) : (
                                    <>
                                      <p>***, ***</p>
                                      <p>*** - ***/***</p>
                                      <p>CEP: ***-**-{order.address.zipCode.substring(order.address.zipCode.length - 2)}</p>
                                    </>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Itens do Pedido */}
                          <div className="mb-4">
                            <h4 className="font-medium text-gray-900 mb-2">Itens do Pedido:</h4>
                            <div className="space-y-2">
                              {order.items.map((item) => (
                                <div key={item.id} className="flex items-center space-x-3 p-2 bg-gray-50 rounded">
                                  {item.combo.image && (
                                    <img
                                      src={item.combo.image}
                                      alt={item.combo.name}
                                      className="w-12 h-12 object-cover rounded"
                                    />
                                  )}
                                  <div className="flex-1">
                                    <p className="font-medium">{item.combo.name}</p>
                                    <p className="text-sm text-gray-600">{item.combo.description}</p>
                                    
                                    {/* Sabores */}
                                    {item.selectedFlavors && Array.isArray(item.selectedFlavors) && item.selectedFlavors.length > 0 && (
                                      <div className="mt-1">
                                        <p className="text-xs font-semibold text-gray-700">Sabores:</p>
                                        <div className="flex flex-wrap gap-1 mt-1">
                                          {item.selectedFlavors.map((flavor: any, idx: number) => (
                                            <span key={idx} className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                                              {typeof flavor === 'string' ? flavor : flavor.name || flavor}
                                            </span>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                    
                                    {/* Sabores Pizza 2 */}
                                    {item.extras?.flavorsPizza2 && Array.isArray(item.extras.flavorsPizza2) && item.extras.flavorsPizza2.length > 0 && (
                                      <div className="mt-1">
                                        <p className="text-xs font-semibold text-gray-700">Sabores Pizza 2:</p>
                                        <div className="flex flex-wrap gap-1 mt-1">
                                          {item.extras.flavorsPizza2.map((flavor: any, idx: number) => (
                                            <span key={idx} className="text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded">
                                              {typeof flavor === 'string' ? flavor : flavor.name || flavor}
                                            </span>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                    
                                    {/* Observações do item */}
                                    {item.observations && (
                                      <p className="text-xs text-gray-600 mt-1 italic">Obs: {item.observations}</p>
                                    )}
                                    
                                    <p className="text-sm text-gray-500 mt-1">
                                      Qtd: {item.quantity} x {formatCurrency(item.price)}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {order.notes && (
                            <div className="mb-4">
                              <h4 className="font-medium text-gray-900 mb-1">Observações:</h4>
                              <p className="text-sm text-gray-600 bg-yellow-50 p-2 rounded">
                                {order.notes}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Ações */}
                        <div className="flex flex-col space-y-2 ml-4">
                          {order.status === 'PENDING' && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => handleOrderAction(order.id, 'ACCEPT')}
                                disabled={isProcessing === order.id}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Aceitar
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleOrderAction(order.id, 'PRINT')}
                                disabled={isProcessing === order.id}
                              >
                                <Printer className="w-4 h-4 mr-1" />
                                Imprimir
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleOrderAction(order.id, 'REJECT')}
                                disabled={isProcessing === order.id}
                                className="text-red-600 border-red-300 hover:bg-red-50"
                              >
                                <XCircle className="w-4 h-4 mr-1" />
                                Negar
                              </Button>
                            </>
                          )}

                          {order.status === 'CONFIRMED' && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleOrderAction(order.id, 'PRINT')}
                                disabled={isProcessing === order.id}
                              >
                                <Printer className="w-4 h-4 mr-1" />
                                Reimprimir
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleSendMessage(order, 'ORDER_CONFIRMED')}
                                disabled={isProcessing === order.id || !order.customerPhone}
                                className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-300"
                              >
                                <MessageSquare className="w-4 h-4 mr-1" />
                                Enviar Msg
                              </Button>
                            </>
                          )}

                          {order.status === 'PREPARING' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleSendMessage(order, 'ORDER_PREPARING')}
                              disabled={isProcessing === order.id || !order.customerPhone}
                              className="bg-orange-50 hover:bg-orange-100 text-orange-700 border-orange-300"
                            >
                              <Send className="w-4 h-4 mr-1" />
                              Pedido em Preparação
                            </Button>
                          )}

                          {order.status === 'READY' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleSendMessage(order, 'ORDER_READY')}
                              disabled={isProcessing === order.id || !order.customerPhone}
                              className="bg-green-50 hover:bg-green-100 text-green-700 border-green-300"
                            >
                              <Send className="w-4 h-4 mr-1" />
                              Pronto para Retirada
                            </Button>
                          )}

                          {order.status === 'OUT_FOR_DELIVERY' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleSendMessage(order, 'ORDER_OUT_FOR_DELIVERY')}
                              disabled={isProcessing === order.id || !order.customerPhone}
                              className="bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-300"
                            >
                              <Send className="w-4 h-4 mr-1" />
                              Saiu para Entrega
                            </Button>
                          )}

                          {/* Campo de Motoboy */}
                          {(order.status === 'CONFIRMED' || order.status === 'PREPARING' || order.status === 'READY') && (
                            <div className="space-y-2">
                              <select
                                value={deliveryPerson[order.id] || order.deliveryPerson || ''}
                                onChange={(e) => setDeliveryPerson(prev => ({
                                  ...prev,
                                  [order.id]: e.target.value
                                }))}
                                className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                              >
                                <option value="">Selecione um motoboy</option>
                                {deliveryPersons
                                  .filter(person => person.isActive)
                                  .map((person) => (
                                    <option key={person.id} value={person.name}>
                                      {person.name} - {person.status}
                                    </option>
                                  ))}
                              </select>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateDeliveryPerson(order.id, deliveryPerson[order.id] || '')}
                                disabled={!deliveryPerson[order.id] && !order.deliveryPerson}
                                className="text-xs"
                              >
                                <Truck className="w-3 h-3 mr-1" />
                                Atualizar Motoboy
                              </Button>
                            </div>
                          )}

                          {/* Marcar como Entregue */}
                          {order.status === 'READY' && (
                            <Button
                              size="sm"
                              onClick={() => markAsDelivered(order.id)}
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              <Truck className="w-4 h-4 mr-1" />
                              Entregue
                            </Button>
                          )}

                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => router.push(`/admin/orders/${order.id}`)}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Ver Detalhes
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Nenhum pedido encontrado</p>
                <p className="text-sm text-gray-400 mt-1">
                  Os pedidos aparecerão aqui quando forem feitos
                </p>
              </div>
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
