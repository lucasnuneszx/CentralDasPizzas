'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Minus } from 'lucide-react'
import { PizzaSize } from '@/types/cart'

interface PizzaSizeSelectorProps {
  combo: {
    id: string
    name: string
    description: string
    image?: string
    isPizza: boolean
  }
  onAddToCart: (item: {
    id: string
    combo: any
    quantity: number
    observations: string
    selectedSize: PizzaSize
    totalPrice: number
  }) => void
  onClose: () => void
}

export default function PizzaSizeSelector({ combo, onAddToCart, onClose }: PizzaSizeSelectorProps) {
  const [sizes, setSizes] = useState<PizzaSize[]>([])
  const [selectedSize, setSelectedSize] = useState<PizzaSize | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [observations, setObservations] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSizes()
  }, [combo.id])

  const fetchSizes = async () => {
    try {
      const response = await fetch(`/api/pizza-sizes?comboId=${combo.id}`)
      if (response.ok) {
        const sizesData = await response.json()
        setSizes(sizesData)
        
        // Selecionar o primeiro tamanho por padrão
        if (sizesData.length > 0) {
          setSelectedSize(sizesData[0])
        }
      }
    } catch (error) {
      console.error('Erro ao carregar tamanhos:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddToCart = () => {
    if (!selectedSize) return

    const totalPrice = selectedSize.basePrice * quantity

    onAddToCart({
      id: `${combo.id}-${Date.now()}`,
      combo,
      quantity,
      observations,
      selectedSize,
      totalPrice
    })
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-red-500 border-t-transparent mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando tamanhos...</p>
          </div>
        </div>
      </div>
    )
  }

  if (sizes.length === 0) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2">Tamanhos não disponíveis</h3>
            <p className="text-gray-600 mb-4">Este combo não possui tamanhos configurados.</p>
            <Button onClick={onClose} className="w-full">
              Fechar
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">{combo.name}</h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            ✕
          </Button>
        </div>

        {/* Imagem do combo */}
        {combo.image && (
          <div className="mb-4">
            <img
              src={combo.image}
              alt={combo.name}
              className="w-full h-32 object-cover rounded-lg"
            />
          </div>
        )}

        {/* Descrição */}
        <p className="text-sm text-gray-600 mb-4">{combo.description}</p>

        {/* Seleção de Tamanho */}
        <div className="mb-6">
          <Label className="text-base font-medium mb-3 block text-gray-900">Escolha o tamanho</Label>
          <div className="space-y-3">
            {sizes.map((size) => (
              <Button
                key={size.id}
                variant={selectedSize?.id === size.id ? "default" : "outline"}
                className={`w-full h-auto p-4 flex items-center justify-between ${
                  selectedSize?.id === size.id 
                    ? "bg-red-500 text-white hover:bg-red-600" 
                    : "border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
                onClick={() => setSelectedSize(size)}
              >
                <div className="text-left">
                  <div className="font-semibold">{size.name}</div>
                  <div className="text-sm opacity-80">{size.slices} fatias</div>
                </div>
                <div className="font-bold text-lg">
                  R$ {size.basePrice.toFixed(2).replace('.', ',')}
                </div>
              </Button>
            ))}
          </div>
        </div>

        {/* Quantidade */}
        <div className="mb-4">
          <Label className="text-sm font-medium mb-2 block text-gray-700">Quantidade</Label>
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              <Minus className="h-4 w-4" />
            </Button>
            <span className="text-lg font-semibold min-w-[2rem] text-center">{quantity}</span>
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

        {/* Observações */}
        <div className="mb-6">
          <Label className="text-sm font-medium mb-2 block text-gray-700">
            Observações (opcional)
          </Label>
          <Textarea
            value={observations}
            onChange={(e) => setObservations(e.target.value)}
            placeholder="Ex: Sem cebola, bem assada..."
            className="min-h-[80px] resize-none"
          />
        </div>

        {/* Botão Adicionar */}
        <Button
          onClick={handleAddToCart}
          disabled={!selectedSize}
          className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-3"
        >
          ADICIONAR ({quantity}) - R$ {selectedSize ? (selectedSize.basePrice * quantity).toFixed(2).replace('.', ',') : '0,00'}
        </Button>
      </div>
    </div>
  )
}
