'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Clock, MapPin, Phone, Star, ShoppingCart, Plus, Minus } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

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

interface Combo {
  id: string
  name: string
  description: string
  price: number
  image?: string
  isActive: boolean
  category: {
    id: string
    name: string
  }
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
  const [cart, setCart] = useState<{[key: string]: number}>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSettings()
    fetchCategories()
    loadCartFromStorage()
  }, [])

  const loadCartFromStorage = () => {
    try {
      const savedCart = localStorage.getItem('cart')
      if (savedCart) {
        setCart(JSON.parse(savedCart))
      }
    } catch (error) {
      console.error('Erro ao carregar carrinho do localStorage:', error)
    }
  }

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
      const response = await fetch('/api/categories')
      if (response.ok) {
        const data = await response.json()
        setCategories(data)
      }
    } catch (error) {
      console.error('Erro ao carregar categorias:', error)
    } finally {
      setLoading(false)
    }
  }

  const addToCart = (comboId: string) => {
    console.log('Adicionando ao carrinho:', comboId)
    setCart(prev => {
      const newCart = {
        ...prev,
        [comboId]: (prev[comboId] || 0) + 1
      }
      console.log('Novo carrinho:', newCart)
      // Salvar no localStorage
      localStorage.setItem('cart', JSON.stringify(newCart))
      return newCart
    })
  }

  const removeFromCart = (comboId: string) => {
    setCart(prev => {
      const newCart = { ...prev }
      if (newCart[comboId] > 1) {
        newCart[comboId] -= 1
      } else {
        delete newCart[comboId]
      }
      // Salvar no localStorage
      localStorage.setItem('cart', JSON.stringify(newCart))
      return newCart
    })
  }

  const getCartTotal = () => {
    return Object.entries(cart).reduce((total, [comboId, quantity]) => {
      const combo = categories.flatMap(cat => cat.combos).find(c => c.id === comboId)
      return total + (combo ? combo.price * quantity : 0)
    }, 0)
  }

  const getCartItemsCount = () => {
    return Object.values(cart).reduce((total, quantity) => total + quantity, 0)
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
                  <Button variant="outline" size="sm" className="text-xs md:text-sm">
                    <Phone className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                    <span className="hidden md:inline">{settings.restaurantPhone}</span>
                    <span className="md:hidden">Telefone</span>
                  </Button>
                )}
                {settings?.restaurantAddress && (
                  <Button variant="outline" size="sm" className="text-xs md:text-sm">
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
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Categorias e produtos */}
        <div className="space-y-8">
          {categories.map((category) => (
            <div key={category.id} className="space-y-4">
              <div className="flex items-center space-x-3">
                {category.image && (
                  <div className="w-12 h-12 relative rounded-lg overflow-hidden">
                    <Image
                      src={category.image}
                      alt={category.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{category.name}</h2>
                  {category.description && (
                    <p className="text-gray-600">{category.description}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {category.combos.map((combo) => (
                  <Card key={combo.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    {combo.image && (
                      <div className="h-48 relative">
                        {combo.image.startsWith('data:') ? (
                          <img
                            src={combo.image}
                            alt={combo.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Image
                            src={combo.image}
                            alt={combo.name}
                            fill
                            className="object-cover"
                          />
                        )}
                      </div>
                    )}
                    <CardHeader>
                      <CardTitle className="text-lg">{combo.name}</CardTitle>
                      <CardDescription>{combo.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="text-2xl font-bold text-red-600">
                          R$ {combo.price.toFixed(2).replace('.', ',')}
                        </div>
                        <div className="flex items-center space-x-2">
                          {cart[combo.id] > 0 && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => removeFromCart(combo.id)}
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                              <span className="w-8 text-center font-medium">
                                {cart[combo.id]}
                              </span>
                            </>
                          )}
                          <Button
                            onClick={() => addToCart(combo.id)}
                            className="bg-red-500 hover:bg-red-600"
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Adicionar
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Carrinho flutuante */}
      {getCartItemsCount() > 0 && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-auto z-50">
          <Link href="/client/checkout-public" className="block">
            <Button className="w-full md:w-auto bg-red-500 hover:bg-red-600 text-white px-4 md:px-6 py-3 rounded-full shadow-lg">
              <ShoppingCart className="h-4 w-4 md:h-5 md:w-5 mr-2" />
              <span className="hidden md:inline">Ver Carrinho</span>
              <span className="md:hidden">Carrinho</span>
              ({getCartItemsCount()})
              <span className="ml-2 font-bold">
                R$ {getCartTotal().toFixed(2).replace('.', ',')}
              </span>
            </Button>
          </Link>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              {settings?.restaurantLogo && (
                <div className="w-8 h-8 relative rounded-lg overflow-hidden mr-3">
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
              <span className="text-lg font-bold text-gray-900">
                {settings?.restaurantName || 'Central Das Pizzas'}
              </span>
            </div>
            <p className="text-gray-600 text-sm">
              &copy; 2024 {settings?.restaurantName || 'Central Das Pizzas'}. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}