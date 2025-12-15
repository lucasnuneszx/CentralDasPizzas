'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ProtectedRoute } from '@/components/protected-route'
import { ImageUpload } from '@/components/image-upload'
import { UserRole } from '@/lib/constants'
import { Plus, Edit, Trash2, ArrowLeft, ChefHat, Settings, Scan, Trash, Loader2, ArrowUp, ArrowDown } from 'lucide-react'
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
  order?: number
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
    isPizza: false,
    isBurger: false,
    burgerArtisanalPrice: '',
    burgerIndustrialPrice: '',
    pizzaQuantity: 1,
    showFlavors: true, // Controla se sabores aparecem na personalização
    order: 0, // Ordem de exibição
    pizzaSizes: [] as Array<{ name: string; slices: number; maxFlavors: number; basePrice: string }>
  })
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [extraItems, setExtraItems] = useState<Array<{
    id?: string
    name: string
    description: string
    type: string
    price: number
    options: Array<{ id?: string; name: string; price: number }>
  }>>([])
  const [showExtraItemForm, setShowExtraItemForm] = useState(false)
  const [editingExtraItem, setEditingExtraItem] = useState<number | null>(null)
  const [extraItemForm, setExtraItemForm] = useState({
    name: '',
    description: '',
    type: 'DRINK',
    price: 0,
    options: [] as Array<{ name: string; price: number }>
  })

  const [categoryFormData, setCategoryFormData] = useState({
    name: '',
    description: '',
    image: '',
    isActive: true,
    order: 0
  })
  const [selectedCategoryImage, setSelectedCategoryImage] = useState<File | null>(null)
  const [showOcrModal, setShowOcrModal] = useState(false)
  const [ocrImage, setOcrImage] = useState<File | null>(null)
  const [ocrProcessing, setOcrProcessing] = useState(false)
  const [ocrResults, setOcrResults] = useState<Array<{
    name: string
    description?: string
    price?: number
    confidence: number
  }>>([])
  const [deletingAll, setDeletingAll] = useState(false)

  useEffect(() => {
    fetchCombos()
    fetchCategories()
  }, [])

  const fetchCombos = async () => {
    try {
      const response = await fetch('/api/combos')
      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`)
      }
      const data = await response.json()
      // Garantir que data é um array
      if (Array.isArray(data)) {
        setCombos(data)
      } else {
        console.error('Resposta da API não é um array:', data)
        setCombos([])
        toast.error('Erro: resposta inválida da API')
      }
    } catch (error) {
      console.error('Erro ao carregar combos:', error)
      setCombos([])
      toast.error('Erro ao carregar combos')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories')
      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`)
      }
      const data = await response.json()
      // Garantir que data é um array
      if (Array.isArray(data)) {
        setCategories(data)
      } else {
        console.error('Resposta da API não é um array:', data)
        setCategories([])
        toast.error('Erro: resposta inválida da API de categorias')
      }
    } catch (error) {
      console.error('Erro ao carregar categorias:', error)
      setCategories([])
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
          burgerArtisanalPrice: formData.burgerArtisanalPrice ? parseFloat(formData.burgerArtisanalPrice) : null,
          burgerIndustrialPrice: formData.burgerIndustrialPrice ? parseFloat(formData.burgerIndustrialPrice) : null,
          image: imageData
        }),
      })

      if (response.ok) {
        const savedCombo = await response.json()
        
        // Se for uma pizza, criar/atualizar os tamanhos
        if (formData.isPizza && formData.pizzaSizes.length > 0) {
          try {
            // A API já remove tamanhos existentes antes de criar novos
            await fetch(`/api/pizza-sizes`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                comboId: savedCombo.id,
                sizes: formData.pizzaSizes
                  .filter(size => size.basePrice && parseFloat(size.basePrice) > 0)
                  .map(size => ({
                    name: size.name,
                    slices: size.slices,
                    maxFlavors: size.maxFlavors,
                    basePrice: parseFloat(size.basePrice)
                  }))
              }),
            })
          } catch (error) {
            console.error('Erro ao salvar tamanhos:', error)
            toast.error('Combo salvo, mas houve erro ao salvar tamanhos')
          }
        }
        
        // Salvar itens extras
        if (extraItems.length > 0) {
          try {
            // Primeiro, remover itens extras existentes que não estão mais na lista
            const existingResponse = await fetch(`/api/combos/${savedCombo.id}/customization`)
            if (existingResponse.ok) {
              const existingItems = await existingResponse.json()
              const existingExtras = existingItems.filter((item: any) => !item.isRequired && item.type !== 'PIZZA')
              
              // Deletar itens que não estão mais na lista
              for (const existing of existingExtras) {
                if (!extraItems.find(e => e.id === existing.id)) {
                  await fetch(`/api/combos/${savedCombo.id}/customization/${existing.id}`, {
                    method: 'DELETE'
                  })
                }
              }
            }
            
            // Criar ou atualizar itens extras
            for (const extraItem of extraItems) {
              if (extraItem.id) {
                // Atualizar item existente
                await fetch(`/api/combos/${savedCombo.id}/customization/${extraItem.id}`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    name: extraItem.name,
                    description: extraItem.description,
                    type: extraItem.type,
                    isRequired: false,
                    isMultiple: false,
                    maxSelections: 1,
                    minSelections: 0,
                    order: 0
                  })
                })
                
                // Atualizar opções
                if (extraItem.options.length > 0) {
                  // Buscar opções existentes
                  const itemResponse = await fetch(`/api/combos/${savedCombo.id}/customization/${extraItem.id}`)
                  if (itemResponse.ok) {
                    const itemData = await itemResponse.json()
                    const existingOptions = itemData.options || []
                    
                    // Deletar opções que não estão mais na lista
                    for (const existingOpt of existingOptions) {
                      if (!extraItem.options.find(o => o.id === existingOpt.id)) {
                        await fetch(`/api/combos/${savedCombo.id}/customization/${extraItem.id}/options/${existingOpt.id}`, {
                          method: 'DELETE'
                        })
                      }
                    }
                    
                    // Criar ou atualizar opções
                    for (const option of extraItem.options) {
                      if (option.id) {
                        // Atualizar opção existente
                        await fetch(`/api/combos/${savedCombo.id}/customization/${extraItem.id}/options/${option.id}`, {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            name: option.name,
                            price: option.price
                          })
                        })
                      } else {
                        // Criar nova opção
                        await fetch(`/api/combos/${savedCombo.id}/customization/${extraItem.id}/options`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            name: option.name,
                            price: option.price,
                            order: 0
                          })
                        })
                      }
                    }
                  }
                }
              } else {
                // Criar novo item
                const newItemResponse = await fetch(`/api/combos/${savedCombo.id}/customization`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    name: extraItem.name,
                    description: extraItem.description,
                    type: extraItem.type,
                    isRequired: false,
                    isMultiple: false,
                    maxSelections: 1,
                    minSelections: 0,
                    order: 0
                  })
                })
                
                if (newItemResponse.ok) {
                  const newItem = await newItemResponse.json()
                  
                  // Criar opções se houver
                  for (const option of extraItem.options) {
                    await fetch(`/api/combos/${savedCombo.id}/customization/${newItem.id}/options`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        name: option.name,
                        price: option.price,
                        order: 0
                      })
                    })
                  }
                }
              }
            }
          } catch (error) {
            console.error('Erro ao salvar itens extras:', error)
            toast.error('Combo salvo, mas houve erro ao salvar itens extras')
          }
        }
        
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

  const handleEdit = async (combo: Combo) => {
    setEditingCombo(combo)
    
    // Buscar tamanhos da pizza se for uma pizza
    let pizzaSizes: Array<{ name: string; slices: number; maxFlavors: number; basePrice: string }> = []
    
    if (combo.isPizza) {
      try {
        const response = await fetch(`/api/pizza-sizes?comboId=${combo.id}`)
        if (response.ok) {
          const sizes = await response.json()
          pizzaSizes = sizes.map((s: any) => ({
            name: s.name,
            slices: s.slices,
            maxFlavors: s.maxFlavors,
            basePrice: s.basePrice.toString()
          }))
        }
      } catch (error) {
        console.error('Erro ao carregar tamanhos:', error)
      }
    }
    
    // Buscar itens extras do combo
    try {
      const response = await fetch(`/api/combos/${combo.id}/customization`)
      if (response.ok) {
        const customizationItems = await response.json()
        // Filtrar apenas itens extras (não obrigatórios e não são pizzas)
        const extras = customizationItems
          .filter((item: any) => !item.isRequired && item.type !== 'PIZZA')
          .map((item: any) => ({
            id: item.id,
            name: item.name,
            description: item.description || '',
            type: item.type,
            price: 0,
            options: (item.options || []).map((opt: any) => ({
              id: opt.id,
              name: opt.name,
              price: opt.price
            }))
          }))
        setExtraItems(extras)
      }
    } catch (error) {
      console.error('Erro ao carregar itens extras:', error)
    }
    
    setFormData({
      name: combo.name,
      description: combo.description,
      price: combo.price.toString(),
      categoryId: combo.category.id,
      image: combo.image || '', // Preservar imagem existente
      isActive: combo.isActive,
      isPizza: combo.isPizza,
      pizzaQuantity: (combo as any).pizzaQuantity || 1,
      showFlavors: (combo as any).showFlavors !== undefined ? (combo as any).showFlavors : true,
      order: combo.order || 0,
      pizzaSizes
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
      isPizza: false,
      isBurger: false,
      burgerArtisanalPrice: '',
      burgerIndustrialPrice: '',
      pizzaQuantity: 1,
      showFlavors: true,
      order: 0,
      pizzaSizes: []
    })
    setSelectedImage(null)
    setEditingCombo(null) // Limpar referência de edição
    setExtraItems([])
    setShowExtraItemForm(false)
    setEditingExtraItem(null)
    setExtraItemForm({
      name: '',
      description: '',
      type: 'DRINK',
      price: 0,
      options: []
    })
  }

  const addPizzaSize = () => {
    const defaultConfig = getSizeConfig('Média')
    setFormData({
      ...formData,
      pizzaSizes: [...formData.pizzaSizes, { 
        name: 'Média', 
        slices: defaultConfig.slices, 
        maxFlavors: defaultConfig.maxFlavors, 
        basePrice: '' 
      }]
    })
  }

  const updatePizzaSize = (index: number, field: string, value: string | number) => {
    const updatedSizes = [...formData.pizzaSizes]
    updatedSizes[index] = { ...updatedSizes[index], [field]: value }
    setFormData({ ...formData, pizzaSizes: updatedSizes })
  }

  const removePizzaSize = (index: number) => {
    setFormData({
      ...formData,
      pizzaSizes: formData.pizzaSizes.filter((_, i) => i !== index)
    })
  }

  const getSizeConfig = (sizeName: string) => {
    const configs: { [key: string]: { slices: number; maxFlavors: number } } = {
      'Pequena': { slices: 4, maxFlavors: 1 },
      'Média': { slices: 6, maxFlavors: 2 },
      'Grande': { slices: 8, maxFlavors: 3 },
      'Família': { slices: 13, maxFlavors: 4 }
    }
    return configs[sizeName] || { slices: 6, maxFlavors: 2 }
  }

  const addExtraItem = () => {
    setExtraItemForm({
      name: '',
      description: '',
      type: 'DRINK',
      price: 0,
      options: []
    })
    setEditingExtraItem(null)
    setShowExtraItemForm(true)
  }

  const saveExtraItem = () => {
    if (!extraItemForm.name.trim()) {
      toast.error('Nome do item é obrigatório')
      return
    }

    if (editingExtraItem !== null) {
      // Editar item existente
      const updated = [...extraItems]
      updated[editingExtraItem] = {
        ...updated[editingExtraItem],
        name: extraItemForm.name,
        description: extraItemForm.description,
        type: extraItemForm.type,
        price: extraItemForm.price,
        options: extraItemForm.options
      }
      setExtraItems(updated)
    } else {
      // Adicionar novo item
      setExtraItems([...extraItems, {
        name: extraItemForm.name,
        description: extraItemForm.description,
        type: extraItemForm.type,
        price: extraItemForm.price,
        options: extraItemForm.options
      }])
    }

    setShowExtraItemForm(false)
    setEditingExtraItem(null)
    setExtraItemForm({
      name: '',
      description: '',
      type: 'DRINK',
      price: 0,
      options: []
    })
  }

  const editExtraItem = (index: number) => {
    const item = extraItems[index]
    setExtraItemForm({
      name: item.name,
      description: item.description,
      type: item.type,
      price: item.price,
      options: item.options.map(opt => ({ name: opt.name, price: opt.price }))
    })
    setEditingExtraItem(index)
    setShowExtraItemForm(true)
  }

  const deleteExtraItem = (index: number) => {
    if (confirm('Tem certeza que deseja remover este item extra?')) {
      setExtraItems(extraItems.filter((_, i) => i !== index))
    }
  }

  const addExtraItemOption = () => {
    setExtraItemForm({
      ...extraItemForm,
      options: [...extraItemForm.options, { name: '', price: 0 }]
    })
  }

  const updateExtraItemOption = (index: number, field: string, value: string | number) => {
    const updated = [...extraItemForm.options]
    updated[index] = { ...updated[index], [field]: value }
    setExtraItemForm({ ...extraItemForm, options: updated })
  }

  const removeExtraItemOption = (index: number) => {
    setExtraItemForm({
      ...extraItemForm,
      options: extraItemForm.options.filter((_, i) => i !== index)
    })
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

  const handleMoveCombo = async (comboId: string, categoryId: string, direction: 'up' | 'down') => {
    try {
      const categoryCombos = combos
        .filter(c => c.category.id === categoryId)
        .sort((a, b) => (a.order || 0) - (b.order || 0))
      
      const currentIndex = categoryCombos.findIndex(c => c.id === comboId)
      if (currentIndex === -1) return

      const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
      if (newIndex < 0 || newIndex >= categoryCombos.length) return

      // Recalcular todas as ordens sequencialmente para evitar conflitos
      const updates = categoryCombos.map((combo, index) => {
        let newOrder = index
        
        // Se estamos movendo para cima, o item atual vai para o índice anterior
        if (direction === 'up' && index === currentIndex) {
          newOrder = newIndex
        }
        // Se estamos movendo para baixo, o item atual vai para o próximo índice
        else if (direction === 'down' && index === currentIndex) {
          newOrder = newIndex
        }
        // Se estamos movendo para cima, o item anterior avança
        else if (direction === 'up' && index === newIndex) {
          newOrder = currentIndex
        }
        // Se estamos movendo para baixo, o próximo item retrocede
        else if (direction === 'down' && index === newIndex) {
          newOrder = currentIndex
        }
        
        return { id: combo.id, order: newOrder }
      })

      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      }
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const response = await fetch('/api/combos/reorder', {
        method: 'PUT',
        headers,
        body: JSON.stringify({ combos: updates })
      })

      if (response.ok) {
        toast.success('Ordem atualizada!')
        fetchCombos()
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error('Erro ao atualizar ordem:', errorData)
        toast.error(errorData.message || 'Erro ao atualizar ordem')
      }
    } catch (error) {
      console.error('Erro ao mover combo:', error)
      toast.error('Erro ao mover combo')
    }
  }

  const handleDeleteAllCombos = async () => {
    if (!confirm('⚠️ ATENÇÃO: Esta ação irá excluir TODOS os combos do sistema. Esta operação é irreversível!\n\nDeseja continuar?')) {
      return
    }

    if (!confirm('Tem CERTEZA ABSOLUTA? Todos os combos serão perdidos permanentemente!')) {
      return
    }

    setDeletingAll(true)
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      }
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const response = await fetch('/api/combos/delete-all', {
        method: 'DELETE',
        headers
      })

      const data = await response.json()

      if (response.ok && data.success) {
        toast.success(`Todos os combos foram excluídos! (${data.deleted} combos removidos)`)
        fetchCombos()
      } else {
        toast.error(data.message || 'Erro ao excluir combos')
      }
    } catch (error) {
      console.error('Erro ao excluir todos os combos:', error)
      toast.error('Erro ao excluir combos')
    } finally {
      setDeletingAll(false)
    }
  }

  const handleOcrProcess = async () => {
    if (!ocrImage) {
      toast.error('Selecione uma imagem primeiro')
      return
    }

    setOcrProcessing(true)
    try {
      const formData = new FormData()
      formData.append('image', ocrImage)

      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null
      const headers: HeadersInit = {}
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const response = await fetch('/api/ocr/extract-menu', {
        method: 'POST',
        headers,
        body: formData
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setOcrResults(data.menuItems || [])
        toast.success(`Processado! ${data.count} itens encontrados`)
      } else {
        toast.error(data.message || 'Erro ao processar imagem')
      }
    } catch (error: any) {
      console.error('Erro ao processar OCR:', error)
      toast.error('Erro ao processar imagem: ' + (error.message || 'Erro desconhecido'))
    } finally {
      setOcrProcessing(false)
    }
  }

  const handleCreateFromOcr = async (item: typeof ocrResults[0], categoryId: string) => {
    try {
      const response = await fetch('/api/combos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: item.name,
          description: item.description || '',
          price: item.price || 0,
          categoryId: categoryId,
          isActive: true
        })
      })

      if (response.ok) {
        toast.success(`Combo "${item.name}" criado com sucesso!`)
        fetchCombos()
      } else {
        const error = await response.json()
        toast.error(error.message || 'Erro ao criar combo')
      }
    } catch (error) {
      toast.error('Erro ao criar combo')
    }
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
                  onClick={() => setShowOcrModal(true)}
                  variant="outline"
                  className="border-green-500 text-green-600 hover:bg-green-50"
                >
                  <Scan className="h-4 w-4 mr-2" />
                  IA: Ler Cardápio
                </Button>
                <Button
                  onClick={handleDeleteAllCombos}
                  disabled={deletingAll}
                  variant="outline"
                  className="border-red-500 text-red-600 hover:bg-red-50"
                >
                  {deletingAll ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Excluindo...
                    </>
                  ) : (
                    <>
                      <Trash className="h-4 w-4 mr-2" />
                      Excluir Todos
                    </>
                  )}
                </Button>
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
              <Card className="mb-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="text-gray-900 dark:text-gray-100">
                    {editingCombo ? 'Editar Combo' : 'Novo Combo'}
                  </CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-400">
                    {editingCombo ? 'Atualize as informações do combo' : 'Adicione um novo combo ao cardápio'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name" className="text-gray-900 dark:text-gray-100">Nome do Combo</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          required
                          placeholder="Ex: Pizza Margherita + Refrigerante"
                          className="bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="price" className="text-gray-900 dark:text-gray-100">Preço (R$)</Label>
                        <Input
                          id="price"
                          type="number"
                          step="0.01"
                          value={formData.price}
                          onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                          required
                          placeholder="29.90"
                          className="bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="description" className="text-gray-900 dark:text-gray-100">Descrição</Label>
                      <textarea
                        id="description"
                        className="w-full rounded-md border border-input bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm ring-offset-background placeholder:text-gray-500 dark:placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        rows={3}
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        required
                        placeholder="Descreva os itens incluídos no combo..."
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="categoryId" className="text-gray-900 dark:text-gray-100">Categoria</Label>
                        <select
                          id="categoryId"
                          className="w-full rounded-md border border-input bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
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
                        <Label className="text-gray-900 dark:text-gray-100">Imagem do Combo</Label>
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
                        <Label htmlFor="isActive" className="text-gray-900 dark:text-gray-100">Combo ativo</Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="isPizza"
                          checked={formData.isPizza}
                          onChange={(e) => setFormData({ ...formData, isPizza: e.target.checked, isBurger: e.target.checked ? false : formData.isBurger })}
                          className="rounded border-gray-300 dark:border-gray-600"
                        />
                        <Label htmlFor="isPizza" className="text-gray-900 dark:text-gray-100">É uma pizza (permite personalização)</Label>
                      </div>
                      
                      <div className="flex items-center space-x-2 mt-3">
                        <input
                          type="checkbox"
                          id="isBurger"
                          checked={formData.isBurger}
                          onChange={(e) => setFormData({ ...formData, isBurger: e.target.checked, isPizza: e.target.checked ? false : formData.isPizza })}
                          className="rounded border-gray-300 dark:border-gray-600"
                        />
                        <Label htmlFor="isBurger" className="text-gray-900 dark:text-gray-100">É um hambúrguer (permite escolher tipo)</Label>
                      </div>
                      
                      <div className="flex items-center space-x-2 mt-3">
                        <input
                          type="checkbox"
                          id="showFlavors"
                          checked={formData.showFlavors}
                          onChange={(e) => setFormData({ ...formData, showFlavors: e.target.checked })}
                          className="rounded border-gray-300 dark:border-gray-600"
                        />
                        <Label htmlFor="showFlavors" className="text-gray-900 dark:text-gray-100">Exibir sabores na personalização</Label>
                      </div>
                    </div>

                    {/* Campos de Preço para Hambúrgueres */}
                    {formData.isBurger && (
                      <div className="mt-4 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                        <Label className="text-sm font-medium mb-3 block text-gray-900 dark:text-gray-100">Preços dos Tipos de Hambúrguer</Label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="burgerArtisanalPrice" className="text-gray-900 dark:text-gray-100">Preço Artesanal (R$)</Label>
                            <Input
                              id="burgerArtisanalPrice"
                              type="number"
                              step="0.01"
                              value={formData.burgerArtisanalPrice}
                              onChange={(e) => setFormData({ ...formData, burgerArtisanalPrice: e.target.value })}
                              placeholder={formData.price || "0.00"}
                              className="bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 mt-1"
                            />
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              Deixe vazio para usar o preço base
                            </p>
                          </div>
                          <div>
                            <Label htmlFor="burgerIndustrialPrice" className="text-gray-900 dark:text-gray-100">Preço Industrial (R$)</Label>
                            <Input
                              id="burgerIndustrialPrice"
                              type="number"
                              step="0.01"
                              value={formData.burgerIndustrialPrice}
                              onChange={(e) => setFormData({ ...formData, burgerIndustrialPrice: e.target.value })}
                              placeholder={formData.price || "0.00"}
                              className="bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 mt-1"
                            />
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              Deixe vazio para usar o preço base
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Campo de Ordem */}
                    <div className="mt-4">
                      <Label htmlFor="order" className="text-gray-900 dark:text-gray-100">Ordem de Exibição</Label>
                      <Input
                        id="order"
                        type="number"
                        value={formData.order}
                        onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                        placeholder="0"
                        className="bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 mt-1"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Número menor = aparece primeiro (0 = primeiro, 1 = segundo, etc.)
                      </p>
                    </div>

                    {/* Seção de Quantidade de Pizzas */}
                    {formData.isPizza && (
                      <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <Label className="text-sm font-medium mb-2 block text-gray-900 dark:text-gray-100">Quantidade de Pizzas no Combo</Label>
                        <select
                          className="w-full rounded-md border border-input bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm"
                          value={formData.pizzaQuantity}
                          onChange={(e) => setFormData({ ...formData, pizzaQuantity: parseInt(e.target.value) })}
                        >
                          <option value={1}>1 Pizza</option>
                          <option value={2}>2 Pizzas</option>
                          <option value={3}>3 Pizzas</option>
                          <option value={4}>4 Pizzas</option>
                        </select>
                        <p className="text-xs text-gray-700 dark:text-gray-300 mt-2">
                          💡 Selecione quantas pizzas este combo contém. O cliente poderá escolher sabores diferentes para cada pizza.
                        </p>
                      </div>
                    )}

                    {/* Seção de Tamanhos de Pizza */}
                    {formData.isPizza && (
                      <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Tamanhos da Pizza</h3>
                          <Button
                            type="button"
                            onClick={addPizzaSize}
                            variant="outline"
                            size="sm"
                            className="bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Adicionar Tamanho
                          </Button>
                        </div>
                        
                        {formData.pizzaSizes.length === 0 ? (
                          <p className="text-sm text-gray-600 dark:text-gray-400 text-center py-4">
                            Nenhum tamanho adicionado. Clique em &quot;Adicionar Tamanho&quot; para começar.
                          </p>
                        ) : (
                          <div className="space-y-4">
                            {formData.pizzaSizes.map((size, index) => {
                              const config = getSizeConfig(size.name)
                              return (
                                <div key={index} className="p-4 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                                    <div>
                                      <Label className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2 block">Tamanho</Label>
                                      <select
                                        className="w-full rounded-md border border-input bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm"
                                        value={size.name}
                                        onChange={(e) => {
                                          const newName = e.target.value
                                          const config = getSizeConfig(newName)
                                          const updatedSizes = [...formData.pizzaSizes]
                                          updatedSizes[index] = {
                                            ...updatedSizes[index],
                                            name: newName,
                                            slices: config.slices,
                                            maxFlavors: config.maxFlavors
                                          }
                                          setFormData({ ...formData, pizzaSizes: updatedSizes })
                                        }}
                                      >
                                        <option value="Pequena">Pequena</option>
                                        <option value="Média">Média</option>
                                        <option value="Grande">Grande</option>
                                        <option value="Família">Família</option>
                                      </select>
                                    </div>
                                    
                                    <div>
                                      <Label className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2 block">Preço (R$)</Label>
                                      <Input
                                        type="number"
                                        step="0.01"
                                        placeholder="0.00"
                                        value={size.basePrice}
                                        onChange={(e) => updatePizzaSize(index, 'basePrice', e.target.value)}
                                        className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                                      />
                                    </div>
                                    
                                    <div>
                                      <p className="text-xs text-gray-600 dark:text-gray-400">
                                        {size.slices} fatias - Até {size.maxFlavors} sabores
                                      </p>
                                    </div>
                                    
                                    <div>
                                      <Button
                                        type="button"
                                        onClick={() => removePizzaSize(index)}
                                        variant="outline"
                                        size="sm"
                                        className="w-full bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 border-red-200 dark:border-red-800"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        )}
                        
                        <p className="text-xs text-gray-700 dark:text-gray-300 mt-4">
                          💡 Adicione os tamanhos disponíveis para este combo. Os tamanhos serão criados automaticamente quando você salvar o combo.
                        </p>
                      </div>
                    )}

                    {/* Seção de Itens Extras (Refri, Batatas, etc) */}
                    <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Itens Extras do Combo</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            Adicione itens opcionais que o cliente pode escolher ao comprar este combo (refrigerante, batatas, etc)
                          </p>
                        </div>
                        <Button
                          type="button"
                          onClick={addExtraItem}
                          variant="outline"
                          size="sm"
                          className="bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Adicionar Item
                        </Button>
                      </div>

                      {/* Lista de Itens Extras */}
                      {extraItems.length > 0 ? (
                        <div className="space-y-3 mb-4">
                          {extraItems.map((item, index) => (
                            <div key={index} className="p-3 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="font-medium text-gray-900 dark:text-gray-100">{item.name}</div>
                                  {item.description && (
                                    <p className="text-sm text-gray-600 dark:text-gray-400">{item.description}</p>
                                  )}
                                  <div className="flex items-center gap-2 mt-1">
                                    <Badge variant="outline" className="text-xs">{item.type}</Badge>
                                    {item.options.length > 0 && (
                                      <span className="text-xs text-gray-600 dark:text-gray-400">
                                        {item.options.length} opção{item.options.length !== 1 ? 'ões' : ''}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button
                                    type="button"
                                    onClick={() => editExtraItem(index)}
                                    variant="outline"
                                    size="sm"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    type="button"
                                    onClick={() => deleteExtraItem(index)}
                                    variant="outline"
                                    size="sm"
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-600 dark:text-gray-400 text-center py-4">
                          Nenhum item extra adicionado. Clique em &quot;Adicionar Item&quot; para começar.
                        </p>
                      )}

                      {/* Formulário de Item Extra */}
                      {showExtraItemForm && (
                        <div className="mt-4 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                          <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">
                            {editingExtraItem !== null ? 'Editar Item Extra' : 'Novo Item Extra'}
                          </h4>
                          <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <Label className="text-gray-900 dark:text-gray-100">Nome do Item</Label>
                                <Input
                                  value={extraItemForm.name}
                                  onChange={(e) => setExtraItemForm({ ...extraItemForm, name: e.target.value })}
                                  placeholder="Ex: Refrigerante"
                                  className="bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                />
                              </div>
                              <div>
                                <Label className="text-gray-900 dark:text-gray-100">Tipo</Label>
                                <select
                                  value={extraItemForm.type}
                                  onChange={(e) => setExtraItemForm({ ...extraItemForm, type: e.target.value })}
                                  className="w-full rounded-md border border-input bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm"
                                >
                                  <option value="DRINK">Bebida</option>
                                  <option value="SIDE">Acompanhamento</option>
                                  <option value="DESSERT">Sobremesa</option>
                                </select>
                              </div>
                            </div>
                            <div>
                              <Label className="text-gray-900 dark:text-gray-100">Descrição (opcional)</Label>
                              <Input
                                value={extraItemForm.description}
                                onChange={(e) => setExtraItemForm({ ...extraItemForm, description: e.target.value })}
                                placeholder="Descrição do item"
                                className="bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                              />
                            </div>

                            {/* Opções do Item (ex: diferentes sabores de refri) */}
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <Label className="text-gray-900 dark:text-gray-100">Opções (ex: Coca-Cola, Pepsi)</Label>
                                <Button
                                  type="button"
                                  onClick={addExtraItemOption}
                                  variant="outline"
                                  size="sm"
                                >
                                  <Plus className="h-4 w-4 mr-1" />
                                  Adicionar Opção
                                </Button>
                              </div>
                              {extraItemForm.options.length > 0 ? (
                                <div className="space-y-2">
                                  {extraItemForm.options.map((option, optIndex) => (
                                    <div key={optIndex} className="flex items-center gap-2">
                                      <Input
                                        value={option.name}
                                        onChange={(e) => updateExtraItemOption(optIndex, 'name', e.target.value)}
                                        placeholder="Nome da opção"
                                        className="flex-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                      />
                                      <Input
                                        type="number"
                                        step="0.01"
                                        value={option.price}
                                        onChange={(e) => updateExtraItemOption(optIndex, 'price', parseFloat(e.target.value) || 0)}
                                        placeholder="Preço"
                                        className="w-24 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                      />
                                      <Button
                                        type="button"
                                        onClick={() => removeExtraItemOption(optIndex)}
                                        variant="outline"
                                        size="sm"
                                        className="text-red-600"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-xs text-gray-600 dark:text-gray-400">
                                  💡 Se não adicionar opções, o item aparecerá como um checkbox simples. Se adicionar opções, cada opção aparecerá como checkbox separado.
                                </p>
                              )}
                            </div>

                            <div className="flex justify-end gap-2">
                              <Button
                                type="button"
                                onClick={() => {
                                  setShowExtraItemForm(false)
                                  setEditingExtraItem(null)
                                  setExtraItemForm({
                                    name: '',
                                    description: '',
                                    type: 'DRINK',
                                    price: 0,
                                    options: []
                                  })
                                }}
                                variant="outline"
                              >
                                Cancelar
                              </Button>
                              <Button
                                type="button"
                                onClick={saveExtraItem}
                              >
                                {editingExtraItem !== null ? 'Atualizar' : 'Adicionar'}
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}

                      <p className="text-xs text-gray-700 dark:text-gray-300 mt-4">
                        💡 Os itens extras aparecerão como checkboxes na personalização do combo. O cliente poderá escolher quais itens adicionar ao combo.
                      </p>
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
              <Card className="mb-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="text-gray-900 dark:text-gray-100">Nova Categoria</CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-400">
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
            {Array.isArray(categories) && categories
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
                    {categoryCombos
                      .sort((a, b) => (a.order || 0) - (b.order || 0))
                      .map((combo, index) => (
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
                                onClick={() => handleMoveCombo(combo.id, category.id, 'up')}
                                disabled={index === 0}
                                title="Mover para cima"
                              >
                                <ArrowUp className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleMoveCombo(combo.id, category.id, 'down')}
                                disabled={index === categoryCombos.length - 1}
                                title="Mover para baixo"
                              >
                                <ArrowDown className="h-4 w-4" />
                              </Button>
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

        {/* Modal de OCR */}
        {showOcrModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Scan className="h-5 w-5" />
                  IA: Extrair Cardápio da Foto
                </CardTitle>
                <CardDescription>
                  Envie uma foto do cardápio e nossa IA irá extrair automaticamente os itens, descrições e preços
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Selecione a foto do cardápio</Label>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        setOcrImage(file)
                        setOcrResults([])
                      }
                    }}
                    className="mt-2"
                  />
                  {ocrImage && (
                    <div className="mt-4">
                      <img
                        src={URL.createObjectURL(ocrImage)}
                        alt="Preview"
                        className="max-w-full h-auto rounded-lg border"
                      />
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleOcrProcess}
                    disabled={!ocrImage || ocrProcessing}
                    className="flex-1"
                  >
                    {ocrProcessing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processando...
                      </>
                    ) : (
                      <>
                        <Scan className="h-4 w-4 mr-2" />
                        Processar com IA
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowOcrModal(false)
                      setOcrImage(null)
                      setOcrResults([])
                    }}
                  >
                    Fechar
                  </Button>
                </div>

                {ocrResults.length > 0 && (
                  <div className="mt-6">
                    <h3 className="font-semibold mb-3">Itens Extraídos ({ocrResults.length})</h3>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {ocrResults.map((item, index) => (
                        <Card key={index} className="p-3">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <p className="font-medium">{item.name}</p>
                              {item.description && (
                                <p className="text-sm text-gray-600">{item.description}</p>
                              )}
                              {item.price && (
                                <p className="text-sm font-semibold text-green-600">
                                  R$ {item.price.toFixed(2)}
                                </p>
                              )}
                              <p className="text-xs text-gray-400 mt-1">
                                Confiança: {(item.confidence * 100).toFixed(0)}%
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <select
                                className="text-sm border rounded px-2 py-1"
                                onChange={(e) => {
                                  if (e.target.value) {
                                    handleCreateFromOcr(item, e.target.value)
                                  }
                                }}
                                defaultValue=""
                              >
                                <option value="">Criar em...</option>
                                {categories.map(cat => (
                                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </ProtectedRoute>
  )
}


