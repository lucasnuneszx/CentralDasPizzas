'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Clock, MapPin, Phone, Star, ShoppingCart, Plus, Minus, ChefHat, Search, Filter, X } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import ItemCustomizer from '@/components/item-customizer'
import PizzaSizeSelector from '@/components/pizza-size-selector'
import CartItem from '@/components/cart-item'
import { SiteLogo } from '@/components/site-logo'
import { CustomizedItem, Combo } from '@/types/cart'

interface SystemSettings {
  id: string
  restaurantName: string
  restaurantAddress?: string
  restaurantPhone?: string
  restaurantLogo?: string
  restaurantBanner?: string
  deliveryEstimate?: string
  isOpen: boolean
  openingHours?: string
}


interface Category {
  id: string
  name: string
  description?: string
  image?: string
  isActive: boolean
  combos: Combo[]
}

export default function MenuPage() {
  const [settings, setSettings] = useState<SystemSettings | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [cart, setCart] = useState<CustomizedItem[]>([])
  const [loading, setLoading] = useState(true)
  const [customizingItem, setCustomizingItem] = useState<Combo | null>(null)
  const [selectingSize, setSelectingSize] = useState<Combo | null>(null)
  const [editingItem, setEditingItem] = useState<CustomizedItem | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  const loadCartFromStorage = useCallback(() => {
    try {
      const savedCart = localStorage.getItem('cart')
      if (savedCart) {
        const parsedCart = JSON.parse(savedCart)
        // Converter formato antigo para novo se necessário
        if (Array.isArray(parsedCart)) {
          setCart(parsedCart)
        } else {
          // Converter formato antigo {id: quantity} para novo formato
          const newCart: CustomizedItem[] = []
          Object.entries(parsedCart).forEach(([comboId, quantity]) => {
            const combo = categories.flatMap(cat => cat.combos).find(c => c.id === comboId)
            if (combo) {
              newCart.push({
                id: `${comboId}-${Date.now()}`,
                combo: {
                  ...combo,
                  isActive: true
                },
                quantity: quantity as number,
                observations: '',
                stuffedCrust: false,
                totalPrice: combo.price * (quantity as number)
              })
            }
          })
          setCart(newCart)
        }
      }
    } catch (error) {
      console.error('Erro ao carregar carrinho do localStorage:', error)
    }
  }, [categories])

  useEffect(() => {
    console.log('🚀 Componente montado. Iniciando carregamento...')
    fetchSettings()
    fetchCategories()
  }, [])
  
  // Re-tentar carregar se não houver categorias após 3 segundos
  useEffect(() => {
    if (!loading && categories.length === 0) {
      console.warn('⚠️ Nenhuma categoria carregada. Tentando novamente em 3 segundos...')
      const timer = setTimeout(() => {
        console.log('🔄 Re-tentando carregar categorias...')
        fetchCategories()
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [loading, categories.length])

  useEffect(() => {
    if (categories.length > 0) {
      loadCartFromStorage()
    }
  }, [categories, loadCartFromStorage])

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings')
      if (response.ok) {
        const data = await response.json()
        setSettings(data)
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error)
    }
  }

  const fetchCategories = async () => {
    try {
      setLoading(true)
      console.log('🔄 Iniciando busca de categorias...')
      
      // CRÍTICO: Usar URL absoluta e garantir que funcione
      let apiUrl = '/api/categories'
      if (typeof window !== 'undefined') {
        // Garantir URL absoluta
        const origin = window.location.origin
        apiUrl = `${origin}/api/categories`
        console.log('📡 URL da API (absoluta):', apiUrl)
        console.log('📡 Window location:', window.location.href)
      }
      
      console.log('📡 Fazendo fetch para:', apiUrl)
      
      // Tentar múltiplas vezes se necessário
      let response: Response | null = null
      let lastError: Error | null = null
      
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          console.log(`🔄 Tentativa ${attempt}/3...`)
          response = await fetch(apiUrl, {
            method: 'GET',
            cache: 'no-store',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
            credentials: 'same-origin',
            // Adicionar timeout
            signal: AbortSignal.timeout(10000) // 10 segundos
          } as RequestInit)
          
          console.log('📥 Resposta recebida:', response.status, response.statusText)
          break // Sucesso, sair do loop
        } catch (fetchError) {
          lastError = fetchError as Error
          console.error(`❌ Erro na tentativa ${attempt}:`, fetchError)
          if (attempt < 3) {
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt)) // Esperar antes de tentar novamente
          }
        }
      }
      
      if (!response) {
        throw lastError || new Error('Não foi possível fazer fetch após 3 tentativas')
      }
      
      if (response.ok) {
        const data = await response.json()
        console.log('✅ Dados recebidos (tipo):', typeof data, Array.isArray(data))
        console.log('✅ Dados recebidos (quantidade):', data?.length || 0)
        
        if (data && Array.isArray(data) && data.length > 0) {
          console.log('✅ Primeira categoria (exemplo):', {
            name: data[0]?.name,
            combosCount: data[0]?.combos?.length || 0,
            isActive: data[0]?.isActive
          })
          
          const totalCombos = data.reduce((total: number, cat: Category) => {
            return total + (cat.combos && Array.isArray(cat.combos) ? cat.combos.length : 0)
          }, 0)
          console.log('✅ Total de combos:', totalCombos)
          
          // IMPORTANTE: Não filtrar categorias sem combos - mostrar todas
          const validCategories = data.filter((cat: Category) => {
            const isValid = cat && 
                           cat.isActive !== false &&
                           Array.isArray(cat.combos)
            return isValid
          })
          
          console.log('✅ Categorias válidas:', validCategories.length)
          
          // FORÇAR atualização do estado
          setCategories(validCategories)
          
          // Forçar re-render
          setTimeout(() => {
            console.log('🔄 Forçando re-render após 100ms...')
            setCategories(prev => {
              console.log('🔄 Estado atual no re-render:', prev.length)
              return prev
            })
          }, 100)
          
          console.log('✅ Categorias setadas no estado:', validCategories.length)
        } else {
          console.error('❌ Dados inválidos ou vazios:', {
            isArray: Array.isArray(data),
            length: data?.length,
            data: data
          })
          setCategories([])
        }
      } else {
        const errorText = await response.text()
        console.error('❌ Erro HTTP:', response.status, response.statusText)
        console.error('❌ Resposta de erro:', errorText)
        setCategories([])
      }
    } catch (error) {
      console.error('❌ Erro ao carregar categorias:', error)
      if (error instanceof Error) {
        console.error('❌ Mensagem:', error.message)
        console.error('❌ Stack:', error.stack)
      }
      setCategories([])
    } finally {
      setLoading(false)
      console.log('✅ Carregamento finalizado. Estado final:', categories.length)
    }
  }

  const handleItemCustomize = async (combo: Combo) => {
    if (combo.isPizza) {
      // Verificar se a pizza tem tamanhos configurados
      try {
        const response = await fetch(`/api/pizza-sizes?comboId=${combo.id}`)
        if (response.ok) {
          const sizes = await response.json()
          if (sizes.length > 0) {
            // Pizza com tamanhos - usar seletor simples
            setSelectingSize(combo)
            return
          }
        }
      } catch (error) {
        console.error('Erro ao verificar tamanhos:', error)
      }
    }
    
    // Pizza sem tamanhos ou combo normal - usar personalizador completo
    setCustomizingItem(combo)
  }

  const handleItemEdit = (item: CustomizedItem) => {
    setEditingItem(item)
    setCustomizingItem(item.combo)
  }

  const handleAddToCart = (customizedItem: CustomizedItem) => {
    setCart(prev => {
      const newCart = [...prev, customizedItem]
      localStorage.setItem('cart', JSON.stringify(newCart))
      return newCart
    })
    setCustomizingItem(null)
    setEditingItem(null)
  }

  const handleAddPizzaToCart = (item: {
    id: string
    combo: any
    quantity: number
    observations: string
    selectedSize: any
    totalPrice: number
  }) => {
    const customizedItem: CustomizedItem = {
      id: item.id,
      combo: item.combo,
      quantity: item.quantity,
      observations: item.observations,
      stuffedCrust: false,
      totalPrice: item.totalPrice,
      selectedSize: item.selectedSize
    }
    
    setCart(prev => {
      const newCart = [...prev, customizedItem]
      localStorage.setItem('cart', JSON.stringify(newCart))
      return newCart
    })
    setSelectingSize(null)
  }

  const handleUpdateQuantity = (itemId: string, quantity: number) => {
    setCart(prev => {
      const newCart = prev.map(item => 
        item.id === itemId ? { ...item, quantity } : item
      )
      localStorage.setItem('cart', JSON.stringify(newCart))
      return newCart
    })
  }

  const handleRemoveItem = (itemId: string) => {
    setCart(prev => {
      const newCart = prev.filter(item => item.id !== itemId)
      localStorage.setItem('cart', JSON.stringify(newCart))
      return newCart
    })
  }

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + item.totalPrice, 0)
  }

  const getCartItemsCount = () => {
    return cart.reduce((total, item) => total + item.quantity, 0)
  }

  // Filtrar categorias e combos baseado na seleção e busca
  // IMPORTANTE: Se não houver filtros, mostrar TODAS as categorias COM combos
  const filteredCategories = (() => {
    console.log('🔍 Aplicando filtros...', {
      totalCategories: categories.length,
      selectedCategory,
      searchTerm,
      categoriesWithCombos: categories.filter(c => c.combos && c.combos.length > 0).length
    })
    
    // Se não há filtros ativos, mostrar todas as categorias com combos
    if (!selectedCategory && !searchTerm) {
      const result = categories.filter(category => {
        const hasCombos = category && 
               category.combos && 
               Array.isArray(category.combos) && 
               category.combos.length > 0 &&
               category.isActive !== false
        
        if (!hasCombos && category) {
          console.log(`  ⚠️ Categoria "${category.name}" sem combos ou inativa`)
        }
        
        return hasCombos
      })
      
      console.log('✅ Categorias sem filtro:', result.length)
      return result
    }
    
    // Se há filtros, aplicar lógica de filtro
    const result = categories.filter(category => {
      // Verificar se a categoria tem combos
      if (!category || !category.combos || !Array.isArray(category.combos) || category.combos.length === 0) {
        return false
      }
      
      // Filtrar por categoria selecionada
      if (selectedCategory && category.id !== selectedCategory) {
        return false
      }
      
      // Filtrar combos dentro da categoria baseado na busca
      const filteredCombos = category.combos.filter(combo => {
        if (!combo) return false
        
        // Se não há termo de busca, mostrar todos os combos ativos
        if (!searchTerm) {
          return combo.isActive !== false
        }
        
        // Se há termo de busca, filtrar
        if (combo.isActive === false) return false
        
        const searchLower = searchTerm.toLowerCase()
        const nameMatch = combo.name?.toLowerCase().includes(searchLower) || false
        const descMatch = combo.description?.toLowerCase().includes(searchLower) || false
        return nameMatch || descMatch
      })
      
      // Retornar categoria apenas se tiver combos após filtro
      return filteredCombos.length > 0
    })
    
    console.log('✅ Categorias após filtro:', result.length)
    return result
  })()
  
  // Debug: Log para verificar filtros
  useEffect(() => {
    if (!loading) {
      console.log('📊 Estado atual:')
      console.log('  - Total de categorias:', categories.length)
      console.log('  - Categorias filtradas:', filteredCategories.length)
      console.log('  - Categoria selecionada:', selectedCategory)
      console.log('  - Termo de busca:', searchTerm)
      console.log('  - Total de combos:', categories.reduce((total, cat) => total + (cat.combos?.length || 0), 0))
    }
  }, [categories, filteredCategories, selectedCategory, searchTerm, loading])

  // Obter categorias para os filtros rápidos
  const getQuickFilterCategories = () => {
    return categories
      .filter(category => category && category.combos && Array.isArray(category.combos))
      .map(category => ({
        id: category.id,
        name: category.name,
        count: category.combos?.length || 0
      }))
      .filter(cat => cat.count > 0) // Apenas categorias com combos
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-red-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando cardápio...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50">
      {/* Header com banner e informações da loja */}
      <header className="relative">
        {settings?.restaurantBanner && (
          <div className="h-32 md:h-48 w-full relative overflow-hidden">
            {settings.restaurantBanner.startsWith('data:') ? (
              <img
                src={settings.restaurantBanner}
                alt="Banner da loja"
                className="w-full h-full object-cover"
              />
            ) : (
              <Image
                src={settings.restaurantBanner}
                alt="Banner da loja"
                fill
                className="object-cover"
              />
            )}
            <div className="absolute inset-0 bg-black/30"></div>
          </div>
        )}
        
        <div className="bg-white shadow-sm">
          <div className="max-w-4xl mx-auto px-4 py-4 md:py-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center space-x-4">
                {settings?.restaurantLogo && (
                  <div className="w-12 h-12 md:w-16 md:h-16 relative rounded-full overflow-hidden flex-shrink-0">
                    {settings.restaurantLogo.startsWith('data:') ? (
                      <img
                        src={settings.restaurantLogo}
                        alt="Logo da loja"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Image
                        src={settings.restaurantLogo}
                        alt="Logo da loja"
                        fill
                        className="object-cover"
                      />
                    )}
                  </div>
                )}
                <div>
                  <h1 className="text-xl md:text-2xl font-bold text-gray-900">
                    {settings?.restaurantName || 'Central Das Pizzas'}
                  </h1>
                  <div className="flex flex-wrap items-center gap-2 md:gap-4 text-sm text-gray-600">
                    {settings?.deliveryEstimate && (
                      <div className="flex items-center space-x-1">
                        <Clock className="h-3 w-3 md:h-4 md:w-4" />
                        <span className="text-xs md:text-sm">Entrega {settings.deliveryEstimate}</span>
                      </div>
                    )}
                    {settings?.isOpen !== undefined && (
                      <Badge variant={settings.isOpen ? "default" : "destructive"} className="text-xs">
                        {settings.isOpen ? "Aberto" : "Fechado"}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex flex-wrap items-center gap-2">
                {settings?.restaurantPhone && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-xs md:text-sm"
                    onClick={() => window.open(`tel:${settings.restaurantPhone?.replace(/\D/g, '')}`, '_self')}
                  >
                    <Phone className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                    <span className="hidden md:inline">{settings.restaurantPhone}</span>
                    <span className="md:hidden">Telefone</span>
                  </Button>
                )}
                {settings?.restaurantAddress && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-xs md:text-sm"
                    onClick={() => {
                      const address = encodeURIComponent(settings.restaurantAddress || '')
                      window.open(`https://www.google.com/maps/search/?api=1&query=${address}`, '_blank')
                    }}
                  >
                    <MapPin className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                    Endereço
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Conteúdo principal */}
      <main className="max-w-6xl mx-auto px-3 md:px-4 py-4 md:py-8">
        {/* Filtros e Busca */}
        <div className="mb-8 space-y-4">
          {/* Barra de Busca */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Buscar por nome ou descrição..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-12 py-4 bg-white border-2 border-gray-200 rounded-full focus:ring-2 focus:ring-red-500 focus:border-red-500 text-gray-900 placeholder-gray-500 shadow-sm hover:shadow-md transition-all duration-200"
            />
            {searchTerm && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full p-1"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Filtros Rápidos por Categoria */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Filter className="h-5 w-5 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Filtrar por categoria:</span>
            </div>
            <div className="flex flex-wrap gap-2 md:gap-3">
              <Button
                variant={selectedCategory === null ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(null)}
                className={`px-3 md:px-4 py-2 rounded-full font-medium transition-all duration-200 text-xs md:text-sm ${
                  selectedCategory === null 
                    ? "bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg hover:shadow-xl hover:from-red-600 hover:to-red-700" 
                    : "bg-white border-2 border-gray-200 text-gray-700 hover:border-red-300 hover:text-red-600 hover:bg-red-50"
                }`}
              >
                <span className="flex items-center space-x-1 md:space-x-2">
                  <span>🍽️</span>
                  <span className="whitespace-nowrap">Todos ({categories.reduce((total, cat) => total + (cat.combos?.length || 0), 0)})</span>
                </span>
              </Button>
              {getQuickFilterCategories().map((category) => {
                const getCategoryIcon = (name: string) => {
                  if (name.includes('Combo')) return '🍽️'
                  if (name.includes('Pizza')) return '🍕'
                  if (name.includes('Hambúrguer')) return '🍔'
                  if (name.includes('Bebida')) return '🥤'
                  return '🍽️'
                }
                
                return (
                  <Button
                    key={category.id}
                    variant={selectedCategory === category.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(category.id)}
                    className={`px-3 md:px-4 py-2 rounded-full font-medium transition-all duration-200 text-xs md:text-sm ${
                      selectedCategory === category.id 
                        ? "bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg hover:shadow-xl hover:from-red-600 hover:to-red-700" 
                        : "bg-white border-2 border-gray-200 text-gray-700 hover:border-red-300 hover:text-red-600 hover:bg-red-50"
                    }`}
                  >
                    <span className="flex items-center space-x-1 md:space-x-2">
                      <span>{getCategoryIcon(category.name)}</span>
                      <span className="whitespace-nowrap">{category.name} ({category.count || 0})</span>
                    </span>
                  </Button>
                )
              })}
            </div>
          </div>

          {/* Resultados da Busca */}
          {searchTerm && (
            <div className="text-sm text-gray-600">
              {filteredCategories.length > 0 ? (
                <span>
                  Encontrados {filteredCategories.reduce((total, cat) => total + cat.combos.length, 0)} itens para &quot;{searchTerm}&quot;
                </span>
              ) : (
                <span className="text-red-500">
                  Nenhum item encontrado para &quot;{searchTerm}&quot;
                </span>
              )}
            </div>
          )}

          {/* Botão para limpar filtros */}
          {(selectedCategory || searchTerm) && (
            <div className="flex justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedCategory(null)
                  setSearchTerm('')
                }}
                className="px-6 py-2 bg-white border-2 border-gray-200 text-gray-700 hover:border-red-300 hover:text-red-600 hover:bg-red-50 rounded-full font-medium transition-all duration-200"
              >
                <X className="h-4 w-4 mr-2" />
                Limpar Filtros
              </Button>
            </div>
          )}
        </div>

        {/* Categorias e produtos */}
        <div className="space-y-8">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-red-500 border-t-transparent mx-auto mb-4"></div>
              <p className="text-gray-500">Carregando produtos...</p>
            </div>
          ) : (() => {
            // DEBUG: Forçar mostrar todas as categorias com combos
            const categoriesToShow = categories.filter(cat => {
              const hasCombos = cat && 
                               cat.combos && 
                               Array.isArray(cat.combos) && 
                               cat.combos.length > 0 &&
                               cat.isActive !== false
              return hasCombos
            })
            
            console.log('🔍 DEBUG RENDER:', {
              totalCategories: categories.length,
              categoriesWithCombos: categoriesToShow.length,
              filteredCategories: filteredCategories.length,
              selectedCategory,
              searchTerm,
              categoriesToShowNames: categoriesToShow.map(c => c.name)
            })
            
            // Se não há categorias para mostrar, mostrar mensagem
            if (categoriesToShow.length === 0) {
              return (
                <div className="text-center py-12">
                  <p className="text-gray-500 text-lg font-semibold">Nenhum produto encontrado.</p>
                  <p className="text-gray-400 text-sm mt-2">
                    {categories.length === 0 
                      ? 'Não há produtos cadastrados no momento.' 
                      : 'Categorias carregadas mas nenhuma tem produtos ativos.'}
                  </p>
                  <div className="mt-4 text-xs text-gray-400 space-y-1">
                    <p>Debug: Total de categorias: {categories.length}</p>
                    <p>Debug: Categorias com combos: {categoriesToShow.length}</p>
                    <p>Debug: Loading: {loading ? 'Sim' : 'Não'}</p>
                    <p>Debug: URL: {typeof window !== 'undefined' ? window.location.origin : 'N/A'}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      console.log('🔄 Botão de recarregar clicado')
                      setLoading(true)
                      fetchCategories()
                    }}
                    className="mt-4 px-6 py-2 bg-red-500 text-white hover:bg-red-600"
                  >
                    🔄 Recarregar Produtos
                  </Button>
                </div>
              )
            }
            
            // Usar filteredCategories se houver filtros, senão usar todas as categorias com combos
            const finalCategories = (selectedCategory || searchTerm) ? filteredCategories : categoriesToShow
            
            if (finalCategories.length === 0 && (selectedCategory || searchTerm)) {
              return (
                <div className="text-center py-12">
                  <p className="text-gray-500 text-lg font-semibold">Nenhum produto encontrado com os filtros.</p>
                  <p className="text-gray-400 text-sm mt-2">Tente ajustar os filtros de busca ou limpar os filtros.</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedCategory(null)
                      setSearchTerm('')
                    }}
                    className="mt-4 px-6 py-2 bg-white border-2 border-gray-200 text-gray-700 hover:border-red-300 hover:text-red-600 hover:bg-red-50 rounded-full font-medium transition-all duration-200"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Limpar Filtros
                  </Button>
                </div>
              )
            }
            
            // Renderizar categorias
            return finalCategories.map((category) => {
              // Filtrar combos dentro da categoria baseado na busca
              const filteredCombos = (category.combos || []).filter(combo => {
                if (!combo) return false
                if (combo.isActive === false) return false
                
                if (searchTerm) {
                  const searchLower = searchTerm.toLowerCase()
                  const nameMatch = combo.name?.toLowerCase().includes(searchLower) || false
                  const descMatch = combo.description?.toLowerCase().includes(searchLower) || false
                  return nameMatch || descMatch
                }
                return true
              })

              // IMPORTANTE: Mostrar categoria mesmo se não tiver combos após filtro
              // Isso ajuda a identificar problemas
              if (filteredCombos.length === 0 && category.combos && category.combos.length > 0) {
                console.warn('⚠️ Categoria sem combos após filtro:', category.name, 'Combos originais:', category.combos.length)
                // Se há combos originais mas foram filtrados, mostrar mensagem
                return (
                  <div key={category.id} className="text-center py-8 text-gray-500">
                    <p>Categoria &quot;{category.name}&quot; não tem produtos que correspondem aos filtros.</p>
                  </div>
                )
              }
              
              if (filteredCombos.length === 0) return null

              return (
              <div key={category.id} className="space-y-4">
                <div className="flex items-center space-x-3">
                  {category.image && (
                    <div className="w-12 h-12 relative rounded-lg overflow-hidden flex-shrink-0">
                      <Image
                        src={category.image}
                        alt={category.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div>
                    <h2 className="text-lg md:text-xl font-bold text-gray-900">{category.name}</h2>
                    {category.description && (
                      <p className="text-sm md:text-base text-gray-600">{category.description}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                  {filteredCombos.map((combo) => (
                  <Card key={combo.id} className="product-card bg-white border border-gray-200 hover:shadow-lg transition-shadow duration-200">
                    {combo.image && (
                      <div className="h-48 md:h-64 relative bg-gray-50 flex items-center justify-center p-4 md:p-6 overflow-hidden">
                        {combo.image.startsWith('data:') ? (
                          <img
                            src={combo.image}
                            alt={combo.name}
                            className="max-w-full max-h-full object-contain"
                            style={{ 
                              maxWidth: '100%', 
                              maxHeight: '100%',
                              width: 'auto',
                              height: 'auto',
                              objectFit: 'contain',
                              objectPosition: 'center'
                            }}
                          />
                        ) : (
                          <Image
                            src={combo.image}
                            alt={combo.name}
                            fill
                            className="object-contain"
                          />
                        )}
                      </div>
                    )}
                    <CardHeader className="pb-3 px-4 md:px-6">
                      <CardTitle className="text-base md:text-lg font-semibold text-gray-900 line-clamp-2">{combo.name}</CardTitle>
                      {combo.description && (
                        <CardDescription className="text-xs md:text-sm text-gray-600 line-clamp-2 mt-1">{combo.description}</CardDescription>
                      )}
                      {combo.isPizza && (
                        <Badge className="bg-orange-100 text-orange-800 w-fit mt-2 text-xs">
                          <ChefHat className="h-3 w-3 mr-1" />
                          Personalizável
                        </Badge>
                      )}
                    </CardHeader>
                    <CardContent className="pt-0 px-4 md:px-6 pb-4 md:pb-6">
                      <div className="flex flex-col space-y-3">
                        <div className="text-xl md:text-2xl font-bold text-red-600">
                          R$ {combo.price.toFixed(2).replace('.', ',')}
                        </div>
                        <Button
                          onClick={() => handleItemCustomize(combo)}
                          className="w-full bg-red-500 hover:bg-red-600 text-white font-medium py-2 text-sm md:text-base"
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          {combo.isPizza ? 'Personalizar' : 'Adicionar'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                  ))}
                </div>
              </div>
              )
            })
          })()}
        </div>
      </main>

      {/* Carrinho flutuante */}
      {getCartItemsCount() > 0 && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50">
          <div className="bg-white rounded-lg shadow-xl border max-h-96 overflow-hidden">
            {/* Header do carrinho */}
            <div className="p-4 border-b bg-gray-50">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">
                  Carrinho ({getCartItemsCount()})
                </h3>
                <Link href="/client/checkout-public">
                  <Button size="sm" className="bg-red-500 hover:bg-red-600">
                    Finalizar
                  </Button>
                </Link>
              </div>
            </div>

            {/* Itens do carrinho */}
            <div className="max-h-64 overflow-y-auto">
              {cart.map((item) => (
                <CartItem
                  key={item.id}
                  item={item}
                  onUpdateQuantity={handleUpdateQuantity}
                  onRemove={handleRemoveItem}
                  onEdit={handleItemEdit}
                />
              ))}
            </div>

            {/* Total */}
            <div className="p-4 border-t bg-gray-50">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-900">Total:</span>
                <span className="text-xl font-bold text-red-600">
                  R$ {getCartTotal().toFixed(2).replace('.', ',')}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-4xl mx-auto px-4 py-8">
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
            </div>
            
            {/* Espaço vazio para balancear o layout */}
            <div className="w-32"></div>
          </div>
        </div>
      </footer>

      {/* Modal de personalização */}
      {customizingItem && (
        <ItemCustomizer
          item={customizingItem}
          onAddToCart={handleAddToCart}
          onClose={() => {
            setCustomizingItem(null)
            setEditingItem(null)
          }}
        />
      )}

      {/* Modal de seleção de tamanhos de pizza */}
      {selectingSize && (
        <PizzaSizeSelector
          combo={selectingSize}
          onAddToCart={handleAddPizzaToCart}
          onClose={() => setSelectingSize(null)}
        />
      )}
    </div>
  )
}