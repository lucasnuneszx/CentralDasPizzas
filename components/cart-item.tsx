'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Minus, X, Edit3 } from 'lucide-react'
import Image from 'next/image'
import { CustomizedItem, PizzaFlavor, PizzaSize } from '@/types/cart'

interface CartItemProps {
  item: CustomizedItem
  onUpdateQuantity: (id: string, quantity: number) => void
  onRemove: (id: string) => void
  onEdit: (item: CustomizedItem) => void
}

export default function CartItem({ item, onUpdateQuantity, onRemove, onEdit }: CartItemProps) {
  const [isEditing, setIsEditing] = useState(false)

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

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity <= 0) {
      onRemove(item.id)
    } else {
      onUpdateQuantity(item.id, newQuantity)
    }
  }

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start space-x-4">
          {/* Imagem do item */}
          {item.combo.image && (
            <div className="w-16 h-16 relative rounded-lg overflow-hidden flex-shrink-0 bg-gray-50">
              <Image
                src={item.combo.image}
                alt={item.combo.name}
                fill
                className="object-contain sm:object-cover"
                sizes="64px"
              />
            </div>
          )}

          {/* Informações do item */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">{item.combo.name}</h3>
                <p className="text-sm text-gray-600 mt-1">{item.combo.description}</p>

                {/* Personalizações da Pizza */}
                {item.combo.isPizza && item.size && (
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-700">Tamanho:</span>
                      <Badge variant="outline">{item.size.name}</Badge>
                    </div>

                    {item.flavors && item.flavors.length > 0 && (
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-700">Sabores:</span>
                        <div className="flex flex-wrap gap-1">
                          {item.flavors.map((flavor) => (
                            <Badge
                              key={flavor.id}
                              className={`text-xs ${getFlavorTypeColor(flavor.type)}`}
                            >
                              {flavor.name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {item.stuffedCrust && (
                      <div className="flex items-center space-x-2">
                        <Badge className="bg-orange-100 text-orange-800">
                          Borda Recheada
                        </Badge>
                      </div>
                    )}
                  </div>
                )}

                {/* Observações */}
                {item.observations && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Obs:</span> {item.observations}
                    </p>
                  </div>
                )}
              </div>

              {/* Preço */}
              <div className="text-right">
                <div className="text-lg font-bold text-red-600">
                  R$ {item.totalPrice.toFixed(2).replace('.', ',')}
                </div>
                <div className="text-sm text-gray-500">
                  R$ {(item.totalPrice / item.quantity).toFixed(2).replace('.', ',')} cada
                </div>
              </div>
            </div>

            {/* Controles de quantidade e ações */}
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuantityChange(item.quantity - 1)}
                  className="h-8 w-8 p-0"
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-8 text-center font-medium">{item.quantity}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuantityChange(item.quantity + 1)}
                  className="h-8 w-8 p-0"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(item)}
                  className="text-blue-600 hover:text-blue-700"
                >
                  <Edit3 className="h-4 w-4 mr-1" />
                  Editar
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemove(item.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <X className="h-4 w-4 mr-1" />
                  Remover
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
