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
  }, [])

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
    setCart(prev => ({
      ...prev,
      [comboId]: (prev[comboId] || 0) + 1
    }))
  }

  const removeFromCart = (comboId: string) => {
    setCart(prev => {
      const newCart = { ...prev }
      if (newCart[comboId] > 1) {
        newCart[comboId] -= 1
      } else {
        delete newCart[comboId]
      }
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
          <div className="h-48 w-full relative overflow-hidden">
            <Image
              src={settings.restaurantBanner}
              alt="Banner da loja"
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-black/30"></div>
          </div>
        )}
        
        <div className="bg-white shadow-sm">
          <div className="max-w-4xl mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {settings?.restaurantLogo && (
                  <div className="w-16 h-16 relative rounded-full overflow-hidden">
                    <Image
                      src={settings.restaurantLogo}
                      alt="Logo da loja"
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {settings?.restaurantName || 'Central Das Pizzas'}
                  </h1>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    {settings?.deliveryEstimate && (
                      <div className="flex items-center space-x-1">
                        <Clock className="h-4 w-4" />
                        <span>Entrega {settings.deliveryEstimate}</span>
                      </div>
                    )}
                    {settings?.isOpen !== undefined && (
                      <Badge variant={settings.isOpen ? "default" : "destructive"}>
                        {settings.isOpen ? "Aberto" : "Fechado"}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                {settings?.restaurantPhone && (
                  <Button variant="outline" size="sm">
                    <Phone className="h-4 w-4 mr-2" />
                    {settings.restaurantPhone}
                  </Button>
                )}
                {settings?.restaurantAddress && (
                  <Button variant="outline" size="sm">
                    <MapPin className="h-4 w-4 mr-2" />
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
                        <Image
                          src={combo.image}
                          alt={combo.name}
                          fill
                          className="object-cover"
                        />
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
        <div className="fixed bottom-4 right-4 z-50">
          <Link href="/client/checkout-public">
            <Button className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-full shadow-lg">
              <ShoppingCart className="h-5 w-5 mr-2" />
              Ver Carrinho ({getCartItemsCount()})
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
                  <Image
                    src={settings.restaurantLogo}
                    alt="Logo da loja"
                    fill
                    className="object-cover"
                  />
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