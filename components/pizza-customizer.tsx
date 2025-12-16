'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Plus, Minus, ShoppingCart } from 'lucide-react'

interface PizzaFlavor {
  id: string
  name: string
  description: string
  type: 'TRADICIONAL' | 'PREMIUM' | 'ESPECIAL'
}

interface PizzaSize {
  id: string
  name: string
  slices: number
  maxFlavors: number
  basePrice: number
}

interface PizzaCustomizerProps {
  onAddToCart: (pizza: CustomPizza) => void
}

interface CustomPizza {
  size: PizzaSize
  flavors: PizzaFlavor[]
  observations: string
  stuffedCrust: boolean
  totalPrice: number
}

export default function PizzaCustomizer({ onAddToCart }: PizzaCustomizerProps) {
  const [flavors, setFlavors] = useState<PizzaFlavor[]>([])
  const [sizes, setSizes] = useState<PizzaSize[]>([])
  const [selectedSize, setSelectedSize] = useState<PizzaSize | null>(null)
  const [selectedFlavors, setSelectedFlavors] = useState<PizzaFlavor[]>([])
  const [observations, setObservations] = useState('')
  const [stuffedCrust, setStuffedCrust] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [flavorsRes, sizesRes] = await Promise.all([
        fetch('/api/pizza-flavors'),
        fetch('/api/pizza-sizes')
      ])

      if (flavorsRes.ok && sizesRes.ok) {
        const flavorsData = await flavorsRes.json()
        const sizesData = await sizesRes.json()

        // Normalizar limites de sabores por tamanho
        // Grande: 2 sabores | Família: 3 sabores
        const normalizedSizes: PizzaSize[] = (sizesData || []).map((size: PizzaSize) => {
          const name = (size.name || '').toLowerCase()
          let maxFlavors = size.maxFlavors

          if (name.includes('grande')) {
            maxFlavors = 2
          } else if (name.includes('família') || name.includes('familia')) {
            maxFlavors = 3
          }

          return {
            ...size,
            maxFlavors
          }
        })
        
        setFlavors(flavorsData)
        setSizes(normalizedSizes)
        
        // Selecionar o primeiro tamanho por padrão
        if (normalizedSizes.length > 0) {
          setSelectedSize(normalizedSizes[0])
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
    if (!selectedSize) return 0

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

    return total
  }

  const handleAddToCart = () => {
    if (!selectedSize || selectedFlavors.length === 0) return

    const customPizza: CustomPizza = {
      size: selectedSize,
      flavors: selectedFlavors,
      observations,
      stuffedCrust,
      totalPrice: calculatePrice()
    }

    onAddToCart(customPizza)
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
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-red-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando opções de pizza...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Monte sua Pizza</h2>
        <p className="text-gray-600">Escolha o tamanho, sabores e personalizações</p>
      </div>

      {/* Seleção de Tamanho */}
      <Card>
        <CardHeader>
          <CardTitle>Tamanho da Pizza</CardTitle>
          <CardDescription>Escolha o tamanho da sua pizza</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {sizes.map((size) => (
              <Button
                key={size.id}
                variant={selectedSize?.id === size.id ? "default" : "outline"}
                className="h-auto p-4 flex flex-col items-center space-y-2"
                onClick={() => handleSizeSelect(size)}
              >
                <div className="font-semibold">{size.name}</div>
                <div className="text-sm text-gray-600">{size.slices} fatias</div>
                <div className="text-sm text-gray-600">Até {size.maxFlavors} sabores</div>
                <div className="font-bold text-lg">R$ {size.basePrice.toFixed(2).replace('.', ',')}</div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Seleção de Sabores */}
      {selectedSize && (
        <Card>
          <CardHeader>
            <CardTitle>Sabores da Pizza</CardTitle>
            <CardDescription>
              Escolha até {selectedSize.maxFlavors} sabores
              {selectedFlavors.length > 0 && ` (${selectedFlavors.length}/${selectedSize.maxFlavors})`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {['TRADICIONAL', 'PREMIUM', 'ESPECIAL'].map((type) => {
                const typeFlavors = flavors.filter(f => f.type === type)
                if (typeFlavors.length === 0) return null

                return (
                  <div key={type}>
                    <h3 className="text-lg font-semibold mb-3 capitalize">{type.toLowerCase()}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                                  <span className="font-medium">{flavor.name}</span>
                                  <Badge className={getFlavorTypeColor(flavor.type)}>
                                    {flavor.type}
                                  </Badge>
                                </div>
                                <p className="text-sm text-gray-600">{flavor.description}</p>
                              </div>
                              {isSelected && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleFlavorToggle(flavor)
                                  }}
                                >
                                  <Minus className="h-4 w-4" />
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
          </CardContent>
        </Card>
      )}

      {/* Opções Extras */}
      <Card>
        <CardHeader>
          <CardTitle>Opções Extras</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="stuffedCrust"
              checked={stuffedCrust}
              onChange={(e) => setStuffedCrust(e.target.checked)}
              className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
            />
            <Label htmlFor="stuffedCrust" className="text-sm font-medium">
              Borda Recheada (+ R$ 4,99)
            </Label>
          </div>

          <div>
            <Label htmlFor="observations" className="text-sm font-medium">
              Observações
            </Label>
            <Textarea
              id="observations"
              placeholder="Alguma observação especial para sua pizza?"
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              className="mt-1"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Resumo e Adicionar ao Carrinho */}
      {selectedSize && selectedFlavors.length > 0 && (
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Sua Pizza Personalizada</h3>
                <p className="text-sm text-gray-600">
                  {selectedSize.name} - {selectedFlavors.map(f => f.name).join(', ')}
                  {stuffedCrust && ' + Borda Recheada'}
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-red-600">
                  R$ {calculatePrice().toFixed(2).replace('.', ',')}
                </div>
                <Button
                  onClick={handleAddToCart}
                  className="mt-2 bg-red-500 hover:bg-red-600"
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Adicionar ao Carrinho
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
