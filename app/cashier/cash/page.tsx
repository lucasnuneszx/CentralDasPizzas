'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ProtectedRoute } from '@/components/protected-route'
import { UserRole } from '@/lib/constants'
import { ArrowLeft, DollarSign, Clock, CheckCircle, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'

interface CashLog {
  id: string
  type: string
  amount: number
  description?: string
  createdAt: string
  order?: {
    id: string
    total: number
  }
}

interface CashSummary {
  totalSales: number
  totalOrders: number
  cashSales: number
  cardSales: number
  pixSales: number
  ifoodSales: number
  isOpen: boolean
  openTime?: string
  closeTime?: string
}

export default function CashControl() {
  const [cashLogs, setCashLogs] = useState<CashLog[]>([])
  const [summary, setSummary] = useState<CashSummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showCloseModal, setShowCloseModal] = useState(false)
  const [showOpenModal, setShowOpenModal] = useState(false)
  const [closeAmount, setCloseAmount] = useState('')
  const [openAmount, setOpenAmount] = useState('')
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    fetchCashData()
  }, [])

  const fetchCashData = async () => {
    try {
      setError(null)
      const [logsResponse, summaryResponse] = await Promise.all([
        fetch('/api/cash/logs'),
        fetch('/api/cash/summary')
      ])
      
      if (!logsResponse.ok || !summaryResponse.ok) {
        throw new Error('Erro ao carregar dados do caixa')
      }
      
      const logs = await logsResponse.json()
      const summaryData = await summaryResponse.json()
      
      setCashLogs(logs)
      setSummary(summaryData)
    } catch (error) {
      console.error('Erro ao carregar dados do caixa:', error)
      setError('Erro ao carregar dados do caixa')
      toast.error('Erro ao carregar dados do caixa')
    } finally {
      setIsLoading(false)
    }
  }

  const openCash = async () => {
    try {
      const amount = parseFloat(openAmount) || 0
      const response = await fetch('/api/cash/open', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: amount,
          description: `Abertura do caixa com R$ ${amount.toFixed(2)}`
        }),
      })

      if (response.ok) {
        toast.success('Caixa aberto com sucesso!')
        setShowOpenModal(false)
        setOpenAmount('')
        fetchCashData()
      } else {
        const errorData = await response.json()
        toast.error(errorData.message || 'Erro ao abrir caixa')
      }
    } catch (error) {
      toast.error('Erro ao abrir caixa')
    }
  }

  const closeCash = async () => {
    if (!closeAmount) {
      toast.error('Informe o valor em caixa')
      return
    }

    try {
      const response = await fetch('/api/cash/close', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: parseFloat(closeAmount),
          description: 'Fechamento do caixa'
        }),
      })

      if (response.ok) {
        toast.success('Caixa fechado com sucesso!')
        setShowCloseModal(false)
        setCloseAmount('')
        fetchCashData()
      } else {
        toast.error('Erro ao fechar caixa')
      }
    } catch (error) {
      toast.error('Erro ao fechar caixa')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR')
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount)
  }

  return (
    <ProtectedRoute allowedRoles={[UserRole.CASHIER, UserRole.MANAGER, UserRole.ADMIN]}>
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
                <h1 className="text-2xl font-bold text-gray-900">
                  Controle de Caixa
                </h1>
              </div>
              
              <div className="flex items-center space-x-4">
                {summary?.isOpen ? (
                  <Button
                    onClick={() => setShowCloseModal(true)}
                    variant="destructive"
                  >
                    Fechar Caixa
                  </Button>
                ) : (
                  <Button onClick={() => setShowOpenModal(true)}>
                    Abrir Caixa
                  </Button>
                )}
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center">
                  <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                  <p className="text-red-700">{error}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchCashData}
                    className="ml-auto"
                  >
                    Tentar Novamente
                  </Button>
                </div>
              </div>
            )}
            
            {isLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Status do Caixa */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {summary?.isOpen ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-red-500" />
                      )}
                      Status do Caixa
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-lg font-medium">
                          {summary?.isOpen ? 'Caixa Aberto' : 'Caixa Fechado'}
                        </p>
                        {summary?.openTime && (
                          <p className="text-sm text-gray-600">
                            Aberto em: {formatDate(summary.openTime)}
                          </p>
                        )}
                        {summary?.closeTime && (
                          <p className="text-sm text-gray-600">
                            Fechado em: {formatDate(summary.closeTime)}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-primary">
                          {formatCurrency(summary?.totalSales || 0)}
                        </p>
                        <p className="text-sm text-gray-600">Total de Vendas</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Resumo de Vendas */}
                {summary?.isOpen && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center">
                          <DollarSign className="h-8 w-8 text-green-500" />
                          <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Dinheiro</p>
                            <p className="text-2xl font-bold">{formatCurrency(summary.cashSales)}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center">
                          <DollarSign className="h-8 w-8 text-blue-500" />
                          <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Cartão</p>
                            <p className="text-2xl font-bold">{formatCurrency(summary.cardSales)}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center">
                          <DollarSign className="h-8 w-8 text-purple-500" />
                          <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">PIX</p>
                            <p className="text-2xl font-bold">{formatCurrency(summary.pixSales)}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center">
                          <DollarSign className="h-8 w-8 text-orange-500" />
                          <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">iFood</p>
                            <p className="text-2xl font-bold">{formatCurrency(summary.ifoodSales)}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Movimentações do Caixa */}
                <Card>
                  <CardHeader>
                    <CardTitle>Movimentações</CardTitle>
                    <CardDescription>
                      Histórico de todas as movimentações do caixa
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {cashLogs.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">
                          Nenhuma movimentação registrada
                        </p>
                      ) : (
                        cashLogs.map((log) => (
                          <div key={log.id} className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex items-center space-x-4">
                              <div className={`p-2 rounded-full ${
                                log.type === 'OPEN' ? 'bg-green-100' :
                                log.type === 'CLOSE' ? 'bg-red-100' :
                                'bg-blue-100'
                              }`}>
                                {log.type === 'OPEN' && <CheckCircle className="h-4 w-4 text-green-600" />}
                                {log.type === 'CLOSE' && <AlertCircle className="h-4 w-4 text-red-600" />}
                                {log.type === 'ORDER' && <DollarSign className="h-4 w-4 text-blue-600" />}
                              </div>
                              <div>
                                <p className="font-medium">
                                  {log.type === 'OPEN' && 'Abertura do caixa'}
                                  {log.type === 'CLOSE' && 'Fechamento do caixa'}
                                  {log.type === 'ORDER' && `Pedido #${log.order?.id.slice(-8)}`}
                                </p>
                                {log.description && (
                                  <p className="text-sm text-gray-600">{log.description}</p>
                                )}
                                <p className="text-xs text-gray-500">{formatDate(log.createdAt)}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className={`font-bold ${
                                log.type === 'ORDER' ? 'text-green-600' : 'text-gray-600'
                              }`}>
                                {log.type === 'ORDER' ? '+' : ''}{formatCurrency(log.amount)}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </main>

        {/* Modal de Fechamento */}
        {showCloseModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50">
            <div className="fixed inset-0 flex items-center justify-center p-4">
              <Card className="w-full max-w-md">
                <CardHeader>
                  <CardTitle>Fechar Caixa</CardTitle>
                  <CardDescription>
                    Informe o valor em caixa para fechar
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="closeAmount">Valor em Caixa</Label>
                      <Input
                        id="closeAmount"
                        type="number"
                        step="0.01"
                        value={closeAmount}
                        onChange={(e) => setCloseAmount(e.target.value)}
                        placeholder="0.00"
                      />
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600 mb-2">Resumo do dia:</p>
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span>Total de vendas:</span>
                          <span className="font-medium">{formatCurrency(summary?.totalSales || 0)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Total de pedidos:</span>
                          <span className="font-medium">{summary?.totalOrders || 0}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        onClick={() => setShowCloseModal(false)}
                      >
                        Cancelar
                      </Button>
                      <Button
                        onClick={closeCash}
                        disabled={!closeAmount}
                      >
                        Fechar Caixa
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Modal para Abrir Caixa */}
        {showOpenModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>Abrir Caixa</CardTitle>
                <CardDescription>
                  Informe o valor inicial em caixa
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Valor inicial em caixa
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      value={openAmount}
                      onChange={(e) => setOpenAmount(e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                  
                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowOpenModal(false)
                        setOpenAmount('')
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={openCash}
                    >
                      Abrir Caixa
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </ProtectedRoute>
  )
}



