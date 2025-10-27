'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ProtectedRoute } from '@/components/protected-route'
import { ImageUpload } from '@/components/image-upload'
import { UserRole } from '@/lib/constants'
import { Plus, Edit, Trash2, ArrowLeft, ChefHat, Settings } from 'lucide-react'
import ComboCustomizationModal from '@/components/combo-customization-modal'
import toast from 'react-hot-toast'

interface Combo {
  id: string
  name: string
  description: string
  price: number
  image?: string
  isActive: boolean
  isPizza: boolean
  category: {
    id: string
    name: string
  }
}

interface Category {
  id: string
  name: string
  description?: string
  order?: number
}

export default function AdminCombos() {
  const [combos, setCombos] = useState<Combo[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingCombo, setEditingCombo] = useState<Combo | null>(null)
  const [showCategoryForm, setShowCategoryForm] = useState(false)
  const [showCustomizationModal, setShowCustomizationModal] = useState(false)
  const [selectedCombo, setSelectedCombo] = useState<Combo | null>(null)
  const router = useRouter()

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    categoryId: '',
    image: '',
    isActive: true,
    isPizza: false
  })
  const [selectedImage, setSelectedImage] = useState<File | null>(null)

  const [categoryFormData, setCategoryFormData] = useState({
    name: '',
    description: '',
    image: '',
    isActive: true,
    order: 0
  })
  const [selectedCategoryImage, setSelectedCategoryImage] = useState<File | null>(null)

  useEffect(() => {
    fetchCombos()
    fetchCategories()
  }, [])

  const fetchCombos = async () => {
    try {
      const response = await fetch('/api/combos')
      const data = await response.json()
      setCombos(data)
    } catch (error) {
      toast.error('Erro ao carregar combos')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories')
      const data = await response.json()
      setCategories(data)
    } catch (error) {
      toast.error('Erro ao carregar categorias')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const url = editingCombo ? `/api/combos/${editingCombo.id}` : '/api/combos'
      const method = editingCombo ? 'PUT' : 'POST'

      // Preservar imagem existente ou usar nova se selecionada
      let imageData = formData.image // Manter imagem existente por padrão
      if (selectedImage && selectedImage.size > 0) {
        // Só sobrescrever se houver uma nova imagem válida
        imageData = await new Promise<string>((resolve) => {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result as string)
          reader.readAsDataURL(selectedImage)
        })
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price),
          image: imageData
        }),
      })

      if (response.ok) {
        toast.success(editingCombo ? 'Combo atualizado!' : 'Combo criado!')
        setShowForm(false)
        setEditingCombo(null)
        resetForm()
        fetchCombos()
      } else {
        const error = await response.json()
        toast.error(error.message || 'Erro ao salvar combo')
      }
    } catch (error) {
      toast.error('Erro ao salvar combo')
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = (combo: Combo) => {
    setEditingCombo(combo)
    setFormData({
      name: combo.name,
      description: combo.description,
      price: combo.price.toString(),
      categoryId: combo.category.id,
      image: combo.image || '', // Preservar imagem existente
      isActive: combo.isActive,
      isPizza: combo.isPizza
    })
    setSelectedImage(null) // Limpar nova seleção para preservar imagem existente
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este combo?')) return

    try {
      const response = await fetch(`/api/combos/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Combo excluído!')
        fetchCombos()
      } else {
        toast.error('Erro ao excluir combo')
      }
    } catch (error) {
      toast.error('Erro ao excluir combo')
    }
  }

  const handleCustomize = (combo: Combo) => {
    setSelectedCombo(combo)
    setShowCustomizationModal(true)
  }

  const handleAddToCart = (customizedCombo: any) => {
    // Aqui você pode implementar a lógica para adicionar ao carrinho
    console.log('Combo personalizado adicionado:', customizedCombo)
    toast.success('Combo personalizado adicionado ao carrinho!')
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      categoryId: '',
      image: '',
      isActive: true,
      isPizza: false
    })
    setSelectedImage(null)
    setEditingCombo(null) // Limpar referência de edição
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingCombo(null)
    resetForm()
  }

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Se há uma imagem selecionada, converter para base64
      let imageData = categoryFormData.image
      if (selectedCategoryImage) {
        imageData = await new Promise<string>((resolve) => {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result as string)
          reader.readAsDataURL(selectedCategoryImage)
        })
      }

      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...categoryFormData,
          image: imageData
        }),
      })

      if (response.ok) {
        toast.success('Categoria criada com sucesso!')
        setShowCategoryForm(false)
        resetCategoryForm()
        fetchCategories() // Recarregar categorias
      } else {
        const error = await response.json()
        toast.error(error.message || 'Erro ao criar categoria')
      }
    } catch (error) {
      toast.error('Erro ao criar categoria')
    } finally {
      setIsLoading(false)
    }
  }

  const resetCategoryForm = () => {
    setCategoryFormData({
      name: '',
      description: '',
      image: '',
      isActive: true,
      order: 0
    })
    setSelectedCategoryImage(null)
  }

  const handleCancelCategory = () => {
    setShowCategoryForm(false)
    resetCategoryForm()
  }

  return (
    <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER]}>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div className="flex items-center">
                <Button
                  variant="outline"
                  onClick={() => router.push('/dashboard')}
                  className="mr-4"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar
                </Button>
                <h1 className="text-2xl font-bold text-gray-900">
                  Gestão de Combos
                </h1>
              </div>
              
              <div className="flex space-x-3">
                <Button
                  onClick={() => setShowCategoryForm(true)}
                  variant="outline"
                  className="border-blue-500 text-blue-600 hover:bg-blue-50"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Categoria
                </Button>
                <Button onClick={() => setShowForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Combo
                </Button>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            {showForm ? (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>
                    {editingCombo ? 'Editar Combo' : 'Novo Combo'}
                  </CardTitle>
                  <CardDescription>
                    {editingCombo ? 'Atualize as informações do combo' : 'Adicione um novo combo ao cardápio'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name">Nome do Combo</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          required
                          placeholder="Ex: Pizza Margherita + Refrigerante"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="price">Preço (R$)</Label>
                        <Input
                          id="price"
                          type="number"
                          step="0.01"
                          value={formData.price}
                          onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                          required
                          placeholder="29.90"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="description">Descrição</Label>
                      <textarea
                        id="description"
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        rows={3}
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        required
                        placeholder="Descreva os itens incluídos no combo..."
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="categoryId">Categoria</Label>
                        <select
                          id="categoryId"
                          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                          value={formData.categoryId}
                          onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                          required
                        >
                          <option value="">Selecione uma categoria</option>
                          {categories.map((category) => (
                            <option key={category.id} value={category.id}>
                              {category.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div className="md:col-span-2">
                        <Label>Imagem do Combo</Label>
                        <ImageUpload
                          currentImage={formData.image}
                          onImageSelect={(file) => {
                            if (file.size === 0) {
                              // Remover imagem
                              setFormData({ ...formData, image: '' })
                              setSelectedImage(null)
                            } else {
                              // Nova imagem selecionada
                              setSelectedImage(file)
                              // Criar preview imediato
                              const reader = new FileReader()
                              reader.onload = (e) => {
                                const url = e.target?.result as string
                                setFormData({ ...formData, image: url })
                              }
                              reader.readAsDataURL(file)
                            }
                          }}
                          className="mt-2"
                        />
                      </div>
                    </div>

                    <div className="flex items-center space-x-6">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="isActive"
                          checked={formData.isActive}
                          onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                          className="rounded border-gray-300"
                        />
                        <Label htmlFor="isActive">Combo ativo</Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="isPizza"
                          checked={formData.isPizza}
                          onChange={(e) => setFormData({ ...formData, isPizza: e.target.checked })}
                          className="rounded border-gray-300"
                        />
                        <Label htmlFor="isPizza">É uma pizza (permite personalização)</Label>
                      </div>
                    </div>

                    <div className="flex justify-end space-x-2">
                      <Button type="button" variant="outline" onClick={handleCancel}>
                        Cancelar
                      </Button>
                      <Button type="submit" disabled={isLoading}>
                        {isLoading ? 'Salvando...' : editingCombo ? 'Atualizar' : 'Criar'}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            ) : null}

            {showCategoryForm ? (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Nova Categoria</CardTitle>
                  <CardDescription>
                    Crie uma nova categoria para organizar seus produtos
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCategorySubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="categoryName">Nome da Categoria</Label>
                        <Input
                          id="categoryName"
                          value={categoryFormData.name}
                          onChange={(e) => setCategoryFormData({ ...categoryFormData, name: e.target.value })}
                          required
                          placeholder="Ex: Lanches, Sobremesas, Açaí"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="categoryOrder">Ordem de Exibição</Label>
                        <Input
                          id="categoryOrder"
                          type="number"
                          value={categoryFormData.order}
                          onChange={(e) => setCategoryFormData({ ...categoryFormData, order: parseInt(e.target.value) || 0 })}
                          placeholder="0"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Número menor = aparece primeiro (1 = primeiro, 2 = segundo, etc.)
                        </p>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="categoryDescription">Descrição</Label>
                      <textarea
                        id="categoryDescription"
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        rows={3}
                        value={categoryFormData.description}
                        onChange={(e) => setCategoryFormData({ ...categoryFormData, description: e.target.value })}
                        placeholder="Descreva a categoria..."
                      />
                    </div>

                    <div>
                      <Label>Imagem da Categoria</Label>
                      <ImageUpload
                        onImageSelect={setSelectedCategoryImage}
                        currentImage={categoryFormData.image}
                        className="mt-2"
                      />
                    </div>

                    <div className="flex items-center space-x-6">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="categoryIsActive"
                          checked={categoryFormData.isActive}
                          onChange={(e) => setCategoryFormData({ ...categoryFormData, isActive: e.target.checked })}
                          className="rounded border-gray-300"
                        />
                        <Label htmlFor="categoryIsActive">Categoria ativa</Label>
                      </div>
                    </div>

                    <div className="flex justify-end space-x-2">
                      <Button type="button" variant="outline" onClick={handleCancelCategory}>
                        Cancelar
                      </Button>
                      <Button type="submit" disabled={isLoading}>
                        {isLoading ? 'Criando...' : 'Criar Categoria'}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            ) : null}

            {/* Agrupar combos por categoria */}
            {categories
              .sort((a, b) => (a.order || 0) - (b.order || 0))
              .map((category) => {
              const categoryCombos = combos.filter(combo => combo.category.id === category.id)
              
              if (categoryCombos.length === 0) return null
              
              return (
                <div key={category.id} className="mb-8">
                  <div className="flex items-center mb-4">
                    <h2 className="text-xl font-semibold text-gray-900">{category.name}</h2>
                    <span className="ml-2 px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                      {categoryCombos.length} {categoryCombos.length === 1 ? 'item' : 'itens'}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {categoryCombos.map((combo) => (
                      <Card key={combo.id} className="overflow-hidden">
                        {combo.image && (
                          <div className="aspect-video bg-gray-200">
                            <img
                              src={combo.image}
                              alt={combo.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <CardHeader>
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle className="text-lg">{combo.name}</CardTitle>
                              <CardDescription>{combo.category.name}</CardDescription>
                            </div>
                            <div className="flex space-x-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEdit(combo)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDelete(combo.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-gray-600 mb-2">{combo.description}</p>
                          <div className="flex justify-between items-center">
                            <span className="text-lg font-bold text-primary">
                              R$ {combo.price.toFixed(2)}
                            </span>
                            <div className="flex flex-col space-y-2">
                              <div className="flex space-x-2">
                                {combo.isPizza && (
                                  <span className="px-2 py-1 text-xs rounded-full bg-orange-100 text-orange-800">
                                    🍕 Pizza
                                  </span>
                                )}
                                <span className={`px-2 py-1 text-xs rounded-full ${
                                  combo.isActive 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {combo.isActive ? 'Ativo' : 'Inativo'}
                                </span>
                              </div>
                              {combo.isPizza && combo.isActive && (
                                <div className="space-y-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleCustomize(combo)}
                                    className="w-full text-xs"
                                  >
                                    <ChefHat className="h-3 w-3 mr-1" />
                                    Personalizar
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => router.push(`/admin/combos/customization?combo=${combo.id}`)}
                                    className="w-full text-xs"
                                  >
                                    <Settings className="h-3 w-3 mr-1" />
                                    Configurar
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )
            })}

            {combos.length === 0 && !isLoading && (
              <div className="text-center py-12">
                <p className="text-gray-500">Nenhum combo cadastrado ainda.</p>
                <Button onClick={() => setShowForm(true)} className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeiro Combo
                </Button>
              </div>
            )}
          </div>
        </main>

        {/* Modal de Personalização */}
        {selectedCombo && (
          <ComboCustomizationModal
            combo={{
              id: selectedCombo.id,
              name: selectedCombo.name,
              description: selectedCombo.description,
              basePrice: selectedCombo.price,
              requiredItems: [
                {
                  id: 'pizza1',
                  name: 'Escolha o sabor tradicional da 1° pizza grande',
                  type: 'PIZZA',
                  required: true,
                  options: []
                },
                {
                  id: 'pizza2',
                  name: 'Escolha o sabor tradicional da 2° pizza grande',
                  type: 'PIZZA',
                  required: true,
                  options: []
                },
                {
                  id: 'pizza3',
                  name: 'ESCOLHA O SABOR DA PEQUENA',
                  type: 'PIZZA',
                  required: true,
                  options: []
                }
              ],
              optionalItems: [
                {
                  id: 'refri',
                  name: 'ADD 1 REFRI 1L GRÁTIS',
                  type: 'DRINK',
                  price: 0,
                  options: []
                }
              ]
            }}
            isOpen={showCustomizationModal}
            onClose={() => {
              setShowCustomizationModal(false)
              setSelectedCombo(null)
            }}
            onAddToCart={handleAddToCart}
          />
        )}
      </div>
    </ProtectedRoute>
  )
}

