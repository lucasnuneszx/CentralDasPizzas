'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, MapPin, CreditCard, Truck, Home, User, Phone, Mail } from 'lucide-react'
import toast from 'react-hot-toast'

interface CartItem {
  combo: {
    id: string
    name: string
    price: number
  }
  quantity: number
}

interface DeliveryType {
  DELIVERY: 'DELIVERY'
  PICKUP: 'PICKUP'
}

interface PaymentMethod {
  PIX: 'PIX'
  CREDIT_CARD: 'CREDIT_CARD'
  CASH: 'CASH'
}

const DeliveryType: DeliveryType = {
  DELIVERY: 'DELIVERY',
  PICKUP: 'PICKUP'
}

const PaymentMethod: PaymentMethod = {
  PIX: 'PIX',
  CREDIT_CARD: 'CREDIT_CARD',
  CASH: 'CASH'
}

export default function CheckoutPublic() {
  const router = useRouter()
  const [cart, setCart] = useState<CartItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  
  const [formData, setFormData] = useState<{
    deliveryType: string
    paymentMethod: string
    notes: string
    customerName: string
    customerPhone: string
    customerEmail: string
    address: {
      street: string
      number: string
      complement: string
      neighborhood: string
      city: string
      state: string
      zipCode: string
    }
  }>({
    deliveryType: DeliveryType.DELIVERY,
    paymentMethod: PaymentMethod.PIX,
    notes: '',
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    address: {
      street: '',
      number: '',
      complement: '',
      neighborhood: '',
      city: '',
      state: '',
      zipCode: ''
    }
  })

  useEffect(() => {
    loadCartFromStorage()
  }, [])

  const loadCartFromStorage = async () => {
    const savedCart = localStorage.getItem('cart')
    if (savedCart) {
      try {
        const cartData = JSON.parse(savedCart)
        // Buscar dados dos combos da API
        const response = await fetch('/api/categories')
        if (response.ok) {
          const categories = await response.json()
          const allCombos = categories.flatMap((cat: any) => cat.combos)
          
          // Converter formato do carrinho para o formato esperado
          const formattedCart = Object.entries(cartData).map(([comboId, quantity]) => {
            const combo = allCombos.find((c: any) => c.id === comboId)
            return {
              combo: {
                id: comboId,
                name: combo?.name || `Produto ${comboId}`,
                price: combo?.price || 25.00
              },
              quantity: quantity as number
            }
          })
          setCart(formattedCart)
        }
      } catch (error) {
        console.error('Erro ao carregar carrinho:', error)
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    if (formData.deliveryType === DeliveryType.DELIVERY) {
      // Validar endereço
      if (!formData.address.street || !formData.address.number || !formData.address.neighborhood || !formData.address.city || !formData.address.state || !formData.address.zipCode) {
        toast.error('Preencha todos os campos do endereço para entrega')
        setIsLoading(false)
        return
      }
    }

    // Validar dados do cliente
    if (!formData.customerName || !formData.customerPhone) {
      toast.error('Preencha nome e telefone')
      setIsLoading(false)
      return
    }

    try {
      const orderData = {
        items: cart.map(item => ({
          comboId: item.combo.id,
          quantity: item.quantity,
          price: item.combo.price
        })),
        deliveryType: formData.deliveryType,
        paymentMethod: formData.paymentMethod,
        notes: formData.notes,
        total: getFinalTotal(),
        customer: {
          name: formData.customerName,
          phone: formData.customerPhone,
          email: formData.customerEmail
        },
        address: formData.deliveryType === DeliveryType.DELIVERY ? formData.address : null
      }

      console.log('Dados do pedido sendo enviados:', orderData)

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      })

      if (response.ok) {
        const result = await response.json()
        console.log('Pedido criado com sucesso:', result)
        toast.success('Pedido realizado com sucesso!')
        localStorage.removeItem('cart')
        router.push('/client/menu')
      } else {
        const error = await response.json()
        console.error('Erro na resposta:', error)
        toast.error(error.message || 'Erro ao realizar pedido')
      }
    } catch (error) {
      toast.error('Erro ao realizar pedido')
    } finally {
      setIsLoading(false)
    }
  }

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + (item.combo.price * item.quantity), 0)
  }

  const getDeliveryFee = () => {
    return formData.deliveryType === DeliveryType.DELIVERY ? 5.00 : 0
  }

  const getFinalTotal = () => {
    return getTotalPrice() + getDeliveryFee()
  }

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Carrinho vazio</h1>
          <p className="text-gray-600 mb-6">Adicione produtos ao carrinho para continuar</p>
          <Button onClick={() => router.push('/client/menu')}>
            Ver Cardápio
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Button
                variant="outline"
                onClick={() => router.push('/client/menu')}
                className="mr-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              <h1 className="text-2xl font-bold text-gray-900">
                Finalizar Pedido
              </h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Dados do Cliente */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Dados do Cliente
                </CardTitle>
                <CardDescription>
                  Preencha seus dados para o pedido
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="customerName">Nome *</Label>
                    <Input
                      id="customerName"
                      value={formData.customerName}
                      onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="customerPhone">Telefone *</Label>
                    <Input
                      id="customerPhone"
                      value={formData.customerPhone}
                      onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="customerEmail">E-mail (opcional)</Label>
                  <Input
                    id="customerEmail"
                    type="email"
                    value={formData.customerEmail}
                    onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Resumo do Pedido */}
            <Card>
              <CardHeader>
                <CardTitle>Resumo do Pedido</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {cart.map((item) => (
                    <div key={item.combo.id} className="flex justify-between items-center">
                      <div>
                        <span className="font-medium">{item.combo.name}</span>
                        <span className="text-gray-600 ml-2">x{item.quantity}</span>
                      </div>
                      <span className="font-medium">
                        R$ {(item.combo.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                  <div className="border-t pt-3">
                    <div className="flex justify-between items-center">
                      <span>Subtotal:</span>
                      <span>R$ {getTotalPrice().toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Taxa de entrega:</span>
                      <span>R$ {getDeliveryFee().toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center font-bold text-lg">
                      <span>Total:</span>
                      <span>R$ {getFinalTotal().toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tipo de Entrega */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  Tipo de Entrega
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <label className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="deliveryType"
                      value={DeliveryType.DELIVERY}
                      checked={formData.deliveryType === DeliveryType.DELIVERY}
                      onChange={(e) => setFormData({ ...formData, deliveryType: e.target.value })}
                      className="text-primary"
                    />
                    <MapPin className="h-5 w-5 text-primary" />
                    <div>
                      <div className="font-medium">Entrega</div>
                      <div className="text-sm text-gray-600">Taxa: R$ 5,00</div>
                    </div>
                  </label>
                  
                  <label className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="deliveryType"
                      value={DeliveryType.PICKUP}
                      checked={formData.deliveryType === DeliveryType.PICKUP}
                      onChange={(e) => setFormData({ ...formData, deliveryType: e.target.value })}
                      className="text-primary"
                    />
                    <Home className="h-5 w-5 text-primary" />
                    <div>
                      <div className="font-medium">Retirada</div>
                      <div className="text-sm text-gray-600">Sem taxa</div>
                    </div>
                  </label>
                </div>
              </CardContent>
            </Card>

            {/* Endereço de Entrega */}
            {formData.deliveryType === DeliveryType.DELIVERY && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Endereço de Entrega
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="street">Rua *</Label>
                    <Input
                      id="street"
                      value={formData.address.street}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        address: { ...formData.address, street: e.target.value }
                      })}
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="number">Número *</Label>
                      <Input
                        id="number"
                        value={formData.address.number}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          address: { ...formData.address, number: e.target.value }
                        })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="complement">Complemento</Label>
                      <Input
                        id="complement"
                        value={formData.address.complement}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          address: { ...formData.address, complement: e.target.value }
                        })}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="neighborhood">Bairro *</Label>
                    <Input
                      id="neighborhood"
                      value={formData.address.neighborhood}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        address: { ...formData.address, neighborhood: e.target.value }
                      })}
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="city">Cidade *</Label>
                      <Input
                        id="city"
                        value={formData.address.city}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          address: { ...formData.address, city: e.target.value }
                        })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="state">Estado *</Label>
                      <Input
                        id="state"
                        value={formData.address.state}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          address: { ...formData.address, state: e.target.value }
                        })}
                        required
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="zipCode">CEP *</Label>
                    <Input
                      id="zipCode"
                      value={formData.address.zipCode}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        address: { ...formData.address, zipCode: e.target.value }
                      })}
                      required
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Forma de Pagamento */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Forma de Pagamento
                </CardTitle>
                <CardDescription>
                  Todos os pagamentos serão processados na entrega através da maquineta
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <label className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={PaymentMethod.PIX}
                      checked={formData.paymentMethod === PaymentMethod.PIX}
                      onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                      className="text-primary"
                    />
                    <div>
                      <div className="font-medium">PIX</div>
                      <div className="text-sm text-gray-600">Código PIX gerado na maquineta na entrega</div>
                    </div>
                  </label>
                  
                  <label className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={PaymentMethod.CREDIT_CARD}
                      checked={formData.paymentMethod === PaymentMethod.CREDIT_CARD}
                      onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                      className="text-primary"
                    />
                    <div>
                      <div className="font-medium">Cartão de Crédito</div>
                      <div className="text-sm text-gray-600">Pagamento na maquineta na entrega</div>
                    </div>
                  </label>
                  
                  <label className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={PaymentMethod.CASH}
                      checked={formData.paymentMethod === PaymentMethod.CASH}
                      onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                      className="text-primary"
                    />
                    <div>
                      <div className="font-medium">Dinheiro</div>
                      <div className="text-sm text-gray-600">Pagamento em dinheiro na entrega</div>
                    </div>
                  </label>
                </div>
                
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">i</span>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-blue-900">Informação Importante</h4>
                      <p className="text-sm text-blue-700 mt-1">
                        O pagamento será processado na entrega através da maquineta. 
                        Para PIX, o código será gerado no momento da entrega.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Observações */}
            <Card>
              <CardHeader>
                <CardTitle>Observações</CardTitle>
                <CardDescription>
                  Adicione observações especiais para seu pedido
                </CardDescription>
              </CardHeader>
              <CardContent>
                <textarea
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Ex: Sem cebola, bem assada..."
                />
              </CardContent>
            </Card>

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={isLoading}
            >
              {isLoading ? 'Processando...' : 'Finalizar Pedido'}
            </Button>
          </form>
        </div>
      </main>
    </div>
  )
}
