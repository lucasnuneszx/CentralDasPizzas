'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Plus, Minus, X, ShoppingCart, ChefHat } from 'lucide-react'
import Image from 'next/image'
import { CustomizedItem, PizzaFlavor, PizzaSize, Combo } from '@/types/cart'

interface ItemCustomizerProps {
  item: Combo
  onAddToCart: (item: CustomizedItem) => void
  onClose: () => void
}

export default function ItemCustomizer({ item, onAddToCart, onClose }: ItemCustomizerProps) {
  const [flavors, setFlavors] = useState<PizzaFlavor[]>([])
  const [sizes, setSizes] = useState<PizzaSize[]>([])
  const [selectedSize, setSelectedSize] = useState<PizzaSize | null>(null)
  const [selectedFlavors, setSelectedFlavors] = useState<PizzaFlavor[]>([])
  const [observations, setObservations] = useState('')
  const [stuffedCrust, setStuffedCrust] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (item.isPizza) {
      fetchPizzaData()
    } else {
      setLoading(false)
    }
  }, [item])

  const fetchPizzaData = async () => {
    try {
      const [flavorsRes, sizesRes] = await Promise.all([
        fetch('/api/pizza-flavors'),
        fetch('/api/pizza-sizes')
      ])

      if (flavorsRes.ok && sizesRes.ok) {
        const flavorsData = await flavorsRes.json()
        const sizesData = await sizesRes.json()
        
        setFlavors(flavorsData)
        setSizes(sizesData)
        
        // Selecionar o primeiro tamanho por padrão
        if (sizesData.length > 0) {
          setSelectedSize(sizesData[0])
        }
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSizeSelect = (size: PizzaSize) => {
    setSelectedSize(size)
    // Limitar sabores selecionados ao máximo do novo tamanho
    if (selectedFlavors.length > size.maxFlavors) {
      setSelectedFlavors(selectedFlavors.slice(0, size.maxFlavors))
    }
  }

  const handleFlavorToggle = (flavor: PizzaFlavor) => {
    if (selectedFlavors.find(f => f.id === flavor.id)) {
      // Remover sabor
      setSelectedFlavors(selectedFlavors.filter(f => f.id !== flavor.id))
    } else {
      // Adicionar sabor (se não exceder o limite)
      if (selectedSize && selectedFlavors.length < selectedSize.maxFlavors) {
        setSelectedFlavors([...selectedFlavors, flavor])
      }
    }
  }

  const calculatePrice = () => {
    if (item.isPizza && selectedSize) {
      let total = selectedSize.basePrice

      // Adicionar preços extras para sabores premium e especiais
      const premiumCount = selectedFlavors.filter(f => f.type === 'PREMIUM').length
      const especialCount = selectedFlavors.filter(f => f.type === 'ESPECIAL').length

      // R$ 15,00 por sabor premium quando misturado
      if (premiumCount > 0 && selectedFlavors.length > 1) {
        total += premiumCount * 15.00
      }

      // R$ 20,00 por sabor especial
      total += especialCount * 20.00

      // Borda recheada
      if (stuffedCrust) {
        total += 4.99
      }

      return total * quantity
    } else {
      return item.price * quantity
    }
  }

  const handleAddToCart = () => {
    const customizedItem: CustomizedItem = {
      id: `${item.id}-${Date.now()}`,
      combo: item,
      quantity,
      size: selectedSize || undefined,
      flavors: selectedFlavors.length > 0 ? selectedFlavors : undefined,
      observations,
      stuffedCrust,
      totalPrice: calculatePrice()
    }

    onAddToCart(customizedItem)
  }

  const getFlavorTypeColor = (type: string) => {
    switch (type) {
      case 'TRADICIONAL':
        return 'bg-green-100 text-green-800'
      case 'PREMIUM':
        return 'bg-blue-100 text-blue-800'
      case 'ESPECIAL':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-red-500 border-t-transparent mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando opções...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {item.image && (
              <div className="w-12 h-12 relative rounded-lg overflow-hidden">
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  className="object-cover"
                />
              </div>
            )}
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{item.name}</h2>
              <p className="text-sm text-gray-600">{item.description}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-4 space-y-6">
          {/* Quantidade */}
          <div className="flex items-center justify-between">
            <Label className="text-base font-medium text-gray-900">Quantidade</Label>
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-8 text-center font-medium text-gray-900">{quantity}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setQuantity(quantity + 1)}
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Personalização de Pizza */}
          {item.isPizza && (
            <>
              {/* Seleção de Tamanho */}
              <div>
                <Label className="text-base font-medium mb-3 block text-gray-900">Tamanho da Pizza</Label>
                <div className="grid grid-cols-2 gap-3">
                  {sizes.map((size) => (
                    <Button
                      key={size.id}
                      variant={selectedSize?.id === size.id ? "default" : "outline"}
                      className={`h-auto p-3 flex flex-col items-center space-y-1 ${
                        selectedSize?.id === size.id 
                          ? "bg-red-500 text-white hover:bg-red-600" 
                          : "border-gray-300 text-gray-700 hover:bg-gray-50"
                      }`}
                      onClick={() => handleSizeSelect(size)}
                    >
                      <div className="font-semibold">{size.name}</div>
                      <div className="text-xs opacity-80">{size.slices} fatias</div>
                      <div className="text-xs opacity-80">Até {size.maxFlavors} sabores</div>
                      <div className="font-bold">R$ {size.basePrice.toFixed(2).replace('.', ',')}</div>
                    </Button>
                  ))}
                </div>
              </div>

              {/* Seleção de Sabores */}
              {selectedSize && (
                <div>
                  <Label className="text-base font-medium mb-3 block text-gray-900">
                    Sabores da Pizza
                    <span className="text-sm text-gray-500 ml-2">
                      ({selectedFlavors.length}/{selectedSize.maxFlavors})
                    </span>
                  </Label>
                  <div className="space-y-4">
                    {['TRADICIONAL', 'PREMIUM', 'ESPECIAL'].map((type) => {
                      const typeFlavors = flavors.filter(f => f.type === type)
                      if (typeFlavors.length === 0) return null

                      return (
                        <div key={type}>
                          <h4 className="text-sm font-semibold mb-2 capitalize text-gray-700">
                            {type.toLowerCase()}
                          </h4>
                          <div className="grid grid-cols-1 gap-2">
                            {typeFlavors.map((flavor) => {
                              const isSelected = selectedFlavors.find(f => f.id === flavor.id)
                              const canSelect = !isSelected && selectedFlavors.length < selectedSize.maxFlavors

                              return (
                                <div
                                  key={flavor.id}
                                  className={`p-3 border rounded-lg cursor-pointer transition-all ${
                                    isSelected
                                      ? 'border-red-500 bg-red-50'
                                      : canSelect
                                      ? 'border-gray-200 hover:border-red-300 hover:bg-red-50'
                                      : 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
                                  }`}
                                  onClick={() => canSelect && handleFlavorToggle(flavor)}
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                      <div className="flex items-center space-x-2 mb-1">
                                        <span className="font-medium text-sm">{flavor.name}</span>
                                        <Badge className={`text-xs ${getFlavorTypeColor(flavor.type)}`}>
                                          {flavor.type}
                                        </Badge>
                                      </div>
                                      <p className="text-xs text-gray-600">{flavor.description}</p>
                                    </div>
                                    {isSelected && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          handleFlavorToggle(flavor)
                                        }}
                                        className="h-6 w-6 p-0"
                                      >
                                        <X className="h-3 w-3" />
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Borda Recheada */}
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-medium">Borda Recheada</Label>
                  <p className="text-sm text-gray-600">+ R$ 4,99</p>
                </div>
                <Switch
                  checked={stuffedCrust}
                  onCheckedChange={setStuffedCrust}
                />
              </div>
            </>
          )}

          {/* Observações */}
          <div>
            <Label className="text-base font-medium mb-2 block text-gray-900">
              Observações
            </Label>
            <Textarea
              placeholder="Alguma observação especial para este item?"
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              rows={3}
              className="border-gray-300 text-gray-900 placeholder-gray-500 focus:border-red-500 focus:ring-red-500"
            />
          </div>
        </div>

        {/* Footer com preço e botão */}
        <div className="sticky bottom-0 bg-white border-t p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-red-600">
                R$ {calculatePrice().toFixed(2).replace('.', ',')}
              </div>
              <div className="text-sm text-gray-600">
                {quantity}x {item.name}
              </div>
            </div>
            <Button
              onClick={handleAddToCart}
              className="bg-red-500 hover:bg-red-600 text-white px-6 font-semibold"
              size="lg"
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              Adicionar ao Carrinho
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
