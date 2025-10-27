'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { ProtectedRoute } from '@/components/protected-route'
import { UserRole } from '@/lib/constants'
import { 
  ArrowLeft, 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X,
  Coffee,
  Droplets,
  Cookie,
  Utensils
} from 'lucide-react'
import toast from 'react-hot-toast'

interface ExtraItem {
  id: string
  name: string
  description?: string
  price: number
  category: string
  size?: string
  isActive: boolean
}

export default function ExtrasManagement() {
  const [extras, setExtras] = useState<ExtraItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState<string | null>(null)
  const [editingExtra, setEditingExtra] = useState<Partial<ExtraItem>>({})
  const [showAddForm, setShowAddForm] = useState(false)
  const [newExtra, setNewExtra] = useState({
    name: '',
    description: '',
    price: 0,
    category: 'DRINK',
    size: ''
  })
  const router = useRouter()

  useEffect(() => {
    fetchExtras()
  }, [])

  const fetchExtras = async () => {
    try {
      const response = await fetch('/api/extras')
      const data = await response.json()
      setExtras(data)
    } catch (error) {
      toast.error('Erro ao carregar extras')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddExtra = async () => {
    if (!newExtra.name.trim()) {
      toast.error('Nome do item é obrigatório')
      return
    }

    if (newExtra.price <= 0) {
      toast.error('Preço deve ser maior que zero')
      return
    }

    try {
      const response = await fetch('/api/extras', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newExtra),
      })

      if (response.ok) {
        toast.success('Item adicionado com sucesso!')
        setNewExtra({ name: '', description: '', price: 0, category: 'DRINK', size: '' })
        setShowAddForm(false)
        fetchExtras()
      } else {
        toast.error('Erro ao adicionar item')
      }
    } catch (error) {
      toast.error('Erro ao adicionar item')
    }
  }

  const handleEditExtra = async (id: string) => {
    if (!editingExtra.name?.trim()) {
      toast.error('Nome do item é obrigatório')
      return
    }

    if (!editingExtra.price || editingExtra.price <= 0) {
      toast.error('Preço deve ser maior que zero')
      return
    }

    try {
      const response = await fetch(`/api/extras/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editingExtra),
      })

      if (response.ok) {
        toast.success('Item atualizado com sucesso!')
        setIsEditing(null)
        setEditingExtra({})
        fetchExtras()
      } else {
        toast.error('Erro ao atualizar item')
      }
    } catch (error) {
      toast.error('Erro ao atualizar item')
    }
  }

  const handleDeleteExtra = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este item?')) {
      return
    }

    try {
      const response = await fetch(`/api/extras/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Item excluído com sucesso!')
        fetchExtras()
      } else {
        toast.error('Erro ao excluir item')
      }
    } catch (error) {
      toast.error('Erro ao excluir item')
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'DRINK':
        return <Droplets className="h-4 w-4 text-blue-500" />
      case 'SIDE':
        return <Utensils className="h-4 w-4 text-orange-500" />
      case 'DESSERT':
        return <Cookie className="h-4 w-4 text-purple-500" />
      case 'SAUCE':
        return <Coffee className="h-4 w-4 text-red-500" />
      default:
        return <Coffee className="h-4 w-4 text-gray-500" />
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'DRINK':
        return 'bg-blue-100 text-blue-800'
      case 'SIDE':
        return 'bg-orange-100 text-orange-800'
      case 'DESSERT':
        return 'bg-purple-100 text-purple-800'
      case 'SAUCE':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'DRINK':
        return 'Bebida'
      case 'SIDE':
        return 'Acompanhamento'
      case 'DESSERT':
        return 'Sobremesa'
      case 'SAUCE':
        return 'Molho'
      default:
        return category
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
                    Gestão de Extras
                  </h1>
                  <p className="text-sm text-gray-600">
                    Adicione bebidas, acompanhamentos e sobremesas
                  </p>
                </div>
              </div>
              
              <Button onClick={() => setShowAddForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Item
              </Button>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            
            {/* Formulário de Adicionar */}
            {showAddForm && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Adicionar Novo Item</CardTitle>
                  <CardDescription>
                    Preencha as informações do item extra
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Nome do Item *
                        </label>
                        <Input
                          value={newExtra.name}
                          onChange={(e) => setNewExtra({ ...newExtra, name: e.target.value })}
                          placeholder="Ex: Refrigerante Coca-Cola"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Preço *
                        </label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={newExtra.price}
                          onChange={(e) => setNewExtra({ ...newExtra, price: parseFloat(e.target.value) || 0 })}
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Descrição
                      </label>
                      <Textarea
                        value={newExtra.description}
                        onChange={(e) => setNewExtra({ ...newExtra, description: e.target.value })}
                        placeholder="Ex: Refrigerante gelado de 1L"
                        rows={2}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Categoria *
                        </label>
                        <select
                          value={newExtra.category}
                          onChange={(e) => setNewExtra({ ...newExtra, category: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                          <option value="DRINK">Bebida</option>
                          <option value="SIDE">Acompanhamento</option>
                          <option value="DESSERT">Sobremesa</option>
                          <option value="SAUCE">Molho</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Tamanho/Volume
                        </label>
                        <Input
                          value={newExtra.size}
                          onChange={(e) => setNewExtra({ ...newExtra, size: e.target.value })}
                          placeholder="Ex: 1L, 300ML, Grande"
                        />
                      </div>
                    </div>
                    
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowAddForm(false)
                          setNewExtra({ name: '', description: '', price: 0, category: 'DRINK', size: '' })
                        }}
                      >
                        Cancelar
                      </Button>
                      <Button onClick={handleAddExtra}>
                        <Save className="h-4 w-4 mr-2" />
                        Salvar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Lista de Extras */}
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-gray-500">Carregando itens...</p>
              </div>
            ) : extras.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {extras.map((extra) => (
                  <Card key={extra.id} className="overflow-hidden">
                    <CardContent className="p-6">
                      {isEditing === extra.id ? (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Nome *
                              </label>
                              <Input
                                value={editingExtra.name || ''}
                                onChange={(e) => setEditingExtra({ ...editingExtra, name: e.target.value })}
                              />
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Preço *
                              </label>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={editingExtra.price || 0}
                                onChange={(e) => setEditingExtra({ ...editingExtra, price: parseFloat(e.target.value) || 0 })}
                              />
                            </div>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Descrição
                            </label>
                            <Textarea
                              value={editingExtra.description || ''}
                              onChange={(e) => setEditingExtra({ ...editingExtra, description: e.target.value })}
                              rows={2}
                            />
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Categoria *
                              </label>
                              <select
                                value={editingExtra.category || extra.category}
                                onChange={(e) => setEditingExtra({ ...editingExtra, category: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                              >
                                <option value="DRINK">Bebida</option>
                                <option value="SIDE">Acompanhamento</option>
                                <option value="DESSERT">Sobremesa</option>
                                <option value="SAUCE">Molho</option>
                              </select>
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Tamanho/Volume
                              </label>
                              <Input
                                value={editingExtra.size || extra.size || ''}
                                onChange={(e) => setEditingExtra({ ...editingExtra, size: e.target.value })}
                              />
                            </div>
                          </div>
                          
                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setIsEditing(null)
                                setEditingExtra({})
                              }}
                            >
                              <X className="h-4 w-4 mr-1" />
                              Cancelar
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleEditExtra(extra.id)}
                            >
                              <Save className="h-4 w-4 mr-1" />
                              Salvar
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center space-x-2">
                              {getCategoryIcon(extra.category)}
                              <h3 className="font-semibold text-lg">{extra.name}</h3>
                            </div>
                            <Badge className={`${getCategoryColor(extra.category)} flex items-center space-x-1`}>
                              {getCategoryIcon(extra.category)}
                              <span>{getCategoryLabel(extra.category)}</span>
                            </Badge>
                          </div>
                          
                          {extra.size && (
                            <p className="text-sm text-gray-500 mb-2">
                              Tamanho: {extra.size}
                            </p>
                          )}
                          
                          {extra.description && (
                            <p className="text-gray-600 text-sm mb-3">
                              {extra.description}
                            </p>
                          )}
                          
                          <div className="flex items-center justify-between mb-4">
                            <span className="text-lg font-bold text-primary">
                              {formatCurrency(extra.price)}
                            </span>
                          </div>
                          
                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setIsEditing(extra.id)
                                setEditingExtra(extra)
                              }}
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Editar
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteExtra(extra.id)}
                              className="text-red-600 border-red-300 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Excluir
                            </Button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Coffee className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Nenhum item extra cadastrado</p>
                <p className="text-sm text-gray-400 mt-1">
                  Adicione bebidas, acompanhamentos e sobremesas
                </p>
              </div>
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
