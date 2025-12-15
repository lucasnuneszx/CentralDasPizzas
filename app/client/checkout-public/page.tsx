'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, MapPin, CreditCard, Truck, Home, User, Phone, Mail } from 'lucide-react'
import toast from 'react-hot-toast'
import { ErrorBoundary } from '@/components/error-boundary'
import { SiteLogo } from '@/components/site-logo'

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
  const { user } = useAuth()
  const [cart, setCart] = useState<CartItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [addresses, setAddresses] = useState<any[]>([])
  const [deliveryAreas, setDeliveryAreas] = useState<any[]>([])
  const [deliveryFee, setDeliveryFee] = useState(0) // Estado separado para taxa de entrega
  
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

  const loadUserData = useCallback(async () => {
    if (user) {
      try {
        // Buscar dados completos do usuário da API
        const userResponse = await fetch('/api/user/me')
        if (userResponse.ok) {
          const userData = await userResponse.json()
          setFormData(prev => ({
            ...prev,
            customerName: userData.name || user.name || '',
            customerEmail: userData.email || user.email || '',
            customerPhone: userData.phone || ''
          }))
        } else {
          // Fallback para dados do usuário
          setFormData(prev => ({
            ...prev,
            customerName: user.name || '',
            customerEmail: user.email || '',
            customerPhone: ''
          }))
        }
      } catch (error) {
        console.error('Erro ao carregar dados do usuário:', error)
        // Fallback para dados do usuário
        setFormData(prev => ({
          ...prev,
          customerName: user.name || '',
          customerEmail: user.email || '',
          customerPhone: ''
        }))
      }
    }
  }, [user])

  useEffect(() => {
    loadCartFromStorage()
    loadSettings()
    loadDeliveryAreas()
    if (user) {
      loadUserData()
      loadUserAddresses()
    }
  }, [user, loadUserData])


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
      // Para usuários logados, verificar se selecionou um endereço ou forneceu um novo
      if (user) {
        if (!formData.selectedAddressId && (!formData.address.street || !formData.address.number || !formData.address.city || !formData.address.state)) {
          toast.error('Selecione um endereço ou preencha um novo endereço para entrega')
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
    if (!formData.customerName) {
      toast.error('Preencha o nome')
      setIsLoading(false)
      return
    }

    try {
      // Se usuário não logado e entrega, salvar endereço
      let savedAddressId = formData.selectedAddressId
      if (!user && formData.deliveryType === DeliveryType.DELIVERY && formData.address.street) {
        try {
          // Criar endereço temporário para o pedido
          // Nota: Em produção, você pode querer criar um usuário temporário ou salvar de outra forma
          // Por enquanto, vamos incluir o endereço no pedido diretamente
        } catch (error) {
          console.error('Erro ao processar endereço:', error)
        }
      }

      // Calcular total diretamente aqui para garantir que está correto
      const subtotal = getTotalPrice()
      const finalDeliveryFee = formData.deliveryType === DeliveryType.DELIVERY ? deliveryFee : 0
      const finalTotal = subtotal + finalDeliveryFee
      
      console.log('Cálculo do total:', {
        subtotal,
        deliveryFee: finalDeliveryFee,
        finalTotal,
        cartLength: cart.length,
        deliveryType: formData.deliveryType
      })
      
      // Validar que o total é válido
      if (!finalTotal || finalTotal <= 0 || isNaN(finalTotal)) {
        console.error('Total inválido calculado:', { subtotal, finalDeliveryFee, finalTotal })
        toast.error('Erro ao calcular total do pedido. Verifique os itens do carrinho.')
        setIsLoading(false)
        return
      }

      const orderData = {
        items: cart.map((item: any) => {
          const customizedItem = item as any
          
          // Validar que combo existe e tem id
          if (!customizedItem.combo || !customizedItem.combo.id) {
            console.error('Item sem combo válido:', customizedItem)
            throw new Error('Item do carrinho inválido: combo não encontrado')
          }
          
          return {
            comboId: customizedItem.combo.id,
            quantity: customizedItem.quantity || 1,
            price: customizedItem.totalPrice || customizedItem.combo.price || 0,
            // Incluir dados de personalização
            flavors: customizedItem.flavors ? customizedItem.flavors.map((f: any) => f.id || f) : undefined,
            flavorsPizza2: customizedItem.flavorsPizza2 ? customizedItem.flavorsPizza2.map((f: any) => f.id || f) : undefined,
            extraItems: customizedItem.extraItems || undefined,
            size: customizedItem.size ? customizedItem.size.id : undefined,
            observations: customizedItem.observations || undefined,
            stuffedCrust: customizedItem.stuffedCrust || false
          }
        }),
        deliveryType: formData.deliveryType,
        paymentMethod: formData.paymentMethod,
        notes: formData.notes,
        total: finalTotal,
        customer: {
          name: formData.customerName,
          phone: formData.customerPhone || '',
          email: formData.customerEmail || ''
        },
        // Para usuários logados: se selecionou endereço existente, usar addressId; se forneceu novo endereço, usar address
        // Para não logados, sempre usar address
        addressId: user && formData.selectedAddressId ? formData.selectedAddressId : null,
        address: formData.deliveryType === DeliveryType.DELIVERY && 
                 (!user || (!formData.selectedAddressId && formData.address.street)) 
                 ? {
                     ...formData.address,
                     // Se não logado e selecionou bairro, usar dados do bairro selecionado
                     neighborhood: !user && formData.selectedDeliveryAreaId 
                       ? deliveryAreas.find(a => a.id === formData.selectedDeliveryAreaId)?.name || formData.address.neighborhood
                       : formData.address.neighborhood,
                     city: !user && formData.selectedDeliveryAreaId 
                       ? deliveryAreas.find(a => a.id === formData.selectedDeliveryAreaId)?.city || formData.address.city
                       : formData.address.city
                   } : null
      }

      console.log('Dados do pedido sendo enviados:', orderData)

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      })

      const result = await response.json()
      
      if (response.ok && result.success !== false) {
        console.log('Pedido criado com sucesso:', result)
        toast.success('Pedido realizado com sucesso!')
        localStorage.removeItem('cart')
        // Garantir redirect para meus pedidos
        setTimeout(() => {
          router.push('/client/orders')
          window.location.href = '/client/orders'
        }, 500)
      } else {
        console.error('Erro na resposta:', result)
        const errorMsg = result.message || result.error || 'Erro ao realizar pedido'
        toast.error(errorMsg)
        console.error('Detalhes completos do erro:', result)
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
      return cart.reduce((total, item: any) => {
        const customizedItem = item as any
        const price = customizedItem.totalPrice || customizedItem.combo?.price || 0
        const quantity = customizedItem.quantity || 0
        return total + (price * quantity)
      }, 0)
    } catch (error) {
      console.error('Erro ao calcular total:', error)
      return 0
    }
  }

  // Calcular taxa de entrega e atualizar estado
  useEffect(() => {
    let fee = 0
    if (formData.deliveryType === DeliveryType.DELIVERY) {
      // Se usuário logado, usar taxa do endereço selecionado
      if (user && formData.selectedAddressId) {
        const selectedAddress = addresses.find(addr => addr.id === formData.selectedAddressId)
        if (selectedAddress) {
          const deliveryArea = deliveryAreas.find(area => 
            area.name === selectedAddress.neighborhood && 
            area.city === selectedAddress.city &&
            area.isActive
          )
          if (deliveryArea && deliveryArea.deliveryFee) {
            fee = deliveryArea.deliveryFee
          }
        }
      } else if (!user && formData.selectedDeliveryAreaId) {
        // Se usuário não logado, usar área selecionada
        const selectedArea = deliveryAreas.find(area => 
          area.id === formData.selectedDeliveryAreaId && 
          area.isActive
        )
        if (selectedArea && selectedArea.deliveryFee) {
          fee = selectedArea.deliveryFee
        }
      }
    }
    setDeliveryFee(fee)
  }, [formData.deliveryType, formData.selectedAddressId, formData.selectedDeliveryAreaId, user, addresses, deliveryAreas])

  const getDeliveryFee = () => {
    return deliveryFee
  }

  const getFinalTotal = useCallback(() => {
    return getTotalPrice() + deliveryFee
  }, [deliveryFee])

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
                   {user ? 'Seus dados estão preenchidos automaticamente' : 'Preencha seus dados para o pedido'}
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
                       disabled={!!user}
                       readOnly={!!user}
                     />
                   </div>
                   <div>
                     <Label htmlFor="customerPhone">Telefone (opcional)</Label>
                     <Input
                       id="customerPhone"
                       value={formData.customerPhone}
                       onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                       disabled={!!user}
                       readOnly={!!user}
                       placeholder="Opcional"
                     />
                   </div>
                 </div>
                 <div>
                   <Label htmlFor="customerEmail">E-mail</Label>
                   <Input
                     id="customerEmail"
                     type="email"
                     value={formData.customerEmail}
                     onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                     disabled={!!user}
                     readOnly={!!user}
                     required={!user}
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
                  {cart.map((item: any) => {
                    const customizedItem = item as any
                    const pizzaQuantity = customizedItem.pizzaQuantity || 1
                    
                    return (
                      <div key={customizedItem.id || customizedItem.combo.id} className="border-b pb-3 last:border-0">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <div className="font-medium">{customizedItem.combo.name}</div>
                            <div className="text-sm text-gray-600">x{customizedItem.quantity}</div>
                            
                            {/* Sabores Pizza 1 */}
                            {customizedItem.flavors && customizedItem.flavors.length > 0 && (
                              <div className="text-sm text-gray-700 mt-1">
                                <span className="font-semibold">Sabores:</span> {customizedItem.flavors.map((f: any) => f.name).join(', ')}
                              </div>
                            )}
                            
                            {/* Sabores Pizza 2 (se houver) */}
                            {pizzaQuantity > 1 && customizedItem.flavorsPizza2 && customizedItem.flavorsPizza2.length > 0 && (
                              <div className="text-sm text-gray-700 mt-1">
                                <span className="font-semibold">Sabores:</span> {customizedItem.flavorsPizza2.map((f: any) => f.name).join(', ')}
                              </div>
                            )}
                            
                            {/* Itens Extras */}
                            {customizedItem.extraItems && Object.keys(customizedItem.extraItems).length > 0 && (
                              <div className="text-sm text-gray-700 mt-1 space-y-1">
                                {Object.entries(customizedItem.extraItems).map(([key, value]: [string, any]) => {
                                  // Buscar nome do item extra (precisa buscar da API ou ter no item)
                                  const extraItemName = value.name || `Item Extra ${key}`
                                  return (
                                    <div key={key}>
                                      {value.quantity}x {extraItemName}
                                    </div>
                                  )
                                })}
                              </div>
                            )}
                          </div>
                          <span className="font-medium ml-4">
                            R$ {((customizedItem.totalPrice || customizedItem.combo.price) * customizedItem.quantity).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    )
                  })}
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
                   {user && addresses.length > 0 ? (
                     // Usuário logado - mostrar endereços salvos
                     <div className="space-y-3">
                       <div className="flex items-center justify-between">
                         <Label>Selecione um endereço ou adicione um novo:</Label>
                         <Button
                           type="button"
                           variant="outline"
                           size="sm"
                           onClick={() => {
                             setFormData({ ...formData, selectedAddressId: '', address: {
                               street: '',
                               number: '',
                               complement: '',
                               neighborhood: '',
                               city: '',
                               state: '',
                               zipCode: ''
                             }})
                           }}
                         >
                           + Novo Endereço
                         </Button>
                       </div>
                       {formData.selectedAddressId ? (
                         <>
                           {addresses.map((address) => (
                             <label key={address.id} className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                               <input
                                 type="radio"
                                 name="selectedAddress"
                                 value={address.id}
                                 checked={formData.selectedAddressId === address.id}
                                 onChange={(e) => setFormData({ ...formData, selectedAddressId: e.target.value, address: {
                                   street: '',
                                   number: '',
                                   complement: '',
                                   neighborhood: '',
                                   city: '',
                                   state: '',
                                   zipCode: ''
                                 }})}
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
                         </>
                       ) : (
                         // Formulário para novo endereço
                         <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
                           <Label className="text-lg font-semibold">Novo Endereço</Label>
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
                         </div>
                       )}
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
                          onChange={(e) => {
                            const newAreaId = e.target.value
                            setFormData({ ...formData, selectedDeliveryAreaId: newAreaId })
                            // Atualizar taxa imediatamente
                            if (newAreaId && formData.deliveryType === DeliveryType.DELIVERY) {
                              const selectedArea = deliveryAreas.find(area => 
                                area.id === newAreaId && area.isActive
                              )
                              if (selectedArea && selectedArea.deliveryFee) {
                                setDeliveryFee(selectedArea.deliveryFee)
                              } else {
                                setDeliveryFee(0)
                              }
                            } else {
                              setDeliveryFee(0)
                            }
                          }}
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
    </div>
  )
}
