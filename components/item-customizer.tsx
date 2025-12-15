'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Plus, Minus, X, ShoppingCart, ChefHat, Pizza, Crown, Star } from 'lucide-react'
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
  const showFlavors = (item as any).showFlavors !== undefined ? (item as any).showFlavors : true
  const allowCustomization = (item as any).allowCustomization !== undefined ? (item as any).allowCustomization : false
  // Mostrar sabores se: tem pizzas OU é pizza OU allowCustomization está ativo
  const isCombo = ((pizzaQuantity > 0) || (item.isPizza === true) || allowCustomization) && showFlavors

  useEffect(() => {
    // Sempre buscar dados de customização se allowCustomization estiver ativo
    // OU se for um combo com pizzas
    if (allowCustomization || isCombo) {
      fetchPizzaData()
    } else {
      // Para itens extras (refrigerantes, etc) ou quando showFlavors está desativado, apenas carregar dados básicos
      fetchExtraItemData()
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item, isCombo, allowCustomization])

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

  // Função para detectar o tipo da categoria baseado no nome
  const getCategoryType = (): string | null => {
    const categoryName = (item as any).category?.name || ''
    console.log('🔍 Detectando tipo da categoria:', {
      categoryName,
      itemName: item.name,
      fullItem: item
    })
    
    if (categoryName.includes('Tradicionais')) {
      console.log('✅ Tipo detectado: TRADICIONAL')
      return 'TRADICIONAL'
    }
    if (categoryName.includes('Especiais')) {
      console.log('✅ Tipo detectado: ESPECIAL')
      return 'ESPECIAL'
    }
    if (categoryName.includes('Premiums')) {
      console.log('✅ Tipo detectado: PREMIUM')
      return 'PREMIUM'
    }
    console.warn('⚠️ Tipo não detectado para categoria:', categoryName)
    return null
  }

  const fetchPizzaData = async () => {
    try {
      const categoryType = getCategoryType()
      const categoryName = (item as any).category?.name || ''
      const itemName = item.name.toLowerCase()
      
      console.log('🔍 Debug fetchPizzaData:', {
        categoryType,
        categoryName,
        itemName,
        fullItem: item
      })
      
      // Determinar o tipo final (prioridade: categoryType > detecção por nome)
      let finalType: string | null = categoryType
      
      if (!finalType) {
        if (categoryName.includes('Tradicionais') || itemName.includes('tradicional')) {
          finalType = 'TRADICIONAL'
        } else if (categoryName.includes('Especiais') || itemName.includes('especial')) {
          finalType = 'ESPECIAL'
        } else if (categoryName.includes('Premiums') || itemName.includes('premium')) {
          finalType = 'PREMIUM'
        }
      }
      
      console.log('🎯 Tipo final determinado:', finalType)
      
      const flavorsUrl = finalType 
        ? `/api/pizza-flavors?type=${finalType}`
        : '/api/pizza-flavors'
      
      console.log('📡 Fazendo requisição para:', flavorsUrl)
      
      const [flavorsRes, sizesRes, customizationRes] = await Promise.all([
        fetch(flavorsUrl),
        fetch(`/api/pizza-sizes?comboId=${item.id}`),
        fetch(`/api/combos/${item.id}/customization`)
      ])

      if (flavorsRes.ok) {
        const flavorsData = await flavorsRes.json()
        console.log('🔍 Sabores recebidos da API:', flavorsData.length, 'Tipo solicitado:', finalType)
        console.log('📋 Primeiros sabores:', flavorsData.slice(0, 3).map((f: PizzaFlavor) => ({ name: f.name, type: f.type })))
        
        // Filtrar novamente no cliente para garantir (case-insensitive)
        let filtered = flavorsData
        if (finalType) {
          filtered = flavorsData.filter((f: PizzaFlavor) => 
            (f.type || '').toUpperCase() === finalType.toUpperCase()
          )
          console.log(`✅ Filtrados ${filtered.length} sabores do tipo ${finalType} (de ${flavorsData.length} total)`)
        }
        
        if (filtered.length === 0 && flavorsData.length > 0) {
          const uniqueTypes = Array.from(new Set(flavorsData.map((f: PizzaFlavor) => f.type)))
          console.warn('⚠️ Nenhum sabor encontrado após filtro, mas há sabores na resposta:', {
            tipoSolicitado: finalType,
            tiposEncontrados: uniqueTypes
          })
        }
        
        setFlavors(filtered)
      } else {
        const errorText = await flavorsRes.text()
        console.error('❌ Erro ao carregar sabores:', flavorsRes.status, errorText)
        setFlavors([])
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

    // Adicionar valores extras por tipo de sabor (APENAS em combos, não em pizzas individuais)
    // Em combos: Tradicionais = grátis, Especiais = +R$15,00, Premiums = +R$25,00
    if (selectedFlavors.length > 0 && (pizzaQuantity > 0 || item.isPizza)) {
      // Verificar se é um combo (não pizza individual)
      const isCombo = pizzaQuantity > 0 || (item as any).category?.name?.includes('Combo')
      
      if (isCombo) {
        selectedFlavors.forEach((flavor) => {
          if (flavor.type === 'ESPECIAL') {
            total += 15.00
          } else if (flavor.type === 'PREMIUM') {
            total += 25.00
          }
          // TRADICIONAL não adiciona valor extra
        })
      }
    }

    // Adicionar valores extras para Pizza 2 (se houver)
    if (pizzaQuantity > 1 && selectedFlavorsPizza2.length > 0) {
      const isCombo = pizzaQuantity > 0 || (item as any).category?.name?.includes('Combo')
      
      if (isCombo) {
        selectedFlavorsPizza2.forEach((flavor) => {
          if (flavor.type === 'ESPECIAL') {
            total += 15.00
          } else if (flavor.type === 'PREMIUM') {
            total += 25.00
          }
        })
      }
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
        return 'bg-green-600 text-white'
      case 'PREMIUM':
        return 'bg-yellow-600 text-white'
      case 'ESPECIAL':
        return 'bg-purple-600 text-white'
      default:
        return 'bg-gray-700 text-white'
    }
  }

  const getFlavorTypeIcon = (type: string) => {
    switch (type) {
      case 'TRADICIONAL':
        return <Pizza className="h-4 w-4" />
      case 'PREMIUM':
        return <Star className="h-4 w-4" />
      case 'ESPECIAL':
        return <Crown className="h-4 w-4" />
      default:
        return <Pizza className="h-4 w-4" />
    }
  }

  const getFlavorTypeLabel = (type: string) => {
    switch (type) {
      case 'TRADICIONAL':
        return 'Tradicional'
      case 'PREMIUM':
        return 'Premium'
      case 'ESPECIAL':
        return 'Especial'
      default:
        return type
    }
  }

  // Agrupar sabores por tipo (usar useMemo para evitar recálculos)
  const groupedFlavors = useMemo(() => {
    const grouped = {
      TRADICIONAL: flavors.filter(f => (f.type || '').toUpperCase() === 'TRADICIONAL'),
      ESPECIAL: flavors.filter(f => (f.type || '').toUpperCase() === 'ESPECIAL'),
      PREMIUM: flavors.filter(f => (f.type || '').toUpperCase() === 'PREMIUM')
    }
    console.log('📊 Sabores agrupados:', {
      TRADICIONAL: grouped.TRADICIONAL.length,
      ESPECIAL: grouped.ESPECIAL.length,
      PREMIUM: grouped.PREMIUM.length,
      total: flavors.length
    })
    return grouped
  }, [flavors])

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

          {/* Seleção de Sabores - APENAS para COMBOS com pizzas */}
          {isCombo && (
            <div>
              {flavors.length === 0 && (
                <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                  <p className="text-gray-500 mb-2">Nenhum sabor disponível para esta categoria</p>
                  <p className="text-sm text-gray-400">
                    Categoria: {(item as any).category?.name || 'N/A'}
                  </p>
                </div>
              )}
              {flavors.length > 0 && (
            <div>
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

              {/* Seleção de Sabores - Pizza 1 ou Combo - Agrupados por Tipo */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold text-gray-900">
                    {pizzaQuantity > 1 ? 'Sabor Pizza 1' : 'Escolha os Sabores'}
                  </Label>
                  {selectedSize && (
                    <span className="text-sm font-semibold text-red-600 bg-red-50 px-3 py-1 rounded-full">
                      {selectedFlavors.length}/{selectedSize.maxFlavors} sabores selecionados
                    </span>
                  )}
                  {!selectedSize && (
                    <span className="text-sm font-medium text-gray-600">
                      {selectedFlavors.length} selecionado{selectedFlavors.length !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>

                {/* Sabores Tradicionais */}
                {groupedFlavors.TRADICIONAL.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2 pb-2 border-b border-green-200">
                      <Pizza className="h-5 w-5 text-green-600" />
                      <h3 className="text-lg font-bold text-gray-900">Sabores Tradicionais</h3>
                      <Badge className="bg-green-100 text-green-800 font-semibold">
                        {groupedFlavors.TRADICIONAL.length} opções
                      </Badge>
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      {groupedFlavors.TRADICIONAL.map((flavor) => {
                        const isSelected = selectedFlavors.find(f => f.id === flavor.id)
                        const maxFlavors = selectedSize ? selectedSize.maxFlavors : 999
                        const canSelect = !isSelected && selectedFlavors.length < maxFlavors

                        return (
                          <div
                            key={flavor.id}
                            className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                              isSelected
                                ? 'border-green-600 bg-green-50 shadow-md'
                                : canSelect
                                ? 'border-gray-300 hover:border-green-500 hover:bg-green-50'
                                : 'border-gray-300 bg-gray-100 opacity-60 cursor-not-allowed'
                            }`}
                            onClick={() => canSelect && handleFlavorToggle(flavor)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-1">
                                  <span className="font-semibold text-base text-gray-900">{flavor.name}</span>
                                  <Badge className={`text-xs ${getFlavorTypeColor('TRADICIONAL')} font-semibold px-2 py-0.5 flex items-center gap-1`}>
                                    {getFlavorTypeIcon('TRADICIONAL')}
                                    {getFlavorTypeLabel('TRADICIONAL')}
                                  </Badge>
                                </div>
                                {flavor.description && (
                                  <p className="text-sm text-gray-600 mt-1">{flavor.description}</p>
                                )}
                              </div>
                              {isSelected && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleFlavorToggle(flavor)
                                  }}
                                  className="h-8 w-8 p-0 border-green-600 text-green-600 hover:bg-green-100"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Sabores Especiais */}
                {groupedFlavors.ESPECIAL.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2 pb-2 border-b border-purple-200">
                      <Crown className="h-5 w-5 text-purple-600" />
                      <h3 className="text-lg font-bold text-gray-900">Sabores Especiais</h3>
                      <Badge className="bg-purple-100 text-purple-800 font-semibold">
                        {groupedFlavors.ESPECIAL.length} opções
                      </Badge>
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      {groupedFlavors.ESPECIAL.map((flavor) => {
                        const isSelected = selectedFlavors.find(f => f.id === flavor.id)
                        const maxFlavors = selectedSize ? selectedSize.maxFlavors : 999
                        const canSelect = !isSelected && selectedFlavors.length < maxFlavors

                        return (
                          <div
                            key={flavor.id}
                            className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                              isSelected
                                ? 'border-purple-600 bg-purple-50 shadow-md'
                                : canSelect
                                ? 'border-gray-300 hover:border-purple-500 hover:bg-purple-50'
                                : 'border-gray-300 bg-gray-100 opacity-60 cursor-not-allowed'
                            }`}
                            onClick={() => canSelect && handleFlavorToggle(flavor)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-1">
                                  <span className="font-semibold text-base text-gray-900">{flavor.name}</span>
                                  <Badge className={`text-xs ${getFlavorTypeColor('ESPECIAL')} font-semibold px-2 py-0.5 flex items-center gap-1`}>
                                    {getFlavorTypeIcon('ESPECIAL')}
                                    {getFlavorTypeLabel('ESPECIAL')}
                                  </Badge>
                                </div>
                                {flavor.description && (
                                  <p className="text-sm text-gray-600 mt-1">{flavor.description}</p>
                                )}
                              </div>
                              {isSelected && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleFlavorToggle(flavor)
                                  }}
                                  className="h-8 w-8 p-0 border-purple-600 text-purple-600 hover:bg-purple-100"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Sabores Premiums */}
                {groupedFlavors.PREMIUM.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2 pb-2 border-b border-yellow-200">
                      <Star className="h-5 w-5 text-yellow-600" />
                      <h3 className="text-lg font-bold text-gray-900">Sabores Premiums</h3>
                      <Badge className="bg-yellow-100 text-yellow-800 font-semibold">
                        {groupedFlavors.PREMIUM.length} opções
                      </Badge>
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      {groupedFlavors.PREMIUM.map((flavor) => {
                        const isSelected = selectedFlavors.find(f => f.id === flavor.id)
                        const maxFlavors = selectedSize ? selectedSize.maxFlavors : 999
                        const canSelect = !isSelected && selectedFlavors.length < maxFlavors

                        return (
                          <div
                            key={flavor.id}
                            className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                              isSelected
                                ? 'border-yellow-600 bg-yellow-50 shadow-md'
                                : canSelect
                                ? 'border-gray-300 hover:border-yellow-500 hover:bg-yellow-50'
                                : 'border-gray-300 bg-gray-100 opacity-60 cursor-not-allowed'
                            }`}
                            onClick={() => canSelect && handleFlavorToggle(flavor)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-1">
                                  <span className="font-semibold text-base text-gray-900">{flavor.name}</span>
                                  <Badge className={`text-xs ${getFlavorTypeColor('PREMIUM')} font-semibold px-2 py-0.5 flex items-center gap-1`}>
                                    {getFlavorTypeIcon('PREMIUM')}
                                    {getFlavorTypeLabel('PREMIUM')}
                                  </Badge>
                                </div>
                                {flavor.description && (
                                  <p className="text-sm text-gray-600 mt-1">{flavor.description}</p>
                                )}
                              </div>
                              {isSelected && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleFlavorToggle(flavor)
                                  }}
                                  className="h-8 w-8 p-0 border-yellow-600 text-yellow-600 hover:bg-yellow-100"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Seleção de Sabores - Pizza 2 - Agrupados por Tipo */}
              {pizzaQuantity > 1 && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-semibold text-gray-900">
                      Sabor Pizza 2
                    </Label>
                    {selectedSize && (
                      <span className="text-sm font-semibold text-red-600 bg-red-50 px-3 py-1 rounded-full">
                        {selectedFlavorsPizza2.length}/{selectedSize.maxFlavors} sabores selecionados
                      </span>
                    )}
                    {!selectedSize && (
                      <span className="text-sm font-medium text-gray-600">
                        {selectedFlavorsPizza2.length} selecionado{selectedFlavorsPizza2.length !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>

                  {/* Sabores Tradicionais - Pizza 2 */}
                  {groupedFlavors.TRADICIONAL.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2 pb-2 border-b border-green-200">
                        <Pizza className="h-5 w-5 text-green-600" />
                        <h3 className="text-lg font-bold text-gray-900">Sabores Tradicionais</h3>
                        <Badge className="bg-green-100 text-green-800 font-semibold">
                          {groupedFlavors.TRADICIONAL.length} opções
                        </Badge>
                      </div>
                      <div className="grid grid-cols-1 gap-2">
                        {groupedFlavors.TRADICIONAL.map((flavor) => {
                          const isSelected = selectedFlavorsPizza2.find(f => f.id === flavor.id)
                          const maxFlavors = selectedSize ? selectedSize.maxFlavors : 999
                          const canSelect = !isSelected && selectedFlavorsPizza2.length < maxFlavors

                          return (
                            <div
                              key={flavor.id}
                              className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                                isSelected
                                  ? 'border-green-600 bg-green-50 shadow-md'
                                  : canSelect
                                  ? 'border-gray-300 hover:border-green-500 hover:bg-green-50'
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
                                    <span className="font-semibold text-base text-gray-900">{flavor.name}</span>
                                    <Badge className={`text-xs ${getFlavorTypeColor('TRADICIONAL')} font-semibold px-2 py-0.5 flex items-center gap-1`}>
                                      {getFlavorTypeIcon('TRADICIONAL')}
                                      {getFlavorTypeLabel('TRADICIONAL')}
                                    </Badge>
                                  </div>
                                  {flavor.description && (
                                    <p className="text-sm text-gray-600 mt-1">{flavor.description}</p>
                                  )}
                                </div>
                                {isSelected && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setSelectedFlavorsPizza2(selectedFlavorsPizza2.filter(f => f.id !== flavor.id))
                                    }}
                                    className="h-8 w-8 p-0 border-green-600 text-green-600 hover:bg-green-100"
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Sabores Especiais - Pizza 2 */}
                  {groupedFlavors.ESPECIAL.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2 pb-2 border-b border-purple-200">
                        <Crown className="h-5 w-5 text-purple-600" />
                        <h3 className="text-lg font-bold text-gray-900">Sabores Especiais</h3>
                        <Badge className="bg-purple-100 text-purple-800 font-semibold">
                          {groupedFlavors.ESPECIAL.length} opções
                        </Badge>
                      </div>
                      <div className="grid grid-cols-1 gap-2">
                        {groupedFlavors.ESPECIAL.map((flavor) => {
                          const isSelected = selectedFlavorsPizza2.find(f => f.id === flavor.id)
                          const maxFlavors = selectedSize ? selectedSize.maxFlavors : 999
                          const canSelect = !isSelected && selectedFlavorsPizza2.length < maxFlavors

                          return (
                            <div
                              key={flavor.id}
                              className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                                isSelected
                                  ? 'border-purple-600 bg-purple-50 shadow-md'
                                  : canSelect
                                  ? 'border-gray-300 hover:border-purple-500 hover:bg-purple-50'
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
                                    <span className="font-semibold text-base text-gray-900">{flavor.name}</span>
                                    <Badge className={`text-xs ${getFlavorTypeColor('ESPECIAL')} font-semibold px-2 py-0.5 flex items-center gap-1`}>
                                      {getFlavorTypeIcon('ESPECIAL')}
                                      {getFlavorTypeLabel('ESPECIAL')}
                                    </Badge>
                                  </div>
                                  {flavor.description && (
                                    <p className="text-sm text-gray-600 mt-1">{flavor.description}</p>
                                  )}
                                </div>
                                {isSelected && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setSelectedFlavorsPizza2(selectedFlavorsPizza2.filter(f => f.id !== flavor.id))
                                    }}
                                    className="h-8 w-8 p-0 border-purple-600 text-purple-600 hover:bg-purple-100"
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Sabores Premiums - Pizza 2 */}
                  {groupedFlavors.PREMIUM.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2 pb-2 border-b border-yellow-200">
                        <Star className="h-5 w-5 text-yellow-600" />
                        <h3 className="text-lg font-bold text-gray-900">Sabores Premiums</h3>
                        <Badge className="bg-yellow-100 text-yellow-800 font-semibold">
                          {groupedFlavors.PREMIUM.length} opções
                        </Badge>
                      </div>
                      <div className="grid grid-cols-1 gap-2">
                        {groupedFlavors.PREMIUM.map((flavor) => {
                          const isSelected = selectedFlavorsPizza2.find(f => f.id === flavor.id)
                          const maxFlavors = selectedSize ? selectedSize.maxFlavors : 999
                          const canSelect = !isSelected && selectedFlavorsPizza2.length < maxFlavors

                          return (
                            <div
                              key={flavor.id}
                              className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                                isSelected
                                  ? 'border-yellow-600 bg-yellow-50 shadow-md'
                                  : canSelect
                                  ? 'border-gray-300 hover:border-yellow-500 hover:bg-yellow-50'
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
                                    <span className="font-semibold text-base text-gray-900">{flavor.name}</span>
                                    <Badge className={`text-xs ${getFlavorTypeColor('PREMIUM')} font-semibold px-2 py-0.5 flex items-center gap-1`}>
                                      {getFlavorTypeIcon('PREMIUM')}
                                      {getFlavorTypeLabel('PREMIUM')}
                                    </Badge>
                                  </div>
                                  {flavor.description && (
                                    <p className="text-sm text-gray-600 mt-1">{flavor.description}</p>
                                  )}
                                </div>
                                {isSelected && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setSelectedFlavorsPizza2(selectedFlavorsPizza2.filter(f => f.id !== flavor.id))
                                    }}
                                    className="h-8 w-8 p-0 border-yellow-600 text-yellow-600 hover:bg-yellow-100"
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
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
            </div>
            )}
          </div>
          )}

          {/* Itens Extras (Refri, Batatas, etc) - Agrupados por tipo */}
          {extraItems.length > 0 && (() => {
            // Agrupar itens extras por tipo para evitar duplicação
            const groupedItems: { [key: string]: ExtraItem[] } = {}
            extraItems.forEach(item => {
              const type = item.type || 'OTHER'
              if (!groupedItems[type]) {
                groupedItems[type] = []
              }
              // Verificar se já existe um item do mesmo tipo com o mesmo nome
              const exists = groupedItems[type].some(existing => existing.name === item.name)
              if (!exists) {
                groupedItems[type].push(item)
              }
            })

            return (
              <div className="space-y-4">
                {Object.entries(groupedItems).map(([type, items]) => (
                  <div key={type}>
                    <Label className="text-base font-medium mb-3 block text-gray-900">
                      {type === 'DRINK' ? 'Refrigerante 1 Litro' : 
                       type === 'SIDE' ? 'Acompanhamentos' : 
                       'Adicionar Itens ao Combo'}
                    </Label>
                    <div className="space-y-3">
                      {items.map((extraItem) => (
                        <div key={extraItem.id} className="border rounded-lg p-3">
                          {extraItem.options && extraItem.options.length > 0 ? (
                            // Se tem opções, mostrar cada opção como checkbox
                            <div className="space-y-2">
                              {extraItem.name && extraItem.name !== 'Refrigerante 1 Litro' && (
                                <div className="font-semibold text-sm text-gray-900 mb-2">{extraItem.name}</div>
                              )}
                              {extraItem.description && (
                                <p className="text-xs text-gray-700 mb-2">{extraItem.description}</p>
                              )}
                              <div className="space-y-1">
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
                                          type="radio"
                                          name={`${extraItem.id}-group`}
                                          checked={isSelected}
                                          onChange={() => {
                                            // Desmarcar outras opções do mesmo grupo
                                            const otherSelections = { ...selectedExtraItems }
                                            Object.keys(otherSelections).forEach(key => {
                                              if (key.startsWith(extraItem.id + '-') && key !== `${extraItem.id}-${option.id}`) {
                                                delete otherSelections[key]
                                              }
                                            })
                                            setSelectedExtraItems(otherSelections)
                                            toggleExtraItem(extraItem, option.id)
                                          }}
                                          className="w-4 h-4 text-red-500"
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
                ))}
              </div>
            )
          })()}

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

