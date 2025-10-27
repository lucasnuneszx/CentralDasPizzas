'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  X, 
  ChevronDown, 
  ChevronUp, 
  Plus, 
  Minus,
  ShoppingCart,
  Check
} from 'lucide-react'
import toast from 'react-hot-toast'

interface PizzaSize {
  id: string
  name: string
  slices: number
  maxFlavors: number
  basePrice: number
}

interface PizzaFlavor {
  id: string
  name: string
  description: string
  type: string
  price: number
}

interface ExtraItem {
  id: string
  name: string
  price: number
  category: string
  size?: string
}

interface ComboCustomization {
  id: string
  name: string
  description: string
  basePrice: number
  requiredItems: {
    id: string
    name: string
    type: 'PIZZA' | 'DRINK' | 'SIDE'
    required: boolean
    options: any[]
  }[]
  optionalItems: {
    id: string
    name: string
    type: 'PIZZA' | 'DRINK' | 'SIDE'
    price: number
    options: any[]
  }[]
}

interface CustomizedCombo {
  comboId: string
  selectedItems: {
    [key: string]: {
      type: string
      flavors: string[]
      size?: string
      quantity: number
    }
  }
  totalPrice: number
}

interface ComboCustomizationModalProps {
  combo: ComboCustomization
  isOpen: boolean
  onClose: () => void
  onAddToCart: (customizedCombo: CustomizedCombo) => void
}

export default function ComboCustomizationModal({ 
  combo, 
  isOpen, 
  onClose, 
  onAddToCart 
}: ComboCustomizationModalProps) {
  const [customizedCombo, setCustomizedCombo] = useState<CustomizedCombo>({
    comboId: combo.id,
    selectedItems: {},
    totalPrice: combo.basePrice
  })
  
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({})
  const [pizzaFlavors, setPizzaFlavors] = useState<PizzaFlavor[]>([])
  const [extraItems, setExtraItems] = useState<ExtraItem[]>([])
  const [pizzaSizes, setPizzaSizes] = useState<PizzaSize[]>([])

  const fetchPizzaData = async () => {
    try {
      const [flavorsResponse, extrasResponse, sizesResponse] = await Promise.all([
        fetch('/api/flavors'),
        fetch('/api/extras'),
        fetch('/api/pizza-sizes')
      ])
      
      const flavors = await flavorsResponse.json()
      const extras = await extrasResponse.json()
      const sizes = await sizesResponse.json()
      
      setPizzaFlavors(flavors)
      setExtraItems(extras)
      setPizzaSizes(sizes)
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    }
  }

  const initializeCombo = useCallback(() => {
    const initialItems: { [key: string]: any } = {}
    
    // Inicializar itens obrigatórios
    combo.requiredItems.forEach(item => {
      initialItems[item.id] = {
        type: item.type,
        flavors: [],
        quantity: 1
      }
    })
    
    setCustomizedCombo({
      comboId: combo.id,
      selectedItems: initialItems,
      totalPrice: combo.basePrice
    })
  }, [combo])

  useEffect(() => {
    if (isOpen) {
      fetchPizzaData()
      initializeCombo()
    }
  }, [isOpen, combo, initializeCombo])

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }))
  }

  const selectFlavor = (itemId: string, flavorId: string) => {
    setCustomizedCombo(prev => {
      const newItems = { ...prev.selectedItems }
      const item = newItems[itemId]
      
      if (!item) return prev
      
      const flavorIndex = item.flavors.indexOf(flavorId)
      if (flavorIndex > -1) {
        // Remover sabor se já estiver selecionado
        item.flavors.splice(flavorIndex, 1)
      } else {
        // Adicionar sabor se não estiver selecionado
        item.flavors.push(flavorId)
      }
      
      return {
        ...prev,
        selectedItems: newItems,
        totalPrice: calculateTotalPrice(newItems)
      }
    })
  }

  const addOptionalItem = (itemId: string, item: any) => {
    setCustomizedCombo(prev => {
      const newItems = { ...prev.selectedItems }
      
      if (newItems[itemId]) {
        newItems[itemId].quantity += 1
      } else {
        newItems[itemId] = {
          type: item.type,
          flavors: [],
          quantity: 1
        }
      }
      
      return {
        ...prev,
        selectedItems: newItems,
        totalPrice: calculateTotalPrice(newItems)
      }
    })
  }

  const removeOptionalItem = (itemId: string) => {
    setCustomizedCombo(prev => {
      const newItems = { ...prev.selectedItems }
      
      if (newItems[itemId]) {
        if (newItems[itemId].quantity > 1) {
          newItems[itemId].quantity -= 1
        } else {
          delete newItems[itemId]
        }
      }
      
      return {
        ...prev,
        selectedItems: newItems,
        totalPrice: calculateTotalPrice(newItems)
      }
    })
  }

  const calculateTotalPrice = (items: any) => {
    let total = combo.basePrice
    
    Object.values(items).forEach((item: any) => {
      // Adicionar preço dos sabores selecionados
      item.flavors.forEach((flavorId: string) => {
        const flavor = pizzaFlavors.find(f => f.id === flavorId)
        if (flavor) {
          total += flavor.price * item.quantity
        }
      })
      
      // Adicionar preço dos itens opcionais
      const optionalItem = combo.optionalItems.find(opt => opt.id === Object.keys(items).find(key => key === opt.id))
      if (optionalItem) {
        total += optionalItem.price * item.quantity
      }
    })
    
    return total
  }

  const isRequiredItemValid = (itemId: string) => {
    const item = customizedCombo.selectedItems[itemId]
    const requiredItem = combo.requiredItems.find(req => req.id === itemId)
    
    if (!requiredItem || !item) return false
    
    return item.flavors.length >= 1
  }

  const canAddToCart = () => {
    return combo.requiredItems.every(req => isRequiredItemValid(req.id))
  }

  const handleAddToCart = () => {
    if (!canAddToCart()) {
      toast.error('Selecione pelo menos um sabor para cada item obrigatório')
      return
    }
    
    onAddToCart(customizedCombo)
    toast.success('Combo adicionado ao carrinho!')
    onClose()
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">{combo.name}</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          <div className="space-y-6">
            
            {/* Itens Obrigatórios */}
            {combo.requiredItems.map((item) => (
              <div key={item.id} className="border rounded-lg">
                <div 
                  className="flex items-center justify-between p-4 cursor-pointer"
                  onClick={() => toggleSection(item.id)}
                >
                  <div className="flex items-center space-x-2">
                    <h3 className="font-semibold text-gray-900">{item.name}</h3>
                    <Badge variant="outline" className="text-xs">
                      Obrigatórios
                    </Badge>
                  </div>
                  {expandedSections[item.id] ? (
                    <ChevronUp className="h-5 w-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-500" />
                  )}
                </div>
                
                {expandedSections[item.id] && (
                  <div className="px-4 pb-4">
                    <p className="text-sm text-gray-600 mb-3">
                      Selecione mínimo 1 opções
                    </p>
                    
                    <div className="grid grid-cols-1 gap-2">
                      {pizzaFlavors
                        .filter(flavor => flavor.type === 'TRADICIONAL')
                        .map((flavor) => (
                          <label
                            key={flavor.id}
                            className="flex items-center space-x-3 p-2 rounded hover:bg-gray-50 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={customizedCombo.selectedItems[item.id]?.flavors.includes(flavor.id) || false}
                              onChange={() => selectFlavor(item.id, flavor.id)}
                              className="rounded border-gray-300 text-primary focus:ring-primary"
                            />
                            <span className="text-sm text-gray-900">{flavor.name}</span>
                            {flavor.price > 0 && (
                              <span className="text-sm text-green-600 ml-auto">
                                + {formatCurrency(flavor.price)}
                              </span>
                            )}
                          </label>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Itens Opcionais */}
            {combo.optionalItems.map((item) => (
              <div key={item.id} className="border rounded-lg">
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">{item.name}</h3>
                      <p className="text-sm text-gray-600">{formatCurrency(item.price)}</p>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {customizedCombo.selectedItems[item.id] && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeOptionalItem(item.id)}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                      )}
                      
                      <span className="text-sm font-medium min-w-[2rem] text-center">
                        {customizedCombo.selectedItems[item.id]?.quantity || 0}
                      </span>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => addOptionalItem(item.id, item)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Extras */}
            <div className="border rounded-lg">
              <div 
                className="flex items-center justify-between p-4 cursor-pointer"
                onClick={() => toggleSection('extras')}
              >
                <h3 className="font-semibold text-gray-900">ADD O REFRI</h3>
                {expandedSections['extras'] ? (
                  <ChevronUp className="h-5 w-5 text-gray-500" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-500" />
                )}
              </div>
              
              {expandedSections['extras'] && (
                <div className="px-4 pb-4">
                  <div className="space-y-2">
                    {extraItems
                      .filter(extra => extra.category === 'DRINK')
                      .map((extra) => (
                        <label
                          key={extra.id}
                          className="flex items-center space-x-3 p-2 rounded hover:bg-gray-50 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={customizedCombo.selectedItems[extra.id]?.quantity > 0 || false}
                            onChange={() => {
                              if (customizedCombo.selectedItems[extra.id]?.quantity > 0) {
                                removeOptionalItem(extra.id)
                              } else {
                                addOptionalItem(extra.id, extra)
                              }
                            }}
                            className="rounded border-gray-300 text-primary focus:ring-primary"
                          />
                          <span className="text-sm text-gray-900">
                            {extra.name} {extra.size && `(${extra.size})`}
                          </span>
                          <span className="text-sm text-green-600 ml-auto">
                            {extra.price === 0 ? 'GRÁTIS' : formatCurrency(extra.price)}
                          </span>
                        </label>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t bg-gray-50">
          <div className="text-lg font-bold text-primary">
            Preço: {formatCurrency(customizedCombo.totalPrice)}
          </div>
          
          <Button
            onClick={handleAddToCart}
            disabled={!canAddToCart()}
            className="bg-primary hover:bg-primary/90"
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            Adicionar ao Carrinho
          </Button>
        </div>
      </div>
    </div>
  )
}
