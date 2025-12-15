'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ProtectedRoute } from '@/components/protected-route'
import { UserRole, PaymentMethod, DeliveryType } from '@/lib/constants'
import { ArrowLeft, MapPin, CreditCard, Truck, Home } from 'lucide-react'
import toast from 'react-hot-toast'
import { SiteLogo } from '@/components/site-logo'

interface Address {
  id: string
  street: string
  number: string
  complement?: string
  neighborhood: string
  city: string
  state: string
  zipCode: string
  isDefault: boolean
}

interface CartItem {
  combo: {
    id: string
    name: string
    price: number
  }
  quantity: number
}

export default function Checkout() {
  const { user } = useAuth()
  const router = useRouter()
  const [addresses, setAddresses] = useState<Address[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showAddressForm, setShowAddressForm] = useState(false)
  
  const [formData, setFormData] = useState<{
    deliveryType: DeliveryType
    paymentMethod: PaymentMethod
    selectedAddressId: string
    notes: string
  }>({
    deliveryType: DeliveryType.DELIVERY,
    paymentMethod: PaymentMethod.PIX,
    selectedAddressId: '',
    notes: ''
  })

  const [addressForm, setAddressForm] = useState({
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    zipCode: '',
    isDefault: false
  })

  useEffect(() => {
    fetchAddresses()
    loadCartFromStorage()
  }, [])

  const fetchAddresses = async () => {
    try {
      const response = await fetch('/api/addresses')
      const data = await response.json()
      setAddresses(data)
      
      // Selecionar endereço padrão automaticamente
      const defaultAddress = data.find((addr: Address) => addr.isDefault)
      if (defaultAddress) {
        setFormData(prev => ({ ...prev, selectedAddressId: defaultAddress.id }))
      }
    } catch (error) {
      console.error('Erro ao carregar endereços:', error)
    }
  }

  const loadCartFromStorage = () => {
    const savedCart = localStorage.getItem('cart')
    if (savedCart) {
      setCart(JSON.parse(savedCart))
    }
  }

  const saveAddress = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch('/api/addresses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(addressForm),
      })

      if (response.ok) {
        toast.success('Endereço salvo!')
        setShowAddressForm(false)
        setAddressForm({
          street: '',
          number: '',
          complement: '',
          neighborhood: '',
          city: '',
          state: '',
          zipCode: '',
          isDefault: false
        })
        fetchAddresses()
      } else {
        toast.error('Erro ao salvar endereço')
      }
    } catch (error) {
      toast.error('Erro ao salvar endereço')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    if (formData.deliveryType === DeliveryType.DELIVERY && !formData.selectedAddressId) {
      toast.error('Selecione um endereço para entrega')
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
        addressId: formData.deliveryType === DeliveryType.DELIVERY ? formData.selectedAddressId : null,
        notes: formData.notes,
        total: getTotalPrice()
      }

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      })

      const result = await response.json()

      if (response.ok && result.success !== false) {
        toast.success('Pedido realizado com sucesso!')
        localStorage.removeItem('cart')
        // Garantir redirect para meus pedidos
        setTimeout(() => {
          router.push('/client/orders')
          window.location.href = '/client/orders'
        }, 500)
      } else {
        const errorMsg = result.message || result.error || 'Erro ao realizar pedido'
        toast.error(errorMsg)
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

  return (
    <ProtectedRoute allowedRoles={[UserRole.CLIENT]}>
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
                        onChange={(e) => setFormData({ ...formData, deliveryType: e.target.value as DeliveryType })}
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
                        onChange={(e) => setFormData({ ...formData, deliveryType: e.target.value as DeliveryType })}
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
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <MapPin className="h-5 w-5" />
                        Endereço de Entrega
                      </span>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowAddressForm(true)}
                      >
                        Novo Endereço
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {addresses.length === 0 ? (
                      <p className="text-gray-600 text-center py-4">
                        Nenhum endereço cadastrado. Adicione um endereço para continuar.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {addresses.map((address) => (
                          <label
                            key={address.id}
                            className="flex items-start space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                          >
                            <input
                              type="radio"
                              name="address"
                              value={address.id}
                              checked={formData.selectedAddressId === address.id}
                              onChange={(e) => setFormData({ ...formData, selectedAddressId: e.target.value })}
                              className="text-primary mt-1"
                            />
                            <div>
                              <div className="font-medium">
                                {address.street}, {address.number}
                                {address.complement && ` - ${address.complement}`}
                              </div>
                              <div className="text-sm text-gray-600">
                                {address.neighborhood}, {address.city} - {address.state}
                              </div>
                              <div className="text-sm text-gray-600">
                                CEP: {address.zipCode}
                              </div>
                              {address.isDefault && (
                                <span className="text-xs bg-primary text-white px-2 py-1 rounded-full">
                                  Padrão
                                </span>
                              )}
                            </div>
                          </label>
                        ))}
                      </div>
                    )}
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
                        onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value as PaymentMethod })}
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
                        onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value as PaymentMethod })}
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
                        onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value as PaymentMethod })}
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

        {/* Modal de Novo Endereço */}
        {showAddressForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50">
            <div className="fixed inset-0 flex items-center justify-center p-4">
              <Card className="w-full max-w-md">
                <CardHeader>
                  <CardTitle>Novo Endereço</CardTitle>
                  <CardDescription>
                    Adicione um novo endereço de entrega
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={saveAddress} className="space-y-4">
                    <div>
                      <Label htmlFor="street">Rua</Label>
                      <Input
                        id="street"
                        value={addressForm.street}
                        onChange={(e) => setAddressForm({ ...addressForm, street: e.target.value })}
                        required
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="number">Número</Label>
                        <Input
                          id="number"
                          value={addressForm.number}
                          onChange={(e) => setAddressForm({ ...addressForm, number: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="complement">Complemento</Label>
                        <Input
                          id="complement"
                          value={addressForm.complement}
                          onChange={(e) => setAddressForm({ ...addressForm, complement: e.target.value })}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="neighborhood">Bairro</Label>
                      <Input
                        id="neighborhood"
                        value={addressForm.neighborhood}
                        onChange={(e) => setAddressForm({ ...addressForm, neighborhood: e.target.value })}
                        required
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="city">Cidade</Label>
                        <Input
                          id="city"
                          value={addressForm.city}
                          onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="state">Estado</Label>
                        <Input
                          id="state"
                          value={addressForm.state}
                          onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="zipCode">CEP</Label>
                      <Input
                        id="zipCode"
                        value={addressForm.zipCode}
                        onChange={(e) => setAddressForm({ ...addressForm, zipCode: e.target.value })}
                        required
                      />
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="isDefault"
                        checked={addressForm.isDefault}
                        onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                        className="rounded border-gray-300"
                      />
                      <Label htmlFor="isDefault">Endereço padrão</Label>
                    </div>
                    
                    <div className="flex justify-end space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowAddressForm(false)}
                      >
                        Cancelar
                      </Button>
                      <Button type="submit" disabled={isLoading}>
                        {isLoading ? 'Salvando...' : 'Salvar'}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-gray-50 border-t mt-16">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            {/* Logo na parte inferior esquerda */}
            <div className="flex items-center">
              <SiteLogo />
            </div>
            
            {/* Informações centrais */}
            <div className="text-center">
              <p className="text-gray-600 text-sm">
                &copy; 2024 Central das Pizzas. Todos os direitos reservados.
              </p>
              <p className="text-gray-500 text-xs mt-2">
                Powered By: <span className="font-semibold">Lucas Nunes</span>
              </p>
            </div>
            
            {/* Espaço vazio para balancear o layout */}
            <div className="w-32"></div>
          </div>
        </div>
      </footer>
    </ProtectedRoute>
  )
}



