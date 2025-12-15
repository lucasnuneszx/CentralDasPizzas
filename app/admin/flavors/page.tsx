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
  Pizza,
  Star,
  Crown
} from 'lucide-react'
import toast from 'react-hot-toast'

interface PizzaFlavor {
  id: string
  name: string
  description: string
  type: string
  isActive: boolean
}

export default function FlavorsManagement() {
  const [flavors, setFlavors] = useState<PizzaFlavor[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState<string | null>(null)
  const [editingFlavor, setEditingFlavor] = useState<Partial<PizzaFlavor>>({})
  const [showAddForm, setShowAddForm] = useState(false)
  const [newFlavor, setNewFlavor] = useState({
    name: '',
    description: '',
    type: 'TRADICIONAL'
  })
  const router = useRouter()

  useEffect(() => {
    fetchFlavors()
  }, [])

  const fetchFlavors = async () => {
    try {
      const response = await fetch('/api/flavors')
      const data = await response.json()
      setFlavors(data)
    } catch (error) {
      toast.error('Erro ao carregar sabores')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddFlavor = async () => {
    if (!newFlavor.name.trim()) {
      toast.error('Nome do sabor é obrigatório')
      return
    }

    try {
      const response = await fetch('/api/flavors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newFlavor),
      })

      if (response.ok) {
        toast.success('Sabor adicionado com sucesso!')
        setNewFlavor({ name: '', description: '', type: 'TRADICIONAL' })
        setShowAddForm(false)
        fetchFlavors()
      } else {
        toast.error('Erro ao adicionar sabor')
      }
    } catch (error) {
      toast.error('Erro ao adicionar sabor')
    }
  }

  const handleEditFlavor = async (id: string) => {
    if (!editingFlavor.name?.trim()) {
      toast.error('Nome do sabor é obrigatório')
      return
    }

    try {
      const response = await fetch(`/api/flavors/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editingFlavor),
      })

      if (response.ok) {
        toast.success('Sabor atualizado com sucesso!')
        setIsEditing(null)
        setEditingFlavor({})
        fetchFlavors()
      } else {
        toast.error('Erro ao atualizar sabor')
      }
    } catch (error) {
      toast.error('Erro ao atualizar sabor')
    }
  }

  const handleDeleteFlavor = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este sabor?')) {
      return
    }

    try {
      const response = await fetch(`/api/flavors/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Sabor excluído com sucesso!')
        fetchFlavors()
      } else {
        toast.error('Erro ao excluir sabor')
      }
    } catch (error) {
      toast.error('Erro ao excluir sabor')
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'TRADICIONAL':
        return <Pizza className="h-4 w-4 text-green-500" />
      case 'PREMIUM':
        return <Star className="h-4 w-4 text-yellow-500" />
      case 'ESPECIAL':
        return <Crown className="h-4 w-4 text-purple-500" />
      default:
        return <Pizza className="h-4 w-4 text-gray-500" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'TRADICIONAL':
        return 'bg-green-100 text-green-800'
      case 'PREMIUM':
        return 'bg-yellow-100 text-yellow-800'
      case 'ESPECIAL':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'TRADICIONAL':
        return 'Tradicional'
      case 'PREMIUM':
        return 'Premium'
      case 'ESPECIAL':
        return 'Especial'
      default:
        return type
    }
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
                    Gestão de Sabores
                  </h1>
                  <p className="text-sm text-gray-600">
                    Adicione e gerencie sabores de pizza
                  </p>
                </div>
              </div>
              
              <Button onClick={() => setShowAddForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Sabor
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
                  <CardTitle>Adicionar Novo Sabor</CardTitle>
                  <CardDescription>
                    Preencha as informações do sabor
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nome do Sabor *
                      </label>
                      <Input
                        value={newFlavor.name}
                        onChange={(e) => setNewFlavor({ ...newFlavor, name: e.target.value })}
                        placeholder="Ex: Margherita"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Descrição
                      </label>
                      <Textarea
                        value={newFlavor.description}
                        onChange={(e) => setNewFlavor({ ...newFlavor, description: e.target.value })}
                        placeholder="Ex: Molho de tomate, mussarela e manjericão"
                        rows={3}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tipo
                      </label>
                      <select
                        value={newFlavor.type}
                        onChange={(e) => setNewFlavor({ ...newFlavor, type: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="TRADICIONAL">Tradicional</option>
                        <option value="PREMIUM">Premium</option>
                        <option value="ESPECIAL">Especial</option>
                      </select>
                    </div>
                    
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowAddForm(false)
                          setNewFlavor({ name: '', description: '', type: 'TRADICIONAL' })
                        }}
                      >
                        Cancelar
                      </Button>
                      <Button onClick={handleAddFlavor}>
                        <Save className="h-4 w-4 mr-2" />
                        Salvar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Lista de Sabores Separados por Tipo */}
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-gray-500">Carregando sabores...</p>
              </div>
            ) : flavors.length > 0 ? (
              <div className="space-y-8">
                {/* Sabores Tradicionais */}
                {flavors.filter(f => f.type === 'TRADICIONAL').length > 0 && (
                  <div>
                    <div className="flex items-center space-x-3 mb-4">
                      <Pizza className="h-6 w-6 text-green-500" />
                      <h2 className="text-xl font-bold text-gray-900">Sabores Tradicionais</h2>
                      <Badge className="bg-green-100 text-green-800">
                        {flavors.filter(f => f.type === 'TRADICIONAL').length} sabor{flavors.filter(f => f.type === 'TRADICIONAL').length !== 1 ? 'es' : ''}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {flavors.filter(f => f.type === 'TRADICIONAL').map((flavor) => (
                        <Card key={flavor.id} className="overflow-hidden border-l-4 border-l-green-500">
                          <CardContent className="p-6">
                            {isEditing === flavor.id ? (
                              <div className="space-y-4">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Nome *
                                  </label>
                                  <Input
                                    value={editingFlavor.name || ''}
                                    onChange={(e) => setEditingFlavor({ ...editingFlavor, name: e.target.value })}
                                  />
                                </div>
                                
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Descrição
                                  </label>
                                  <Textarea
                                    value={editingFlavor.description || ''}
                                    onChange={(e) => setEditingFlavor({ ...editingFlavor, description: e.target.value })}
                                    rows={2}
                                  />
                                </div>
                                
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Tipo
                                  </label>
                                  <select
                                    value={editingFlavor.type || flavor.type}
                                    onChange={(e) => setEditingFlavor({ ...editingFlavor, type: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                                  >
                                    <option value="TRADICIONAL">Tradicional</option>
                                    <option value="ESPECIAL">Especial</option>
                                    <option value="PREMIUM">Premium</option>
                                  </select>
                                </div>
                                
                                <div className="flex justify-end space-x-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setIsEditing(null)
                                      setEditingFlavor({})
                                    }}
                                  >
                                    <X className="h-4 w-4 mr-1" />
                                    Cancelar
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={() => handleEditFlavor(flavor.id)}
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
                                    {getTypeIcon(flavor.type)}
                                    <h3 className="font-semibold text-lg">{flavor.name}</h3>
                                  </div>
                                  <Badge className={`${getTypeColor(flavor.type)} flex items-center space-x-1`}>
                                    {getTypeIcon(flavor.type)}
                                    <span>{getTypeLabel(flavor.type)}</span>
                                  </Badge>
                                </div>
                                
                                {flavor.description && (
                                  <p className="text-gray-600 text-sm mb-4">
                                    {flavor.description}
                                  </p>
                                )}
                                
                                <div className="flex justify-end space-x-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setIsEditing(flavor.id)
                                      setEditingFlavor(flavor)
                                    }}
                                  >
                                    <Edit className="h-4 w-4 mr-1" />
                                    Editar
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDeleteFlavor(flavor.id)}
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
                  </div>
                )}

                {/* Sabores Especiais */}
                {flavors.filter(f => f.type === 'ESPECIAL').length > 0 && (
                  <div>
                    <div className="flex items-center space-x-3 mb-4">
                      <Crown className="h-6 w-6 text-purple-500" />
                      <h2 className="text-xl font-bold text-gray-900">Sabores Especiais</h2>
                      <Badge className="bg-purple-100 text-purple-800">
                        {flavors.filter(f => f.type === 'ESPECIAL').length} sabor{flavors.filter(f => f.type === 'ESPECIAL').length !== 1 ? 'es' : ''}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {flavors.filter(f => f.type === 'ESPECIAL').map((flavor) => (
                        <Card key={flavor.id} className="overflow-hidden border-l-4 border-l-purple-500">
                          <CardContent className="p-6">
                            {isEditing === flavor.id ? (
                              <div className="space-y-4">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Nome *
                                  </label>
                                  <Input
                                    value={editingFlavor.name || ''}
                                    onChange={(e) => setEditingFlavor({ ...editingFlavor, name: e.target.value })}
                                  />
                                </div>
                                
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Descrição
                                  </label>
                                  <Textarea
                                    value={editingFlavor.description || ''}
                                    onChange={(e) => setEditingFlavor({ ...editingFlavor, description: e.target.value })}
                                    rows={2}
                                  />
                                </div>
                                
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Tipo
                                  </label>
                                  <select
                                    value={editingFlavor.type || flavor.type}
                                    onChange={(e) => setEditingFlavor({ ...editingFlavor, type: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                                  >
                                    <option value="TRADICIONAL">Tradicional</option>
                                    <option value="ESPECIAL">Especial</option>
                                    <option value="PREMIUM">Premium</option>
                                  </select>
                                </div>
                                
                                <div className="flex justify-end space-x-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setIsEditing(null)
                                      setEditingFlavor({})
                                    }}
                                  >
                                    <X className="h-4 w-4 mr-1" />
                                    Cancelar
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={() => handleEditFlavor(flavor.id)}
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
                                    {getTypeIcon(flavor.type)}
                                    <h3 className="font-semibold text-lg">{flavor.name}</h3>
                                  </div>
                                  <Badge className={`${getTypeColor(flavor.type)} flex items-center space-x-1`}>
                                    {getTypeIcon(flavor.type)}
                                    <span>{getTypeLabel(flavor.type)}</span>
                                  </Badge>
                                </div>
                                
                                {flavor.description && (
                                  <p className="text-gray-600 text-sm mb-4">
                                    {flavor.description}
                                  </p>
                                )}
                                
                                <div className="flex justify-end space-x-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setIsEditing(flavor.id)
                                      setEditingFlavor(flavor)
                                    }}
                                  >
                                    <Edit className="h-4 w-4 mr-1" />
                                    Editar
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDeleteFlavor(flavor.id)}
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
                  </div>
                )}

                {/* Sabores Premiums */}
                {flavors.filter(f => f.type === 'PREMIUM').length > 0 && (
                  <div>
                    <div className="flex items-center space-x-3 mb-4">
                      <Star className="h-6 w-6 text-yellow-500" />
                      <h2 className="text-xl font-bold text-gray-900">Sabores Premiums</h2>
                      <Badge className="bg-yellow-100 text-yellow-800">
                        {flavors.filter(f => f.type === 'PREMIUM').length} sabor{flavors.filter(f => f.type === 'PREMIUM').length !== 1 ? 'es' : ''}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {flavors.filter(f => f.type === 'PREMIUM').map((flavor) => (
                        <Card key={flavor.id} className="overflow-hidden border-l-4 border-l-yellow-500">
                          <CardContent className="p-6">
                            {isEditing === flavor.id ? (
                              <div className="space-y-4">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Nome *
                                  </label>
                                  <Input
                                    value={editingFlavor.name || ''}
                                    onChange={(e) => setEditingFlavor({ ...editingFlavor, name: e.target.value })}
                                  />
                                </div>
                                
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Descrição
                                  </label>
                                  <Textarea
                                    value={editingFlavor.description || ''}
                                    onChange={(e) => setEditingFlavor({ ...editingFlavor, description: e.target.value })}
                                    rows={2}
                                  />
                                </div>
                                
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Tipo
                                  </label>
                                  <select
                                    value={editingFlavor.type || flavor.type}
                                    onChange={(e) => setEditingFlavor({ ...editingFlavor, type: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                                  >
                                    <option value="TRADICIONAL">Tradicional</option>
                                    <option value="ESPECIAL">Especial</option>
                                    <option value="PREMIUM">Premium</option>
                                  </select>
                                </div>
                                
                                <div className="flex justify-end space-x-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setIsEditing(null)
                                      setEditingFlavor({})
                                    }}
                                  >
                                    <X className="h-4 w-4 mr-1" />
                                    Cancelar
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={() => handleEditFlavor(flavor.id)}
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
                                    {getTypeIcon(flavor.type)}
                                    <h3 className="font-semibold text-lg">{flavor.name}</h3>
                                  </div>
                                  <Badge className={`${getTypeColor(flavor.type)} flex items-center space-x-1`}>
                                    {getTypeIcon(flavor.type)}
                                    <span>{getTypeLabel(flavor.type)}</span>
                                  </Badge>
                                </div>
                                
                                {flavor.description && (
                                  <p className="text-gray-600 text-sm mb-4">
                                    {flavor.description}
                                  </p>
                                )}
                                
                                <div className="flex justify-end space-x-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setIsEditing(flavor.id)
                                      setEditingFlavor(flavor)
                                    }}
                                  >
                                    <Edit className="h-4 w-4 mr-1" />
                                    Editar
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDeleteFlavor(flavor.id)}
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
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <Pizza className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Nenhum sabor cadastrado</p>
                <p className="text-sm text-gray-400 mt-1">
                  Adicione sabores para personalizar as pizzas
                </p>
              </div>
            )}
                  <Card key={flavor.id} className="overflow-hidden">
                    <CardContent className="p-6">
                      {isEditing === flavor.id ? (
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Nome *
                            </label>
                            <Input
                              value={editingFlavor.name || ''}
                              onChange={(e) => setEditingFlavor({ ...editingFlavor, name: e.target.value })}
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Descrição
                            </label>
                            <Textarea
                              value={editingFlavor.description || ''}
                              onChange={(e) => setEditingFlavor({ ...editingFlavor, description: e.target.value })}
                              rows={2}
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Tipo
                            </label>
                            <select
                              value={editingFlavor.type || flavor.type}
                              onChange={(e) => setEditingFlavor({ ...editingFlavor, type: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                            >
                              <option value="TRADICIONAL">Tradicional</option>
                              <option value="PREMIUM">Premium</option>
                              <option value="ESPECIAL">Especial</option>
                            </select>
                          </div>
                          
                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setIsEditing(null)
                                setEditingFlavor({})
                              }}
                            >
                              <X className="h-4 w-4 mr-1" />
                              Cancelar
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleEditFlavor(flavor.id)}
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
                              {getTypeIcon(flavor.type)}
                              <h3 className="font-semibold text-lg">{flavor.name}</h3>
                            </div>
                            <Badge className={`${getTypeColor(flavor.type)} flex items-center space-x-1`}>
                              {getTypeIcon(flavor.type)}
                              <span>{getTypeLabel(flavor.type)}</span>
                            </Badge>
                          </div>
                          
                          {flavor.description && (
                            <p className="text-gray-600 text-sm mb-4">
                              {flavor.description}
                            </p>
                          )}
                          
                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setIsEditing(flavor.id)
                                setEditingFlavor(flavor)
                              }}
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Editar
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteFlavor(flavor.id)}
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
                <Pizza className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Nenhum sabor cadastrado</p>
                <p className="text-sm text-gray-400 mt-1">
                  Adicione sabores para personalizar as pizzas
                </p>
              </div>
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
