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

interface ExtraItem {
  id: string
  name: string
  description?: string
  type: string
  price?: number
  options?: Array<{ id: string; name: string; description?: string; price: number; isActive: boolean }>
}

export default function ItemCustomizer({ item, onAddToCart, onClose }: ItemCustomizerProps) {
  const [flavors, setFlavors] = useState<PizzaFlavor[]>([])
  const [sizes, setSizes] = useState<PizzaSize[]>([])
  const [selectedSize, setSelectedSize] = useState<PizzaSize | null>(null)
  const [selectedFlavors, setSelectedFlavors] = useState<PizzaFlavor[]>([])
  const [selectedFlavorsPizza2, setSelectedFlavorsPizza2] = useState<PizzaFlavor[]>([])
  const [extraItems, setExtraItems] = useState<ExtraItem[]>([])
  const [selectedExtraItems, setSelectedExtraItems] = useState<{ [itemId: string]: { optionId?: string; quantity: number } }>({})
  const [observations, setObservations] = useState('')
  const [stuffedCrust, setStuffedCrust] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const [loading, setLoading] = useState(true)
  const pizzaQuantity = (item as any).pizzaQuantity || 0
  // Apenas combos com pizzas mostram sabores - verificar explicitamente
  const isCombo = (pizzaQuantity > 0) || (item.isPizza === true) // Apenas combos com pizzas mostram sabores

  useEffect(() => {
    // Buscar dados apenas se for um combo (com pizzas)
    if (isCombo) {
      fetchPizzaData()
    } else {
      // Para itens extras (refrigerantes, etc), apenas carregar dados básicos
      fetchExtraItemData()
      setLoading(false)
    }
  }, [item, isCombo])

  const fetchExtraItemData = async () => {
    try {
      // Para itens extras, apenas buscar customizações se houver
      const customizationRes = await fetch(`/api/combos/${item.id}/customization`)
      if (customizationRes.ok) {
        const customizationData = await customizationRes.json()
        const extras = customizationData
          .filter((item: any) => !item.isRequired && item.type !== 'PIZZA')
          .map((item: any) => ({
            id: item.id,
            name: item.name,
            description: item.description,
            type: item.type,
            price: 0,
            options: item.options || []
          }))
        setExtraItems(extras)
      }
    } catch (error) {
      console.error('Erro ao carregar dados do item extra:', error)
    }
  }

  const fetchPizzaData = async () => {
    try {
      const [flavorsRes, sizesRes, customizationRes] = await Promise.all([
        fetch('/api/pizza-flavors'),
        fetch(`/api/pizza-sizes?comboId=${item.id}`),
        fetch(`/api/combos/${item.id}/customization`)
      ])

      if (flavorsRes.ok) {
        const flavorsData = await flavorsRes.json()
        // Filtrar apenas sabores TRADICIONAIS para combos
        const traditionalFlavors = flavorsData.filter((f: PizzaFlavor) => f.type === 'TRADICIONAL')
        setFlavors(traditionalFlavors)
      }
      
      if (sizesRes.ok) {
        const sizesData = await sizesRes.json()
        setSizes(sizesData)
        
        // Selecionar o primeiro tamanho por padrão
        if (sizesData.length > 0) {
          setSelectedSize(sizesData[0])
        }
      }
      
      // Carregar itens extras do combo (refri, batatas, etc)
      if (customizationRes.ok) {
        const customizationData = await customizationRes.json()
        // Armazenar itens extras opcionais (não obrigatórios e não são pizzas)
        const extras = customizationData
          .filter((item: any) => !item.isRequired && item.type !== 'PIZZA')
          .map((item: any) => ({
            id: item.id,
            name: item.name,
            description: item.description,
            type: item.type,
            price: 0, // Preço será das opções se houver
            options: item.options || []
          }))
        setExtraItems(extras)
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
      const maxFlavors = selectedSize ? selectedSize.maxFlavors : 999
      if (selectedFlavors.length < maxFlavors) {
        setSelectedFlavors([...selectedFlavors, flavor])
      }
    }
  }

  const calculatePrice = () => {
    let total = item.price // Preço base do combo
    
    // Se for pizza com tamanho selecionado, usar preço do tamanho
    if ((item.isPizza || pizzaQuantity > 0) && selectedSize) {
      total = selectedSize.basePrice
      
      // Se houver Pizza 2, adicionar preço
      if (pizzaQuantity > 1) {
        total += selectedSize.basePrice
      }
    } else if (item.isPizza || pizzaQuantity > 0) {
      // Se não houver tamanho, usar preço base dividido pela quantidade
      total = (item.price / pizzaQuantity) * pizzaQuantity
    }

    // Adicionar preços dos itens extras selecionados
    Object.entries(selectedExtraItems).forEach(([key, selection]) => {
      // key pode ser "itemId" ou "itemId-optionId"
      const [itemId, optionId] = key.includes('-') ? key.split('-') : [key, undefined]
      const extraItem = extraItems.find(e => e.id === itemId)
      if (extraItem) {
        if (optionId || selection.optionId) {
          // Se tem opção selecionada, usar preço da opção
          const option = extraItem.options?.find(o => o.id === (optionId || selection.optionId))
          if (option && option.isActive) {
            total += option.price * selection.quantity
          }
        } else if (extraItem.price) {
          // Senão, usar preço do item (se houver)
          total += extraItem.price * selection.quantity
        }
      }
    })

    // Borda recheada
    if (stuffedCrust) {
      total += 4.99
    }

    return total * quantity
  }

  const toggleExtraItem = (extraItem: ExtraItem, optionId?: string) => {
    const key = optionId ? `${extraItem.id}-${optionId}` : extraItem.id
    const currentSelection = selectedExtraItems[key]
    
    if (currentSelection) {
      // Remover item
      const newSelections = { ...selectedExtraItems }
      delete newSelections[key]
      setSelectedExtraItems(newSelections)
    } else {
      // Adicionar item
      setSelectedExtraItems({
        ...selectedExtraItems,
        [key]: { optionId, quantity: 1 }
      })
    }
  }

  const isExtraItemSelected = (extraItem: ExtraItem, optionId?: string) => {
    const key = optionId ? `${extraItem.id}-${optionId}` : extraItem.id
    return !!selectedExtraItems[key]
  }

  const handleAddToCart = () => {
    const customizedItem: CustomizedItem = {
      id: `${item.id}-${Date.now()}`,
      combo: item,
      quantity,
      size: selectedSize || undefined,
      flavors: selectedFlavors.length > 0 ? selectedFlavors : undefined,
      flavorsPizza2: pizzaQuantity > 1 && selectedFlavorsPizza2.length > 0 ? selectedFlavorsPizza2 : undefined,
      observations,
      stuffedCrust,
      extraItems: Object.keys(selectedExtraItems).length > 0 ? selectedExtraItems : undefined,
      totalPrice: calculatePrice()
    }

    onAddToCart(customizedItem)
  }

  const getFlavorTypeColor = (type: string) => {
    switch (type) {
      case 'TRADICIONAL':
        return 'bg-green-600 text-white font-semibold'
      case 'PREMIUM':
        return 'bg-blue-600 text-white font-semibold'
      case 'ESPECIAL':
        return 'bg-purple-600 text-white font-semibold'
      default:
        return 'bg-gray-700 text-white font-semibold'
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

          {/* Seleção de Sabores Tradicionais - APENAS para COMBOS com pizzas */}
          {isCombo && flavors.length > 0 && (
            <>
              {/* Seleção de Tamanho (apenas se for pizza) */}
              {(item.isPizza || pizzaQuantity > 0) && sizes.length > 0 && (
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
                        <div className="text-xs font-medium">{size.slices} fatias</div>
                        <div className="text-xs font-medium">Até {size.maxFlavors} sabores</div>
                        <div className="font-bold">R$ {size.basePrice.toFixed(2).replace('.', ',')}</div>
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Seleção de Sabores - Pizza 1 ou Combo */}
              <div>
                <Label className="text-base font-medium mb-3 block text-gray-900">
                  {pizzaQuantity > 1 ? 'Sabor Pizza 1' : 'Escolha os Sabores Tradicionais'}
                  {selectedSize && (
                    <span className="text-sm text-gray-700 font-medium ml-2">
                      ({selectedFlavors.length}/{selectedSize.maxFlavors})
                    </span>
                  )}
                  {!selectedSize && (
                    <span className="text-sm text-gray-700 font-medium ml-2">
                      ({selectedFlavors.length} selecionado{selectedFlavors.length !== 1 ? 's' : ''})
                    </span>
                  )}
                </Label>
                <div className="grid grid-cols-1 gap-2">
                  {flavors.map((flavor) => {
                    const isSelected = selectedFlavors.find(f => f.id === flavor.id)
                    const maxFlavors = selectedSize ? selectedSize.maxFlavors : 999
                    const canSelect = !isSelected && selectedFlavors.length < maxFlavors

                    return (
                      <div
                        key={flavor.id}
                        className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${
                          isSelected
                            ? 'border-red-600 bg-red-100 shadow-md'
                            : canSelect
                            ? 'border-gray-300 hover:border-red-500 hover:bg-red-50'
                            : 'border-gray-300 bg-gray-100 opacity-60 cursor-not-allowed'
                        }`}
                        onClick={() => canSelect && handleFlavorToggle(flavor)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="font-semibold text-sm text-gray-900">{flavor.name}</span>
                              <Badge className="text-xs bg-green-600 text-white font-semibold px-2 py-0.5">
                                TRADICIONAL
                              </Badge>
                            </div>
                            <p className="text-xs text-gray-700">{flavor.description}</p>
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

              {/* Seleção de Sabores - Pizza 2 */}
              {pizzaQuantity > 1 && (
                <div>
                  <Label className="text-base font-medium mb-3 block text-gray-900">
                    Sabor Pizza 2
                    {selectedSize && (
                      <span className="text-sm text-gray-500 ml-2">
                        ({selectedFlavorsPizza2.length}/{selectedSize.maxFlavors})
                      </span>
                    )}
                    {!selectedSize && (
                      <span className="text-sm text-gray-500 ml-2">
                        ({selectedFlavorsPizza2.length} selecionado{selectedFlavorsPizza2.length !== 1 ? 's' : ''})
                      </span>
                    )}
                  </Label>
                  <div className="grid grid-cols-1 gap-2">
                    {flavors.map((flavor) => {
                      const isSelected = selectedFlavorsPizza2.find(f => f.id === flavor.id)
                      const maxFlavors = selectedSize ? selectedSize.maxFlavors : 999
                      const canSelect = !isSelected && selectedFlavorsPizza2.length < maxFlavors

                      return (
                        <div
                          key={flavor.id}
                          className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${
                            isSelected
                              ? 'border-red-600 bg-red-100 shadow-md'
                              : canSelect
                              ? 'border-gray-300 hover:border-red-500 hover:bg-red-50'
                              : 'border-gray-300 bg-gray-100 opacity-60 cursor-not-allowed'
                          }`}
                          onClick={() => {
                            if (canSelect) {
                              if (isSelected) {
                                setSelectedFlavorsPizza2(selectedFlavorsPizza2.filter(f => f.id !== flavor.id))
                              } else {
                                setSelectedFlavorsPizza2([...selectedFlavorsPizza2, flavor])
                              }
                            }
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-1">
                                <span className="font-semibold text-sm text-gray-900">{flavor.name}</span>
                                <Badge className="text-xs bg-green-600 text-white font-semibold px-2 py-0.5">
                                  TRADICIONAL
                                </Badge>
                              </div>
                              <p className="text-xs text-gray-700">{flavor.description}</p>
                            </div>
                            {isSelected && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setSelectedFlavorsPizza2(selectedFlavorsPizza2.filter(f => f.id !== flavor.id))
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
              )}

              {/* Borda Recheada (apenas se for pizza) */}
              {(item.isPizza || pizzaQuantity > 0) && (
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-semibold text-gray-900">Borda Recheada</Label>
                    <p className="text-sm font-medium text-gray-800">+ R$ 4,99</p>
                  </div>
                  <Switch
                    checked={stuffedCrust}
                    onCheckedChange={setStuffedCrust}
                  />
                </div>
              )}
            </>
          )}

          {/* Itens Extras (Refri, Batatas, etc) */}
          {extraItems.length > 0 && (
            <div>
              <Label className="text-base font-medium mb-3 block text-gray-900">
                Adicionar Itens ao Combo
              </Label>
              <div className="space-y-3">
                {extraItems.map((extraItem) => (
                  <div key={extraItem.id} className="border rounded-lg p-3">
                    {extraItem.options && extraItem.options.length > 0 ? (
                      // Se tem opções, mostrar cada opção como checkbox
                      <div className="space-y-2">
                        <div className="font-semibold text-sm text-gray-900">{extraItem.name}</div>
                        {extraItem.description && (
                          <p className="text-xs text-gray-700 mb-2">{extraItem.description}</p>
                        )}
                        {extraItem.options
                          .filter((option) => option.isActive)
                          .map((option) => {
                            const isSelected = isExtraItemSelected(extraItem, option.id)
                            return (
                              <label
                                key={option.id}
                                className="flex items-center space-x-2 cursor-pointer p-2 rounded hover:bg-gray-50"
                              >
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => toggleExtraItem(extraItem, option.id)}
                                  className="w-4 h-4 text-red-500 rounded"
                                />
                                <span className="text-sm font-semibold text-gray-900">{option.name}</span>
                                {option.description && (
                                  <span className="text-xs text-gray-700">({option.description})</span>
                                )}
                                {option.price > 0 && (
                                  <span className="text-sm font-bold text-gray-900 ml-auto">
                                    + R$ {option.price.toFixed(2).replace('.', ',')}
                                  </span>
                                )}
                              </label>
                            )
                          })}
                      </div>
                    ) : (
                      // Se não tem opções, mostrar o item como checkbox simples
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isExtraItemSelected(extraItem)}
                          onChange={() => toggleExtraItem(extraItem)}
                          className="w-4 h-4 text-red-500 rounded"
                        />
                        <div className="flex-1">
                          <span className="text-sm font-semibold text-gray-900">{extraItem.name}</span>
                          {extraItem.description && (
                            <p className="text-xs text-gray-700">{extraItem.description}</p>
                          )}
                        </div>
                        {extraItem.price && extraItem.price > 0 && (
                          <span className="text-sm font-bold text-gray-900">
                            + R$ {extraItem.price.toFixed(2).replace('.', ',')}
                          </span>
                        )}
                      </label>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Observações */}
          <div>
            <Label className="text-base font-semibold mb-2 block text-gray-900">
              Observações
            </Label>
            <Textarea
              placeholder="Alguma observação especial para este item?"
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              rows={3}
              className="border-gray-400 text-gray-900 placeholder-gray-600 focus:border-red-500 focus:ring-red-500 bg-white"
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
              <div className="text-sm font-medium text-gray-800">
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
