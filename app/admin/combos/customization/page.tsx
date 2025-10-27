'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { ProtectedRoute } from '@/components/protected-route'
import { UserRole } from '@/lib/constants'
import { ImageUpload } from '@/components/image-upload'
import { 
  ArrowLeft, 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X,
  ChefHat,
  Package,
  Droplets,
  Cookie,
  Utensils,
  GripVertical,
  Upload,
  Image as ImageIcon
} from 'lucide-react'
import toast from 'react-hot-toast'

interface Combo {
  id: string
  name: string
  description: string
  price: number
  image?: string
  isActive: boolean
  allowCustomization: boolean
  category: {
    id: string
    name: string
  }
}

interface CustomizationItem {
  id: string
  name: string
  description?: string
  type: string
  isRequired: boolean
  isMultiple: boolean
  maxSelections?: number
  minSelections: number
  order: number
  image?: string
  isActive: boolean
  options: CustomizationOption[]
}

interface CustomizationOption {
  id: string
  name: string
  description?: string
  price: number
  image?: string
  isActive: boolean
  order: number
}

export default function ComboCustomizationManagement() {
  const [combos, setCombos] = useState<Combo[]>([])
  const [selectedCombo, setSelectedCombo] = useState<Combo | null>(null)
  const [customizationItems, setCustomizationItems] = useState<CustomizationItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showItemForm, setShowItemForm] = useState(false)
  const [showOptionForm, setShowOptionForm] = useState(false)
  const [editingItem, setEditingItem] = useState<CustomizationItem | null>(null)
  const [editingOption, setEditingOption] = useState<CustomizationOption | null>(null)
  const [selectedItem, setSelectedItem] = useState<CustomizationItem | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()

  const [itemFormData, setItemFormData] = useState({
    name: '',
    description: '',
    type: 'PIZZA',
    isRequired: false,
    isMultiple: false,
    maxSelections: 1,
    minSelections: 1,
    order: 0,
    image: ''
  })

  const [optionFormData, setOptionFormData] = useState({
    name: '',
    description: '',
    price: 0,
    image: '',
    order: 0
  })

  useEffect(() => {
    fetchCombos()
  }, [])

  useEffect(() => {
    const comboId = searchParams.get('combo')
    if (comboId && combos.length > 0) {
      const combo = combos.find(c => c.id === comboId)
      if (combo) {
        setSelectedCombo(combo)
      }
    }
  }, [searchParams, combos])

  const fetchCombos = async () => {
    try {
      const response = await fetch('/api/combos')
      const data = await response.json()
      setCombos(data.filter((combo: Combo) => combo.isActive))
    } catch (error) {
      toast.error('Erro ao carregar combos')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchCustomizationItems = useCallback(async () => {
    if (!selectedCombo) return
    
    try {
      const response = await fetch(`/api/combos/${selectedCombo.id}/customization`)
      const data = await response.json()
      setCustomizationItems(data)
    } catch (error) {
      toast.error('Erro ao carregar itens de personalização')
    }
  }, [selectedCombo])

  useEffect(() => {
    if (selectedCombo) {
      fetchCustomizationItems()
    }
  }, [selectedCombo, fetchCustomizationItems])

  const handleAddItem = async () => {
    if (!selectedCombo || !itemFormData.name.trim()) {
      toast.error('Nome do item é obrigatório')
      return
    }

    try {
      const response = await fetch(`/api/combos/${selectedCombo.id}/customization`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(itemFormData),
      })

      if (response.ok) {
        toast.success('Item adicionado com sucesso!')
        setItemFormData({
          name: '',
          description: '',
          type: 'PIZZA',
          isRequired: false,
          isMultiple: false,
          maxSelections: 1,
          minSelections: 1,
          order: 0,
          image: ''
        })
        setShowItemForm(false)
        fetchCustomizationItems()
      } else {
        toast.error('Erro ao adicionar item')
      }
    } catch (error) {
      toast.error('Erro ao adicionar item')
    }
  }

  const handleEditItem = async () => {
    if (!editingItem || !itemFormData.name.trim()) {
      toast.error('Nome do item é obrigatório')
      return
    }

    try {
      const response = await fetch(`/api/combos/${selectedCombo?.id}/customization/${editingItem.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(itemFormData),
      })

      if (response.ok) {
        toast.success('Item atualizado com sucesso!')
        setEditingItem(null)
        setItemFormData({
          name: '',
          description: '',
          type: 'PIZZA',
          isRequired: false,
          isMultiple: false,
          maxSelections: 1,
          minSelections: 1,
          order: 0,
          image: ''
        })
        setShowItemForm(false)
        fetchCustomizationItems()
      } else {
        toast.error('Erro ao atualizar item')
      }
    } catch (error) {
      toast.error('Erro ao atualizar item')
    }
  }

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('Tem certeza que deseja excluir este item?')) {
      return
    }

    try {
      const response = await fetch(`/api/combos/${selectedCombo?.id}/customization/${itemId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Item excluído com sucesso!')
        fetchCustomizationItems()
      } else {
        toast.error('Erro ao excluir item')
      }
    } catch (error) {
      toast.error('Erro ao excluir item')
    }
  }

  const handleAddOption = async () => {
    if (!selectedItem || !optionFormData.name.trim()) {
      toast.error('Nome da opção é obrigatório')
      return
    }

    try {
      const response = await fetch(`/api/combos/${selectedCombo?.id}/customization/${selectedItem.id}/options`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(optionFormData),
      })

      if (response.ok) {
        toast.success('Opção adicionada com sucesso!')
        setOptionFormData({
          name: '',
          description: '',
          price: 0,
          image: '',
          order: 0
        })
        setShowOptionForm(false)
        fetchCustomizationItems()
      } else {
        toast.error('Erro ao adicionar opção')
      }
    } catch (error) {
      toast.error('Erro ao adicionar opção')
    }
  }

  const handleEditOption = async () => {
    if (!editingOption || !optionFormData.name.trim()) {
      toast.error('Nome da opção é obrigatório')
      return
    }

    try {
      const response = await fetch(`/api/combos/${selectedCombo?.id}/customization/${selectedItem?.id}/options/${editingOption.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(optionFormData),
      })

      if (response.ok) {
        toast.success('Opção atualizada com sucesso!')
        setEditingOption(null)
        setOptionFormData({
          name: '',
          description: '',
          price: 0,
          image: '',
          order: 0
        })
        setShowOptionForm(false)
        fetchCustomizationItems()
      } else {
        toast.error('Erro ao atualizar opção')
      }
    } catch (error) {
      toast.error('Erro ao atualizar opção')
    }
  }

  const handleDeleteOption = async (optionId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta opção?')) {
      return
    }

    try {
      const response = await fetch(`/api/combos/${selectedCombo?.id}/customization/${selectedItem?.id}/options/${optionId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Opção excluída com sucesso!')
        fetchCustomizationItems()
      } else {
        toast.error('Erro ao excluir opção')
      }
    } catch (error) {
      toast.error('Erro ao excluir opção')
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'PIZZA':
        return <ChefHat className="h-4 w-4 text-orange-500" />
      case 'DRINK':
        return <Droplets className="h-4 w-4 text-blue-500" />
      case 'SIDE':
        return <Utensils className="h-4 w-4 text-green-500" />
      case 'DESSERT':
        return <Cookie className="h-4 w-4 text-purple-500" />
      default:
        return <Package className="h-4 w-4 text-gray-500" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'PIZZA':
        return 'bg-orange-100 text-orange-800'
      case 'DRINK':
        return 'bg-blue-100 text-blue-800'
      case 'SIDE':
        return 'bg-green-100 text-green-800'
      case 'DESSERT':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'PIZZA':
        return 'Pizza'
      case 'DRINK':
        return 'Bebida'
      case 'SIDE':
        return 'Acompanhamento'
      case 'DESSERT':
        return 'Sobremesa'
      default:
        return type
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  return (
    <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.MANAGER]}>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div className="flex items-center">
                <Button
                  variant="outline"
                  onClick={() => router.push('/admin/combos')}
                  className="mr-4"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar
                </Button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    Personalização de Combos
                  </h1>
                  <p className="text-sm text-gray-600">
                    Configure itens e opções para personalização
                  </p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            
            {/* Seleção de Combo */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Selecionar Combo</CardTitle>
                <CardDescription>
                  Escolha o combo para configurar a personalização
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-2 text-gray-500">Carregando combos...</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {combos.map((combo) => (
                      <Card 
                        key={combo.id} 
                        className={`cursor-pointer transition-all ${
                          selectedCombo?.id === combo.id 
                            ? 'ring-2 ring-primary bg-primary/5' 
                            : 'hover:shadow-md'
                        }`}
                        onClick={() => setSelectedCombo(combo)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center space-x-3">
                            {combo.image && (
                              <img
                                src={combo.image}
                                alt={combo.name}
                                className="w-12 h-12 object-cover rounded"
                              />
                            )}
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-900">{combo.name}</h3>
                              <p className="text-sm text-gray-600">{combo.category.name}</p>
                              <p className="text-sm font-medium text-primary">
                                {formatCurrency(combo.price)}
                              </p>
                            </div>
                            {combo.allowCustomization && (
                              <Badge className="bg-green-100 text-green-800">
                                Personalizável
                              </Badge>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Configuração de Personalização */}
            {selectedCombo && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Personalização: {selectedCombo.name}</CardTitle>
                        <CardDescription>
                          Configure os itens que aparecerão na personalização
                        </CardDescription>
                      </div>
                      <Button onClick={() => setShowItemForm(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Adicionar Item
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {customizationItems.map((item) => (
                        <Card key={item.id} className="border-l-4 border-l-primary">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex items-start space-x-4">
                                {item.image && (
                                  <img
                                    src={item.image}
                                    alt={item.name}
                                    className="w-16 h-16 object-cover rounded"
                                  />
                                )}
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2 mb-2">
                                    {getTypeIcon(item.type)}
                                    <h3 className="font-semibold text-gray-900">{item.name}</h3>
                                    <Badge className={`${getTypeColor(item.type)} flex items-center space-x-1`}>
                                      {getTypeIcon(item.type)}
                                      <span>{getTypeLabel(item.type)}</span>
                                    </Badge>
                                    {item.isRequired && (
                                      <Badge className="bg-red-100 text-red-800">
                                        Obrigatório
                                      </Badge>
                                    )}
                                    {item.isMultiple && (
                                      <Badge className="bg-blue-100 text-blue-800">
                                        Múltipla escolha
                                      </Badge>
                                    )}
                                  </div>
                                  
                                  {item.description && (
                                    <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                                  )}
                                  
                                  <div className="text-sm text-gray-500 mb-3">
                                    <span>Mínimo: {item.minSelections}</span>
                                    {item.maxSelections && (
                                      <span className="ml-4">Máximo: {item.maxSelections}</span>
                                    )}
                                  </div>

                                  {/* Opções */}
                                  <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                      <h4 className="text-sm font-medium text-gray-700">Opções:</h4>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => {
                                          setSelectedItem(item)
                                          setShowOptionForm(true)
                                        }}
                                      >
                                        <Plus className="h-3 w-3 mr-1" />
                                        Adicionar Opção
                                      </Button>
                                    </div>
                                    
                                    {item.options.length > 0 ? (
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                        {item.options.map((option) => (
                                          <div key={option.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                            <div className="flex items-center space-x-2">
                                              {option.image && (
                                                <img
                                                  src={option.image}
                                                  alt={option.name}
                                                  className="w-8 h-8 object-cover rounded"
                                                />
                                              )}
                                              <div>
                                                <p className="text-sm font-medium">{option.name}</p>
                                                {option.description && (
                                                  <p className="text-xs text-gray-500">{option.description}</p>
                                                )}
                                              </div>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                              <span className="text-sm font-medium text-primary">
                                                {formatCurrency(option.price)}
                                              </span>
                                              <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => {
                                                  setSelectedItem(item)
                                                  setEditingOption(option)
                                                  setOptionFormData({
                                                    name: option.name,
                                                    description: option.description || '',
                                                    price: option.price,
                                                    image: option.image || '',
                                                    order: option.order
                                                  })
                                                  setShowOptionForm(true)
                                                }}
                                              >
                                                <Edit className="h-3 w-3" />
                                              </Button>
                                              <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => handleDeleteOption(option.id)}
                                                className="text-red-600 hover:text-red-700"
                                              >
                                                <Trash2 className="h-3 w-3" />
                                              </Button>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <p className="text-sm text-gray-500">Nenhuma opção cadastrada</p>
                                    )}
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex space-x-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setEditingItem(item)
                                    setItemFormData({
                                      name: item.name,
                                      description: item.description || '',
                                      type: item.type,
                                      isRequired: item.isRequired,
                                      isMultiple: item.isMultiple,
                                      maxSelections: item.maxSelections || 1,
                                      minSelections: item.minSelections,
                                      order: item.order,
                                      image: item.image || ''
                                    })
                                    setShowItemForm(true)
                                  }}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDeleteItem(item.id)}
                                  className="text-red-600 border-red-300 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                      
                      {customizationItems.length === 0 && (
                        <div className="text-center py-8">
                          <ChefHat className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-500">Nenhum item de personalização cadastrado</p>
                          <p className="text-sm text-gray-400 mt-1">
                            Adicione itens para permitir personalização deste combo
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Formulário de Item */}
            {showItemForm && (
              <Card className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <Card className="w-full max-w-2xl max-h-[90vh] overflow-hidden">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>
                        {editingItem ? 'Editar Item' : 'Adicionar Item'}
                      </CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setShowItemForm(false)
                          setEditingItem(null)
                          setItemFormData({
                            name: '',
                            description: '',
                            type: 'PIZZA',
                            isRequired: false,
                            isMultiple: false,
                            maxSelections: 1,
                            minSelections: 1,
                            order: 0,
                            image: ''
                          })
                        }}
                      >
                        <X className="h-5 w-5" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="overflow-y-auto max-h-[calc(90vh-200px)]">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Nome do Item *
                        </label>
                        <Input
                          value={itemFormData.name}
                          onChange={(e) => setItemFormData({ ...itemFormData, name: e.target.value })}
                          placeholder="Ex: Escolha o sabor da pizza"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Descrição
                        </label>
                        <Textarea
                          value={itemFormData.description}
                          onChange={(e) => setItemFormData({ ...itemFormData, description: e.target.value })}
                          placeholder="Ex: Selecione mínimo 1 opções"
                          rows={2}
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Tipo *
                          </label>
                          <select
                            value={itemFormData.type}
                            onChange={(e) => setItemFormData({ ...itemFormData, type: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                          >
                            <option value="PIZZA">Pizza</option>
                            <option value="DRINK">Bebida</option>
                            <option value="SIDE">Acompanhamento</option>
                            <option value="DESSERT">Sobremesa</option>
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Ordem de Exibição
                          </label>
                          <Input
                            type="number"
                            value={itemFormData.order}
                            onChange={(e) => setItemFormData({ ...itemFormData, order: parseInt(e.target.value) || 0 })}
                            placeholder="0"
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Seleções Mínimas
                          </label>
                          <Input
                            type="number"
                            min="1"
                            value={itemFormData.minSelections}
                            onChange={(e) => setItemFormData({ ...itemFormData, minSelections: parseInt(e.target.value) || 1 })}
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Seleções Máximas
                          </label>
                          <Input
                            type="number"
                            min="1"
                            value={itemFormData.maxSelections}
                            onChange={(e) => setItemFormData({ ...itemFormData, maxSelections: parseInt(e.target.value) || 1 })}
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={itemFormData.isRequired}
                            onChange={(e) => setItemFormData({ ...itemFormData, isRequired: e.target.checked })}
                            className="rounded border-gray-300 text-primary focus:ring-primary"
                          />
                          <span className="text-sm font-medium text-gray-700">Item obrigatório</span>
                        </label>
                        
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={itemFormData.isMultiple}
                            onChange={(e) => setItemFormData({ ...itemFormData, isMultiple: e.target.checked })}
                            className="rounded border-gray-300 text-primary focus:ring-primary"
                          />
                          <span className="text-sm font-medium text-gray-700">Permitir múltiplas escolhas</span>
                        </label>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Foto do Item
                        </label>
                        <ImageUpload
                          currentImage={itemFormData.image}
                          onImageSelect={(file) => {
                            // Handle file upload and update the image URL
                            if (file.size === 0) {
                              setItemFormData({ ...itemFormData, image: '' })
                            } else {
                              // Create a preview URL for immediate display
                              const reader = new FileReader()
                              reader.onload = (e) => {
                                const url = e.target?.result as string
                                setItemFormData({ ...itemFormData, image: url })
                              }
                              reader.readAsDataURL(file)
                            }
                          }}
                        />
                      </div>
                      
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setShowItemForm(false)
                            setEditingItem(null)
                            setItemFormData({
                              name: '',
                              description: '',
                              type: 'PIZZA',
                              isRequired: false,
                              isMultiple: false,
                              maxSelections: 1,
                              minSelections: 1,
                              order: 0,
                              image: ''
                            })
                          }}
                        >
                          Cancelar
                        </Button>
                        <Button onClick={editingItem ? handleEditItem : handleAddItem}>
                          <Save className="h-4 w-4 mr-2" />
                          {editingItem ? 'Salvar' : 'Adicionar'}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Card>
            )}

            {/* Formulário de Opção */}
            {showOptionForm && (
              <Card className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <Card className="w-full max-w-md">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>
                        {editingOption ? 'Editar Opção' : 'Adicionar Opção'}
                      </CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setShowOptionForm(false)
                          setEditingOption(null)
                          setSelectedItem(null)
                          setOptionFormData({
                            name: '',
                            description: '',
                            price: 0,
                            image: '',
                            order: 0
                          })
                        }}
                      >
                        <X className="h-5 w-5" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Nome da Opção *
                        </label>
                        <Input
                          value={optionFormData.name}
                          onChange={(e) => setOptionFormData({ ...optionFormData, name: e.target.value })}
                          placeholder="Ex: Calabresa"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Descrição
                        </label>
                        <Textarea
                          value={optionFormData.description}
                          onChange={(e) => setOptionFormData({ ...optionFormData, description: e.target.value })}
                          placeholder="Ex: Molho de tomate, mussarela e calabresa"
                          rows={2}
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Preço Adicional
                          </label>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={optionFormData.price}
                            onChange={(e) => setOptionFormData({ ...optionFormData, price: parseFloat(e.target.value) || 0 })}
                            placeholder="0.00"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Ordem
                          </label>
                          <Input
                            type="number"
                            value={optionFormData.order}
                            onChange={(e) => setOptionFormData({ ...optionFormData, order: parseInt(e.target.value) || 0 })}
                            placeholder="0"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Foto da Opção
                        </label>
                        <ImageUpload
                          currentImage={optionFormData.image}
                          onImageSelect={(file) => {
                            // Handle file upload and update the image URL
                            if (file.size === 0) {
                              setOptionFormData({ ...optionFormData, image: '' })
                            } else {
                              // Create a preview URL for immediate display
                              const reader = new FileReader()
                              reader.onload = (e) => {
                                const url = e.target?.result as string
                                setOptionFormData({ ...optionFormData, image: url })
                              }
                              reader.readAsDataURL(file)
                            }
                          }}
                        />
                      </div>
                      
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setShowOptionForm(false)
                            setEditingOption(null)
                            setSelectedItem(null)
                            setOptionFormData({
                              name: '',
                              description: '',
                              price: 0,
                              image: '',
                              order: 0
                            })
                          }}
                        >
                          Cancelar
                        </Button>
                        <Button onClick={editingOption ? handleEditOption : handleAddOption}>
                          <Save className="h-4 w-4 mr-2" />
                          {editingOption ? 'Salvar' : 'Adicionar'}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Card>
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
