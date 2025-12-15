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

// SABORES FIXOS - Adicionados manualmente para garantir que apareçam na personalização
const FIXED_FLAVORS: PizzaFlavor[] = [
  // Tradicionais
  { id: 'trad-1', name: 'Baiana', description: 'Mussarela, calabresa, pimenta calabresa e orégano', type: 'TRADICIONAL' },
  { id: 'trad-2', name: 'Banana com canela', description: 'Mussarela, banana e canela', type: 'TRADICIONAL' },
  { id: 'trad-3', name: 'Brigadeiro de panela', description: 'Mussarela, Brigadeiro de panela e granulado', type: 'TRADICIONAL' },
  { id: 'trad-4', name: 'Caipira', description: 'Mussarela, frango, milho e orégano', type: 'TRADICIONAL' },
  { id: 'trad-5', name: 'Calabresa', description: 'Mussarela, calabresa, cebola e orégano', type: 'TRADICIONAL' },
  { id: 'trad-6', name: 'Calabresa c/ cheddar', description: 'Mussarela, calabresa, cheddar e orégano', type: 'TRADICIONAL' },
  { id: 'trad-7', name: 'Churros', description: 'Mussarela, leite condensado, doce de leite, açúcar e canela', type: 'TRADICIONAL' },
  { id: 'trad-8', name: 'Dois queijos', description: 'Mussarela, catupiry e orégano', type: 'TRADICIONAL' },
  { id: 'trad-9', name: 'Frango c/ catupiry', description: 'Mussarela, frango desfiado, catupiry e orégano', type: 'TRADICIONAL' },
  { id: 'trad-10', name: 'Frango c/ cheddar', description: 'Mussarela, frango desfiado, cheddar e orégano', type: 'TRADICIONAL' },
  { id: 'trad-11', name: 'Lombinho', description: 'Camada dupla de mussarela e orégano', type: 'TRADICIONAL' },
  { id: 'trad-12', name: 'Marguerita', description: 'Mussarela, tomate, manjericão e orégano', type: 'TRADICIONAL' },
  { id: 'trad-13', name: 'Milho verde', description: 'Mussarela, milho verde e orégano', type: 'TRADICIONAL' },
  { id: 'trad-14', name: 'Mista especial', description: 'Mussarela, presunto, azeitona, milho verde e orégano', type: 'TRADICIONAL' },
  { id: 'trad-15', name: 'Moda vegetariana', description: 'Mussarela, palmito, milho verde, azeitona, manjericão e orégano', type: 'TRADICIONAL' },
  { id: 'trad-16', name: 'Portuguesa', description: 'Mussarela, presunto, ovos, cebola, pimentão, azeitona e orégano', type: 'TRADICIONAL' },
  { id: 'trad-17', name: 'Romeu e julieta', description: 'Mussarela e goiabada', type: 'TRADICIONAL' },
  // Especiais
  { id: 'esp-1', name: '4 queijos', description: 'Mussarela, queijo do reino, queijo coalho, gorgonzola e orégano', type: 'ESPECIAL' },
  { id: 'esp-2', name: 'Atum', description: 'Mussarela, atum, azeitonas e orégano', type: 'ESPECIAL' },
  { id: 'esp-3', name: 'Atum acebolado', description: 'Mussarela, atum, cebola, azeitonas e orégano', type: 'ESPECIAL' },
  { id: 'esp-4', name: 'Atum a moda do chef', description: 'Mussarela, atum, cebola, queijo coalho, azeitonas e orégano', type: 'ESPECIAL' },
  { id: 'esp-5', name: 'Atum especial', description: 'Mussarela, atum, cebola, azeitonas, catupiry e orégano', type: 'ESPECIAL' },
  { id: 'esp-6', name: 'Bacon', description: 'Mussarela, bacon, cebola e orégano', type: 'ESPECIAL' },
  { id: 'esp-7', name: 'Bacon crocante', description: 'Mussarela, bacon acebolado, batata palha e orégano', type: 'ESPECIAL' },
  { id: 'esp-8', name: 'Bacon especial', description: 'Mussarela, bacon, cebola, catupiry e orégano', type: 'ESPECIAL' },
  { id: 'esp-9', name: 'Frango a moda da casa', description: 'Mussarela, filé de frango desfiado, milho verde, catupiry e orégano', type: 'ESPECIAL' },
  { id: 'esp-10', name: 'Frango a moda do chef', description: 'Mussarela, filé de frango desfiado, queijo do reino, catupiry e orégano', type: 'ESPECIAL' },
  { id: 'esp-11', name: 'Frango especial', description: 'Mussarela, filé de frango desfiado, cebola, catupiry e orégano', type: 'ESPECIAL' },
  { id: 'esp-12', name: 'Lombinho', description: 'Mussarela, lombinho fatiado, azeitona e orégano', type: 'ESPECIAL' },
  { id: 'esp-13', name: 'Nordestina', description: 'Mussarela, carne do sol acebolada e orégano', type: 'ESPECIAL' },
  { id: 'esp-14', name: 'Nordestina a moda do chef', description: 'Mussarela, carne do sol acebolada, queijo coalho e orégano', type: 'ESPECIAL' },
  { id: 'esp-15', name: 'Nordestina especial', description: 'Mussarela, carne do sol acebolada, azeitonas, catupiry e orégano', type: 'ESPECIAL' },
  // Premiums
  { id: 'prem-1', name: 'Camarão aos três queijos', description: 'Mussarela, camarão, queijo do reino, gorgonzola, cebola e orégano', type: 'PREMIUM' },
  { id: 'prem-2', name: 'Camarão com catupiry philadelphia', description: 'Mussarela, camarão ao molho de frutos do mar, catupiry philadelphia e orégano', type: 'PREMIUM' },
  { id: 'prem-3', name: 'Camarão especial', description: 'Mussarela, camarão e orégano', type: 'PREMIUM' },
  { id: 'prem-4', name: 'Carne do Sol aos três Queijos', description: 'Mussarela, carne do sol, queijo do reino, queijo gorgonzola, cebola e orégano', type: 'PREMIUM' },
  { id: 'prem-5', name: 'Carne do sol apimentada', description: 'Mussarela, filé de carne do sol, pimenta calabresa e orégano', type: 'PREMIUM' },
  { id: 'prem-6', name: 'Carne do sol com catupiry philadelphia', description: 'Mussarela, filé de carne do sol, catupiry philadelphia e orégano', type: 'PREMIUM' },
  { id: 'prem-7', name: 'Mega nordestina', description: 'Mussarela, carne do sol, cebola, queijo coalho, banana da terra e orégano', type: 'PREMIUM' },
  { id: 'prem-8', name: 'Sabor do chef', description: 'Mussarela, filé de carne do sol acebolado, queijo coalho, queijo do reino, catupiry philadelphia e orégano', type: 'PREMIUM' },
  { id: 'prem-9', name: 'Strogonoff de Camarão', description: 'Mussarela, strogonoff de camarão, batata palha e orégano', type: 'PREMIUM' }
]

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
  const [debugInfo, setDebugInfo] = useState<any>({})
  
  const pizzaQuantity = (item as any).pizzaQuantity || 0
  const showFlavors = (item as any).showFlavors !== undefined ? (item as any).showFlavors : true
  const allowCustomization = (item as any).allowCustomization !== undefined ? (item as any).allowCustomization : false
  const isCombo = ((pizzaQuantity > 0) || (item.isPizza === true) || allowCustomization) && showFlavors

  useEffect(() => {
    if (allowCustomization || isCombo) {
      fetchPizzaData()
    } else {
      fetchExtraItemData()
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item, isCombo, allowCustomization])

  const fetchExtraItemData = async () => {
    try {
      const response = await fetch(`/api/combos/${item.id}/customization`)
      if (response.ok) {
        const customizationData = await response.json()
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
      console.error('Erro ao carregar itens extras:', error)
    }
  }

  /**
   * DETECÇÃO DE CATEGORIA - REFEITA DO ZERO
   * Prioridade: category.name > item.name > fallback para todos
   */
  const detectCategoryType = (): string | null => {
    const categoryName = ((item as any).category?.name || '').toLowerCase()
    const itemName = (item.name || '').toLowerCase()
    
    console.log('🔍 [DETECÇÃO] Analisando categoria:', {
      categoryName,
      itemName,
      fullCategory: (item as any).category
    })

    // Detecção por nome da categoria (mais confiável)
    if (categoryName.includes('tradicionais') || categoryName.includes('tradicional')) {
      console.log('✅ [DETECÇÃO] Tipo: TRADICIONAL (por categoria)')
      return 'TRADICIONAL'
    }
    if (categoryName.includes('especiais') || categoryName.includes('especial')) {
      console.log('✅ [DETECÇÃO] Tipo: ESPECIAL (por categoria)')
      return 'ESPECIAL'
    }
    if (categoryName.includes('premiums') || categoryName.includes('premium')) {
      console.log('✅ [DETECÇÃO] Tipo: PREMIUM (por categoria)')
      return 'PREMIUM'
    }

    // Fallback: detecção por nome do item
    if (itemName.includes('tradicional')) {
      console.log('✅ [DETECÇÃO] Tipo: TRADICIONAL (por nome do item)')
      return 'TRADICIONAL'
    }
    if (itemName.includes('especial')) {
      console.log('✅ [DETECÇÃO] Tipo: ESPECIAL (por nome do item)')
      return 'ESPECIAL'
    }
    if (itemName.includes('premium')) {
      console.log('✅ [DETECÇÃO] Tipo: PREMIUM (por nome do item)')
      return 'PREMIUM'
    }

    console.warn('⚠️ [DETECÇÃO] Tipo não detectado, retornando null (mostrará todos)')
    return null
  }

  /**
   * BUSCA DE SABORES - REFEITA DO ZERO
   * Estratégia: SEMPRE buscar TODOS os sabores primeiro, depois filtrar no cliente
   */
  const fetchPizzaData = async () => {
    setLoading(true)
    setDebugInfo({})
    
    try {
      const detectedType = detectCategoryType()
      const categoryName = (item as any).category?.name || 'N/A'
      
      console.log('🚀 [FETCH] Iniciando busca de sabores...', {
        detectedType,
        categoryName,
        itemName: item.name
      })

      // ESTRATÉGIA 1: Buscar TODOS os sabores primeiro (sem filtro)
      console.log('📡 [FETCH] Buscando TODOS os sabores (sem filtro)...')
      
      // Adicionar timestamp para evitar cache
      const cacheBuster = `?t=${Date.now()}`
      const allFlavorsRes = await fetch(`/api/pizza-flavors${cacheBuster}`)
      
      if (!allFlavorsRes.ok) {
        const errorText = await allFlavorsRes.text()
        console.error(`❌ [FETCH] Erro HTTP ${allFlavorsRes.status}:`, errorText)
        throw new Error(`Erro HTTP ${allFlavorsRes.status}: ${errorText}`)
      }

      const allFlavors: PizzaFlavor[] = await allFlavorsRes.json()
      console.log(`✅ [FETCH] Total de sabores recebidos da API: ${allFlavors.length}`)
      
      // Verificar se é um array válido
      if (!Array.isArray(allFlavors)) {
        console.error('❌ [FETCH] Resposta da API não é um array:', typeof allFlavors, allFlavors)
        throw new Error('Resposta da API inválida')
      }
      
      // Se a API não retornar sabores, usar os sabores fixos
      let flavorsToUse = allFlavors
      
      if (allFlavors.length === 0) {
        console.warn('⚠️ [FETCH] NENHUM sabor encontrado na API! Usando sabores fixos...')
        flavorsToUse = FIXED_FLAVORS
        console.log(`✅ [FETCH] Usando ${FIXED_FLAVORS.length} sabores fixos`)
      }

      // Log dos tipos disponíveis
      const availableTypes = Array.from(new Set(flavorsToUse.map(f => f.type)))
      console.log('📋 [FETCH] Tipos disponíveis:', availableTypes)
      console.log('📊 [FETCH] Distribuição:', {
        TRADICIONAL: flavorsToUse.filter(f => f.type === 'TRADICIONAL').length,
        ESPECIAL: flavorsToUse.filter(f => f.type === 'ESPECIAL').length,
        PREMIUM: flavorsToUse.filter(f => f.type === 'PREMIUM').length
      })

      // ESTRATÉGIA 2: Filtrar no cliente baseado no tipo detectado
      let finalFlavors: PizzaFlavor[] = []
      
      if (detectedType) {
        // Filtrar por tipo detectado
        finalFlavors = flavorsToUse.filter(f => 
          (f.type || '').toUpperCase() === detectedType.toUpperCase()
        )
        console.log(`✅ [FETCH] Filtrados ${finalFlavors.length} sabores do tipo ${detectedType}`)
        
        // Se não encontrou nenhum do tipo, mostrar TODOS como fallback
        if (finalFlavors.length === 0) {
          console.warn(`⚠️ [FETCH] Nenhum sabor do tipo ${detectedType} encontrado. Mostrando TODOS os sabores como fallback.`)
          finalFlavors = flavorsToUse
        }
      } else {
        // Se não detectou tipo, mostrar TODOS
        console.log('ℹ️ [FETCH] Tipo não detectado. Mostrando TODOS os sabores.')
        finalFlavors = flavorsToUse
      }

      console.log(`🎯 [FETCH] Sabores finais que serão exibidos: ${finalFlavors.length}`)
      setFlavors(finalFlavors)
      
      setDebugInfo({
        detectedType,
        categoryName,
        totalInDatabase: flavorsToUse.length,
        filteredCount: finalFlavors.length,
        availableTypes,
        usingFixedFlavors: allFlavors.length === 0,
        distribution: {
          TRADICIONAL: finalFlavors.filter(f => f.type === 'TRADICIONAL').length,
          ESPECIAL: finalFlavors.filter(f => f.type === 'ESPECIAL').length,
          PREMIUM: finalFlavors.filter(f => f.type === 'PREMIUM').length
        }
      })

      // Buscar tamanhos
      const sizesRes = await fetch(`/api/pizza-sizes?comboId=${item.id}`)
      if (sizesRes.ok) {
        const sizesData = await sizesRes.json()
        setSizes(sizesData)
        if (sizesData.length > 0) {
          setSelectedSize(sizesData[0])
        }
      }

      // Buscar itens extras
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
    } catch (error: any) {
      console.error('❌ [FETCH] Erro ao carregar dados:', error)
      setFlavors([])
      setDebugInfo({
        error: error.message || 'Erro desconhecido'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSizeSelect = (size: PizzaSize) => {
    setSelectedSize(size)
    if (selectedFlavors.length > size.maxFlavors) {
      setSelectedFlavors(selectedFlavors.slice(0, size.maxFlavors))
    }
  }

  const handleFlavorToggle = (flavor: PizzaFlavor) => {
    if (selectedFlavors.find(f => f.id === flavor.id)) {
      setSelectedFlavors(selectedFlavors.filter(f => f.id !== flavor.id))
    } else {
      const maxFlavors = selectedSize ? selectedSize.maxFlavors : 999
      if (selectedFlavors.length < maxFlavors) {
        setSelectedFlavors([...selectedFlavors, flavor])
      }
    }
  }

  const handleFlavorTogglePizza2 = (flavor: PizzaFlavor) => {
    if (selectedFlavorsPizza2.find(f => f.id === flavor.id)) {
      setSelectedFlavorsPizza2(selectedFlavorsPizza2.filter(f => f.id !== flavor.id))
    } else {
      const maxFlavors = selectedSize ? selectedSize.maxFlavors : 999
      if (selectedFlavorsPizza2.length < maxFlavors) {
        setSelectedFlavorsPizza2([...selectedFlavorsPizza2, flavor])
      }
    }
  }

  const calculatePrice = () => {
    let total = item.price
    
    if ((item.isPizza || pizzaQuantity > 0) && selectedSize) {
      total = selectedSize.basePrice
      if (pizzaQuantity > 1) {
        total += selectedSize.basePrice
      }
    } else if (item.isPizza || pizzaQuantity > 0) {
      total = (item.price / pizzaQuantity) * pizzaQuantity
    }

    // Adicionar valores extras por tipo de sabor (APENAS em combos)
    if (selectedFlavors.length > 0 && (pizzaQuantity > 0 || item.isPizza)) {
      const isCombo = pizzaQuantity > 0 || (item as any).category?.name?.includes('Combo')
      if (isCombo) {
        selectedFlavors.forEach((flavor) => {
          if (flavor.type === 'ESPECIAL') {
            total += 15.00
          } else if (flavor.type === 'PREMIUM') {
            total += 25.00
          }
        })
      }
    }

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

    Object.entries(selectedExtraItems).forEach(([key, selection]) => {
      const [itemId, optionId] = key.includes('-') ? key.split('-') : [key, undefined]
      const extraItem = extraItems.find(e => e.id === itemId)
      if (extraItem) {
        if (optionId || selection.optionId) {
          const option = extraItem.options?.find(o => o.id === (optionId || selection.optionId))
          if (option && option.isActive) {
            total += option.price * selection.quantity
          }
        } else if (extraItem.price) {
          total += extraItem.price * selection.quantity
        }
      }
    })

    if (stuffedCrust) {
      total += 4.99
    }

    return total * quantity
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

  // Agrupar sabores por tipo
  const groupedFlavors = useMemo(() => {
    const grouped = {
      TRADICIONAL: flavors.filter(f => (f.type || '').toUpperCase() === 'TRADICIONAL'),
      ESPECIAL: flavors.filter(f => (f.type || '').toUpperCase() === 'ESPECIAL'),
      PREMIUM: flavors.filter(f => (f.type || '').toUpperCase() === 'PREMIUM')
    }
    
    console.log('📊 [GROUPED] Sabores agrupados:', {
      TRADICIONAL: grouped.TRADICIONAL.length,
      ESPECIAL: grouped.ESPECIAL.length,
      PREMIUM: grouped.PREMIUM.length,
      total: flavors.length
    })
    
    return grouped
  }, [flavors])

  const getFlavorTypeColor = (type: string) => {
    switch (type) {
      case 'TRADICIONAL':
        return 'bg-green-100 text-green-800'
      case 'ESPECIAL':
        return 'bg-purple-100 text-purple-800'
      case 'PREMIUM':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getFlavorTypeIcon = (type: string) => {
    switch (type) {
      case 'TRADICIONAL':
        return <Pizza className="h-3 w-3" />
      case 'ESPECIAL':
        return <Crown className="h-3 w-3" />
      case 'PREMIUM':
        return <Star className="h-3 w-3" />
      default:
        return null
    }
  }

  const getFlavorTypeLabel = (type: string) => {
    switch (type) {
      case 'TRADICIONAL':
        return 'Tradicional'
      case 'ESPECIAL':
        return 'Especial'
      case 'PREMIUM':
        return 'Premium'
      default:
        return type
    }
  }

  const totalFlavorsCount = groupedFlavors.TRADICIONAL.length + groupedFlavors.ESPECIAL.length + groupedFlavors.PREMIUM.length

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando sabores...</p>
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
          <div>
            <h2 className="text-xl font-bold text-gray-900">{item.name}</h2>
            <p className="text-sm text-gray-600">{item.description}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-6 space-y-6">
          {/* Debug Info (apenas em desenvolvimento) */}
          {process.env.NODE_ENV === 'development' && Object.keys(debugInfo).length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-xs">
              <strong>Debug Info:</strong>
              <pre className="mt-2 overflow-auto">{JSON.stringify(debugInfo, null, 2)}</pre>
            </div>
          )}

          {/* Quantidade */}
          <div>
            <Label className="text-base font-semibold text-gray-900 mb-2 block">Quantidade</Label>
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="text-lg font-semibold w-12 text-center">{quantity}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setQuantity(quantity + 1)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Tamanhos */}
          {sizes.length > 0 && (
            <div>
              <Label className="text-base font-semibold text-gray-900 mb-2 block">Tamanho</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {sizes.map((size) => (
                  <button
                    key={size.id}
                    onClick={() => handleSizeSelect(size)}
                    className={`p-3 border-2 rounded-lg text-center transition-all ${
                      selectedSize?.id === size.id
                        ? 'border-red-600 bg-red-50'
                        : 'border-gray-300 hover:border-red-300'
                    }`}
                  >
                    <div className="font-semibold text-gray-900">{size.name}</div>
                    <div className="text-sm text-gray-600">R$ {size.basePrice.toFixed(2).replace('.', ',')}</div>
                    <div className="text-xs text-gray-500">{size.maxFlavors} sabores</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Seleção de Sabores */}
          {isCombo && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold text-gray-900">
                  Escolha os Sabores
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

              {/* MENSAGEM: Nenhum sabor disponível */}
              {totalFlavorsCount === 0 && (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <ChefHat className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 mb-2 font-semibold">Nenhum sabor disponível</p>
                  <p className="text-sm text-gray-400">
                    Categoria: {(item as any).category?.name || 'N/A'}
                  </p>
                  {debugInfo.error && (
                    <p className="text-xs text-red-500 mt-2">Erro: {debugInfo.error}</p>
                  )}
                </div>
              )}

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
          )}

          {/* Pizza 2 (se houver) */}
          {pizzaQuantity > 1 && (
            <div className="space-y-6 border-t pt-6">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold text-gray-900">
                  Sabor Pizza 2
                </Label>
                {selectedSize && (
                  <span className="text-sm font-semibold text-red-600 bg-red-50 px-3 py-1 rounded-full">
                    {selectedFlavorsPizza2.length}/{selectedSize.maxFlavors} sabores selecionados
                  </span>
                )}
              </div>

              {groupedFlavors.TRADICIONAL.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center space-x-2 pb-2 border-b border-green-200">
                    <Pizza className="h-5 w-5 text-green-600" />
                    <h3 className="text-lg font-bold text-gray-900">Sabores Tradicionais</h3>
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
                          onClick={() => canSelect && handleFlavorTogglePizza2(flavor)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <span className="font-semibold text-base text-gray-900">{flavor.name}</span>
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
                                  handleFlavorTogglePizza2(flavor)
                                }}
                                className="h-8 w-8 p-0"
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

              {groupedFlavors.ESPECIAL.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center space-x-2 pb-2 border-b border-purple-200">
                    <Crown className="h-5 w-5 text-purple-600" />
                    <h3 className="text-lg font-bold text-gray-900">Sabores Especiais</h3>
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
                          onClick={() => canSelect && handleFlavorTogglePizza2(flavor)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <span className="font-semibold text-base text-gray-900">{flavor.name}</span>
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
                                  handleFlavorTogglePizza2(flavor)
                                }}
                                className="h-8 w-8 p-0"
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

              {groupedFlavors.PREMIUM.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center space-x-2 pb-2 border-b border-yellow-200">
                    <Star className="h-5 w-5 text-yellow-600" />
                    <h3 className="text-lg font-bold text-gray-900">Sabores Premiums</h3>
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
                          onClick={() => canSelect && handleFlavorTogglePizza2(flavor)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <span className="font-semibold text-base text-gray-900">{flavor.name}</span>
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
                                  handleFlavorTogglePizza2(flavor)
                                }}
                                className="h-8 w-8 p-0"
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

          {/* Borda Recheada */}
          {isCombo && (
            <div className="flex items-center space-x-2">
              <Switch
                checked={stuffedCrust}
                onCheckedChange={setStuffedCrust}
              />
              <Label className="text-base font-semibold text-gray-900">
                Borda Recheada (+ R$ 4,99)
              </Label>
            </div>
          )}

          {/* Observações */}
          <div>
            <Label className="text-base font-semibold text-gray-900 mb-2 block">Observações</Label>
            <Textarea
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              placeholder="Alguma observação especial para este item?"
              rows={3}
              className="w-full"
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
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-2"
              size="lg"
            >
              <ShoppingCart className="h-5 w-5 mr-2" />
              Adicionar ao Carrinho
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
