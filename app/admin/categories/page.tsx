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
import { Plus, Edit, Trash2, ArrowLeft, Filter } from 'lucide-react'
import toast from 'react-hot-toast'

interface Category {
  id: string
  name: string
  description?: string
  image?: string
  isActive: boolean
  order: number
  combos: {
    id: string
    name: string
  }[]
}

export default function AdminCategories() {
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const router = useRouter()

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image: '',
    isActive: true,
    order: 0
  })
  const [selectedImage, setSelectedImage] = useState<File | null>(null)

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories')
      const data = await response.json()
      setCategories(data)
    } catch (error) {
      toast.error('Erro ao carregar categorias')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const url = editingCategory ? `/api/categories/${editingCategory.id}` : '/api/categories'
      const method = editingCategory ? 'PUT' : 'POST'

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
          image: imageData
        }),
      })

      if (response.ok) {
        toast.success(editingCategory ? 'Categoria atualizada!' : 'Categoria criada!')
        setShowForm(false)
        setEditingCategory(null)
        resetForm()
        fetchCategories()
      } else {
        const error = await response.json()
        toast.error(error.message || 'Erro ao salvar categoria')
      }
    } catch (error) {
      toast.error('Erro ao salvar categoria')
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = (category: Category) => {
    setEditingCategory(category)
    setFormData({
      name: category.name,
      description: category.description || '',
      image: category.image || '', // Preservar imagem existente
      isActive: category.isActive,
      order: category.order
    })
    setSelectedImage(null) // Limpar nova seleção para preservar imagem existente
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta categoria? Todos os combos desta categoria serão movidos para "Combos".')) return

    try {
      const response = await fetch(`/api/categories/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Categoria excluída!')
        fetchCategories()
      } else {
        toast.error('Erro ao excluir categoria')
      }
    } catch (error) {
      toast.error('Erro ao excluir categoria')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      image: '',
      isActive: true,
      order: 0
    })
    setSelectedImage(null)
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingCategory(null)
    resetForm()
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando categorias...</p>
        </div>
      </div>
    )
  }

  return (
    <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.MANAGER]}>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  onClick={() => router.back()}
                  className="text-gray-600 hover:text-gray-900"
                >
                  <ArrowLeft className="h-5 w-5 mr-2" />
                  Voltar
                </Button>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Categorias</h1>
                  <p className="text-gray-600">Gerencie as categorias do cardápio</p>
                </div>
              </div>
              <div className="flex space-x-3">
                <Button
                  onClick={() => setShowForm(true)}
                  className="bg-red-500 hover:bg-red-600 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Categoria
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
                    {editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
                  </CardTitle>
                  <CardDescription>
                    {editingCategory ? 'Atualize as informações da categoria' : 'Adicione uma nova categoria ao cardápio'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name">Nome da Categoria</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          required
                          placeholder="Ex: Lanches, Sobremesas, etc."
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="order">Ordem de Exibição</Label>
                        <Input
                          id="order"
                          type="number"
                          value={formData.order}
                          onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                          placeholder="0"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Número menor = aparece primeiro (1 = primeiro, 2 = segundo, etc.)
                        </p>
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
                        placeholder="Descreva a categoria..."
                      />
                    </div>

                    <div>
                      <Label>Imagem da Categoria</Label>
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

                    <div className="flex items-center space-x-6">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="isActive"
                          checked={formData.isActive}
                          onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                          className="rounded border-gray-300"
                        />
                        <Label htmlFor="isActive">Categoria ativa</Label>
                      </div>
                    </div>

                    <div className="flex justify-end space-x-2">
                      <Button type="button" variant="outline" onClick={handleCancel}>
                        Cancelar
                      </Button>
                      <Button type="submit" disabled={isLoading}>
                        {isLoading ? 'Salvando...' : editingCategory ? 'Atualizar' : 'Criar'}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            ) : null}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categories.map((category) => (
                <Card key={category.id} className="overflow-hidden">
                  {category.image && (
                    <div className="aspect-video bg-gray-200">
                      <img
                        src={category.image}
                        alt={category.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{category.name}</CardTitle>
                        <CardDescription>{category.description}</CardDescription>
                        <div className="flex items-center space-x-2 mt-2">
                          <span className="text-xs text-gray-500">
                            Ordem: {category.order}
                          </span>
                          <span className="text-xs text-gray-500">
                            • {category.combos.length} produtos
                          </span>
                        </div>
                      </div>
                      <div className="flex space-x-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(category)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(category.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        category.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {category.isActive ? 'Ativa' : 'Inativa'}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
