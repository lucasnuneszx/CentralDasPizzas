'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, MapPin, CreditCard, Truck, Home, User, Phone, Mail } from 'lucide-react'
import toast from 'react-hot-toast'
import { ErrorBoundary } from '@/components/error-boundary'

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
  return (
    <ErrorBoundary>
      <CheckoutPublicContent />
    </ErrorBoundary>
  )
}

function CheckoutPublicContent() {
  const router = useRouter()
  const { data: session } = useSession()
  const [cart, setCart] = useState<CartItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [addresses, setAddresses] = useState<any[]>([])
  const [deliveryAreas, setDeliveryAreas] = useState<any[]>([])
  
  const [formData, setFormData] = useState<{
    deliveryType: string
    paymentMethod: string
    notes: string
    customerName: string
    customerPhone: string
    customerEmail: string
    selectedAddressId: string
    selectedDeliveryAreaId: string
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
    selectedAddressId: '',
    selectedDeliveryAreaId: '',
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

  const [settings, setSettings] = useState<any>(null)

  const loadUserData = useCallback(() => {
    if (session?.user) {
      setFormData(prev => ({
        ...prev,
        customerName: session.user.name || '',
        customerEmail: session.user.email || '',
        customerPhone: (session.user as any).phone || ''
      }))
    }
  }, [session?.user])

  useEffect(() => {
    loadCartFromStorage()
    loadSettings()
    loadDeliveryAreas()
    if (session?.user) {
      loadUserData()
      loadUserAddresses()
    }
  }, [session, loadUserData])

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/settings')
      if (response.ok) {
        const settingsData = await response.json()
        setSettings(settingsData)
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error)
    }
  }

  const loadDeliveryAreas = async () => {
    try {
      const response = await fetch('/api/delivery-areas')
      if (response.ok) {
        const areasData = await response.json()
        setDeliveryAreas(areasData)
      }
    } catch (error) {
      console.error('Erro ao carregar áreas de entrega:', error)
    }
  }

  const loadUserAddresses = async () => {
    try {
      const response = await fetch('/api/addresses')
      if (response.ok) {
        const userAddresses = await response.json()
        setAddresses(userAddresses)
        
        // Selecionar endereço padrão automaticamente
        const defaultAddress = userAddresses.find((addr: any) => addr.isDefault)
        if (defaultAddress) {
          setFormData(prev => ({ ...prev, selectedAddressId: defaultAddress.id }))
        }
      }
    } catch (error) {
      console.error('Erro ao carregar endereços:', error)
    }
  }

  const loadCartFromStorage = async () => {
    const savedCart = localStorage.getItem('cart')
    if (savedCart) {
      try {
        const cartData = JSON.parse(savedCart)
        
        // Verificar se é o formato novo (array) ou antigo (objeto)
        if (Array.isArray(cartData)) {
          // Formato novo - usar diretamente
          setCart(cartData)
        } else {
          // Formato antigo - converter para novo formato
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
          } else {
            console.error('Erro ao buscar categorias')
            setCart([])
          }
        }
      } catch (error) {
        console.error('Erro ao carregar carrinho:', error)
        setCart([])
      }
    } else {
      setCart([])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Validar se há itens no carrinho
    if (cart.length === 0) {
      toast.error('Carrinho vazio')
      setIsLoading(false)
      return
    }

    if (formData.deliveryType === DeliveryType.DELIVERY) {
      // Para usuários logados, verificar se selecionou um endereço
      if (session?.user) {
        if (!formData.selectedAddressId) {
          toast.error('Selecione um endereço para entrega')
          setIsLoading(false)
          return
        }
      } else {
        // Para usuários não logados, validar endereço manual e área de entrega
        if (!formData.address.street || !formData.address.number || !formData.address.city || !formData.address.state || !formData.selectedDeliveryAreaId) {
          toast.error('Preencha todos os campos do endereço e selecione o bairro para entrega')
          setIsLoading(false)
          return
        }
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
          email: formData.customerEmail || ''
        },
        // Para usuários logados, usar addressId; para não logados, usar address
        addressId: session?.user && formData.selectedAddressId ? formData.selectedAddressId : null,
        address: !session?.user && formData.deliveryType === DeliveryType.DELIVERY ? formData.address : null
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
      console.error('Erro ao realizar pedido:', error)
      toast.error('Erro ao realizar pedido')
    } finally {
      setIsLoading(false)
    }
  }

  const getTotalPrice = () => {
    try {
      return cart.reduce((total, item) => {
        const price = item.combo?.price || 0
        const quantity = item.quantity || 0
        return total + (price * quantity)
      }, 0)
    } catch (error) {
      console.error('Erro ao calcular total:', error)
      return 0
    }
  }

  const getDeliveryFee = () => {
    if (formData.deliveryType === DeliveryType.DELIVERY) {
      // Se usuário logado, usar taxa do endereço selecionado
      if (session?.user && formData.selectedAddressId) {
        const selectedAddress = addresses.find(addr => addr.id === formData.selectedAddressId)
        if (selectedAddress) {
          // Buscar área de entrega correspondente ao endereço
          const deliveryArea = deliveryAreas.find(area => 
            area.name === selectedAddress.neighborhood && 
            area.city === selectedAddress.city
          )
          return deliveryArea?.deliveryFee || settings?.deliveryFee || 5.00
        }
      }
      
      // Se usuário não logado, usar área selecionada
      if (!session?.user && formData.selectedDeliveryAreaId) {
        const selectedArea = deliveryAreas.find(area => area.id === formData.selectedDeliveryAreaId)
        return selectedArea?.deliveryFee || settings?.deliveryFee || 5.00
      }
      
      // Fallback para taxa padrão
      return settings?.deliveryFee || 5.00
    }
    return 0
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
                   {session?.user ? 'Seus dados estão preenchidos automaticamente' : 'Preencha seus dados para o pedido'}
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
                       disabled={!!session?.user}
                     />
                   </div>
                   <div>
                     <Label htmlFor="customerPhone">Telefone *</Label>
                     <Input
                       id="customerPhone"
                       value={formData.customerPhone}
                       onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                       required
                       disabled={!!session?.user}
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
                     disabled={!!session?.user}
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
                       <div className="text-sm text-gray-600">
                         Taxa: R$ {getDeliveryFee().toFixed(2).replace('.', ',')}
                         {formData.selectedDeliveryAreaId && (
                           <span className="text-xs text-green-600 ml-1">
                             (Taxa do bairro selecionado)
                           </span>
                         )}
                       </div>
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
                   {session?.user && addresses.length > 0 ? (
                     // Usuário logado - mostrar endereços salvos
                     <div className="space-y-3">
                       <Label>Selecione um endereço:</Label>
                       {addresses.map((address) => (
                         <label key={address.id} className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                           <input
                             type="radio"
                             name="selectedAddress"
                             value={address.id}
                             checked={formData.selectedAddressId === address.id}
                             onChange={(e) => setFormData({ ...formData, selectedAddressId: e.target.value })}
                             className="text-primary"
                           />
                           <div className="flex-1">
                             <div className="font-medium">
                               {address.street}, {address.number}
                               {address.complement && ` - ${address.complement}`}
                             </div>
                             <div className="text-sm text-gray-600">
                               {address.neighborhood}, {address.city} - {address.state}
                             </div>
                             <div className="text-sm text-gray-500">
                               CEP: {address.zipCode}
                             </div>
                           </div>
                         </label>
                       ))}
                     </div>
                   ) : (
                     // Usuário não logado - campos manuais
                     <>
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
                         <Label htmlFor="deliveryArea">Bairro *</Label>
                         <select
                           id="deliveryArea"
                           value={formData.selectedDeliveryAreaId}
                           onChange={(e) => setFormData({ ...formData, selectedDeliveryAreaId: e.target.value })}
                           className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                           required
                         >
                           <option value="">Selecione seu bairro</option>
                           {deliveryAreas
                             .filter(area => area.isActive)
                             .sort((a, b) => a.name.localeCompare(b.name))
                             .map((area) => (
                               <option key={area.id} value={area.id}>
                                 {area.name} - {area.city} (Taxa: R$ {area.deliveryFee.toFixed(2).replace('.', ',')})
                               </option>
                             ))}
                         </select>
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
                     </>
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
