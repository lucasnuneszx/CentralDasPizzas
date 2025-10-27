'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { MapPin, Plus, Edit, Trash2, Save, X } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface DeliveryArea {
  id: string
  name: string
  city: string
  state: string
  zipCode?: string
  deliveryFee: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export default function DeliveryAreasPage() {
  const [areas, setAreas] = useState<DeliveryArea[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    name: '',
    city: '',
    state: '',
    zipCode: '',
    deliveryFee: '',
    isActive: true
  })

  useEffect(() => {
    loadAreas()
  }, [])

  const loadAreas = async () => {
    try {
      const response = await fetch('/api/delivery-areas')
      if (response.ok) {
        const data = await response.json()
        setAreas(data)
      } else {
        toast.error('Erro ao carregar áreas de entrega')
      }
    } catch (error) {
      console.error('Erro ao carregar áreas:', error)
      toast.error('Erro ao carregar áreas de entrega')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreate = () => {
    setFormData({
      name: '',
      city: '',
      state: '',
      zipCode: '',
      deliveryFee: '',
      isActive: true
    })
    setIsCreating(true)
    setEditingId(null)
  }

  const handleEdit = (area: DeliveryArea) => {
    setFormData({
      name: area.name,
      city: area.city,
      state: area.state,
      zipCode: area.zipCode || '',
      deliveryFee: area.deliveryFee.toString(),
      isActive: area.isActive
    })
    setEditingId(area.id)
    setIsCreating(false)
  }

  const handleCancel = () => {
    setIsCreating(false)
    setEditingId(null)
    setFormData({
      name: '',
      city: '',
      state: '',
      zipCode: '',
      deliveryFee: '',
      isActive: true
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name || !formData.city || !formData.state || !formData.deliveryFee) {
      toast.error('Preencha todos os campos obrigatórios')
      return
    }

    try {
      const areaData = {
        name: formData.name,
        city: formData.city,
        state: formData.state,
        zipCode: formData.zipCode || null,
        deliveryFee: parseFloat(formData.deliveryFee),
        isActive: formData.isActive
      }

      let response
      if (editingId) {
        response = await fetch(`/api/delivery-areas/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(areaData)
        })
      } else {
        response = await fetch('/api/delivery-areas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(areaData)
        })
      }

      if (response.ok) {
        toast.success(editingId ? 'Área atualizada com sucesso!' : 'Área criada com sucesso!')
        loadAreas()
        handleCancel()
      } else {
        const error = await response.json()
        toast.error(error.message || 'Erro ao salvar área')
      }
    } catch (error) {
      console.error('Erro ao salvar área:', error)
      toast.error('Erro ao salvar área')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta área de entrega?')) {
      return
    }

    try {
      const response = await fetch(`/api/delivery-areas/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Área excluída com sucesso!')
        loadAreas()
      } else {
        const error = await response.json()
        toast.error(error.message || 'Erro ao excluir área')
      }
    } catch (error) {
      console.error('Erro ao excluir área:', error)
      toast.error('Erro ao excluir área')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando áreas de entrega...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <MapPin className="h-8 w-8 text-primary" />
              Áreas de Entrega
            </h1>
            <p className="text-gray-600 mt-2">
              Gerencie as áreas de entrega e suas respectivas taxas
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Formulário */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {editingId ? (
                      <>
                        <Edit className="h-5 w-5" />
                        Editar Área
                      </>
                    ) : isCreating ? (
                      <>
                        <Plus className="h-5 w-5" />
                        Nova Área
                      </>
                    ) : (
                      <>
                        <MapPin className="h-5 w-5" />
                        Áreas de Entrega
                      </>
                    )}
                  </CardTitle>
                  <CardDescription>
                    {editingId 
                      ? 'Edite os dados da área de entrega'
                      : isCreating 
                        ? 'Adicione uma nova área de entrega'
                        : 'Clique em "Nova Área" para começar'
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {(isCreating || editingId) ? (
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div>
                        <Label htmlFor="name">Nome do Bairro *</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="Ex: Centro, Jardim das Flores"
                          required
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="city">Cidade *</Label>
                          <Input
                            id="city"
                            value={formData.city}
                            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                            placeholder="Ex: São Paulo"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="state">Estado *</Label>
                          <Input
                            id="state"
                            value={formData.state}
                            onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                            placeholder="Ex: SP"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="zipCode">CEP (opcional)</Label>
                        <Input
                          id="zipCode"
                          value={formData.zipCode}
                          onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                          placeholder="00000-000"
                        />
                      </div>

                      <div>
                        <Label htmlFor="deliveryFee">Taxa de Entrega (R$) *</Label>
                        <Input
                          id="deliveryFee"
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.deliveryFee}
                          onChange={(e) => setFormData({ ...formData, deliveryFee: e.target.value })}
                          placeholder="0.00"
                          required
                        />
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch
                          id="isActive"
                          checked={formData.isActive}
                          onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                        />
                        <Label htmlFor="isActive">Área ativa</Label>
                      </div>

                      <div className="flex gap-2 pt-4">
                        <Button type="submit" className="flex-1">
                          <Save className="h-4 w-4 mr-2" />
                          {editingId ? 'Atualizar' : 'Criar'}
                        </Button>
                        <Button type="button" variant="outline" onClick={handleCancel}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <div className="text-center py-8">
                      <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 mb-4">
                        Gerencie as áreas de entrega e suas taxas
                      </p>
                      <Button onClick={handleCreate}>
                        <Plus className="h-4 w-4 mr-2" />
                        Nova Área
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Lista de Áreas */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Áreas Cadastradas</CardTitle>
                  <CardDescription>
                    {areas.length} área{areas.length !== 1 ? 's' : ''} cadastrada{areas.length !== 1 ? 's' : ''}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {areas.length === 0 ? (
                    <div className="text-center py-8">
                      <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 mb-4">Nenhuma área cadastrada</p>
                      <Button onClick={handleCreate}>
                        <Plus className="h-4 w-4 mr-2" />
                        Criar Primeira Área
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {areas.map((area) => (
                        <div
                          key={area.id}
                          className={`p-4 border rounded-lg ${
                            area.isActive ? 'bg-white' : 'bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-gray-900">
                                  {area.name}
                                </h3>
                                {!area.isActive && (
                                  <span className="px-2 py-1 text-xs bg-gray-200 text-gray-600 rounded">
                                    Inativa
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-600">
                                {area.city} - {area.state}
                                {area.zipCode && ` • CEP: ${area.zipCode}`}
                              </p>
                              <p className="text-sm font-medium text-primary">
                                Taxa: R$ {area.deliveryFee.toFixed(2).replace('.', ',')}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEdit(area)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDelete(area.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
