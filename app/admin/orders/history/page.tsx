'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ProtectedRoute } from '@/components/protected-route'
import { UserRole } from '@/lib/constants'
import { 
  ArrowLeft, 
  Search,
  Filter,
  Calendar,
  Clock,
  User,
  MapPin,
  CreditCard,
  Truck,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
  RefreshCw,
  Download
} from 'lucide-react'
import toast from 'react-hot-toast'
import { maskName, maskPhone, maskEmail } from '@/lib/utils'

interface Order {
  id: string
  ifoodOrderId?: string
  total: number
  status: string
  paymentMethod: string
  deliveryType: string
  createdAt: string
  confirmedAt?: string
  cancelledAt?: string
  deliveredAt?: string
  deliveryPerson?: string
  user: {
    id: string
    name: string
    phone?: string
    email: string
  }
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
  }>
  notes?: string
}

export default function OrdersHistory() {
  const [orders, setOrders] = useState<Order[]>([])
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [showSensitiveData, setShowSensitiveData] = useState<{ [key: string]: boolean }>({})
  const [dateFilter, setDateFilter] = useState<string>('ALL')
  const router = useRouter()

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/orders/history')
      const data = await response.json()
      setOrders(data)
    } catch (error) {
      toast.error('Erro ao carregar histórico de pedidos')
    } finally {
      setIsLoading(false)
    }
  }

  const filterOrders = useCallback(() => {
    let filtered = [...orders]

    // Filtro por termo de busca
    if (searchTerm) {
      filtered = filtered.filter(order => 
        order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.user.phone?.includes(searchTerm) ||
        order.deliveryPerson?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filtro por status
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(order => order.status === statusFilter)
    }

    // Filtro por data
    if (dateFilter !== 'ALL') {
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      
      filtered = filtered.filter(order => {
        const orderDate = new Date(order.createdAt)
        
        switch (dateFilter) {
          case 'TODAY':
            return orderDate >= today
          case 'WEEK':
            const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
            return orderDate >= weekAgo
          case 'MONTH':
            const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
            return orderDate >= monthAgo
          default:
            return true
        }
      })
    }

    setFilteredOrders(filtered)
  }, [orders, searchTerm, statusFilter, dateFilter])

  useEffect(() => {
    fetchOrders()
  }, [])

  useEffect(() => {
    filterOrders()
  }, [filterOrders])

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
        return <Truck className="w-4 h-4" />
      case 'CANCELLED':
        return <XCircle className="w-4 h-4" />
      default:
        return <Clock className="w-4 h-4" />
    }
  }

  const getSourceIcon = (order: Order) => {
    if (order.ifoodOrderId) {
      return <span className="text-orange-500 font-bold">iF</span>
    }
    return <span className="text-blue-500 font-bold">S</span>
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

  const exportToCSV = () => {
    const csvContent = [
      ['ID', 'Cliente', 'Telefone', 'Status', 'Valor', 'Pagamento', 'Entrega', 'Motoboy', 'Data', 'Origem'],
      ...filteredOrders.map(order => [
        order.id.slice(-8),
        order.user.name,
        order.user.phone || '',
        order.status,
        formatCurrency(order.total),
        order.paymentMethod,
        order.deliveryType,
        order.deliveryPerson || '',
        formatDate(order.createdAt),
        getSourceText(order)
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `historico-pedidos-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

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
                    Histórico de Pedidos
                  </h1>
                  <p className="text-sm text-gray-600">
                    Visualize todos os pedidos realizados
                  </p>
                </div>
              </div>
              
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={exportToCSV}
                  disabled={filteredOrders.length === 0}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Exportar CSV
                </Button>
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
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Buscar por ID, cliente, telefone ou motoboy..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  
                  <div>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    >
                      <option value="ALL">Todos os Status</option>
                      <option value="PENDING">Pendente</option>
                      <option value="CONFIRMED">Confirmado</option>
                      <option value="PREPARING">Preparando</option>
                      <option value="READY">Pronto</option>
                      <option value="DELIVERED">Entregue</option>
                      <option value="CANCELLED">Cancelado</option>
                    </select>
                  </div>

                  <div>
                    <select
                      value={dateFilter}
                      onChange={(e) => setDateFilter(e.target.value)}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    >
                      <option value="ALL">Todas as Datas</option>
                      <option value="TODAY">Hoje</option>
                      <option value="WEEK">Última Semana</option>
                      <option value="MONTH">Último Mês</option>
                    </select>
                  </div>

                  <div className="flex items-center text-sm text-gray-600">
                    <Filter className="h-4 w-4 mr-2" />
                    {filteredOrders.length} de {orders.length} pedidos
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Lista de Pedidos */}
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-gray-500">Carregando histórico...</p>
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

                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  <User className="h-4 w-4 text-gray-500" />
                                  <span className="text-sm font-medium">
                                    {showSensitiveData[order.id] ? order.user.name : maskName(order.user.name)}
                                  </span>
                                </div>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setShowSensitiveData({ ...showSensitiveData, [order.id]: !showSensitiveData[order.id] })}
                                  className="h-6 text-xs"
                                >
                                  {showSensitiveData[order.id] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                                </Button>
                              </div>
                              {order.user.phone && (
                                <div className="flex items-center space-x-2">
                                  <span className="text-sm text-gray-600">
                                    {showSensitiveData[order.id] ? order.user.phone : maskPhone(order.user.phone)}
                                  </span>
                                </div>
                              )}
                              <div className="flex items-center space-x-2">
                                <CreditCard className="h-4 w-4 text-gray-500" />
                                <span className="text-sm text-gray-600">{order.paymentMethod}</span>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <div className="flex items-center space-x-2">
                                <Calendar className="h-4 w-4 text-gray-500" />
                                <span className="text-sm text-gray-600">{formatDate(order.createdAt)}</span>
                              </div>
                              {order.confirmedAt && (
                                <div className="flex items-center space-x-2">
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                  <span className="text-sm text-gray-600">
                                    Confirmado: {formatDate(order.confirmedAt)}
                                  </span>
                                </div>
                              )}
                              {order.deliveredAt && (
                                <div className="flex items-center space-x-2">
                                  <Truck className="h-4 w-4 text-blue-500" />
                                  <span className="text-sm text-gray-600">
                                    Entregue: {formatDate(order.deliveredAt)}
                                  </span>
                                </div>
                              )}
                            </div>

                            <div className="space-y-2">
                              <div className="text-lg font-bold text-primary">
                                {formatCurrency(order.total)}
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-600">{order.deliveryType}</span>
                              </div>
                              {order.deliveryPerson && (
                                <div className="flex items-center space-x-2">
                                  <Truck className="h-4 w-4 text-gray-500" />
                                  <span className="text-sm text-gray-600">
                                    Motoboy: {order.deliveryPerson}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          {order.address && (
                            <div className="mb-4">
                              <div className="flex items-start space-x-2">
                                <MapPin className="h-4 w-4 text-gray-500 mt-0.5" />
                                <div className="text-sm text-gray-600">
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
                              </div>
                            </div>
                          )}

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
                                    <p className="text-sm text-gray-500">
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
                          <Button
                            size="sm"
                            variant="outline"
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
                  Ajuste os filtros para encontrar pedidos
                </p>
              </div>
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
