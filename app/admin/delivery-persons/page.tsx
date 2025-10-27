'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ProtectedRoute } from '@/components/protected-route'
import { UserRole } from '@/lib/constants'
import { 
  ArrowLeft, 
  Plus, 
  Edit, 
  Trash2, 
  Truck,
  Phone,
  User,
  Car,
  Wifi,
  WifiOff,
  Clock,
  XCircle,
  MapPin,
  RefreshCw,
  CheckCircle
} from 'lucide-react'
import toast from 'react-hot-toast'

interface DeliveryPerson {
  id: string
  name: string
  phone: string
  plate?: string
  status: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export default function DeliveryPersonsManagement() {
  const [deliveryPersons, setDeliveryPersons] = useState<DeliveryPerson[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingPerson, setEditingPerson] = useState<DeliveryPerson | null>(null)
  const router = useRouter()

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    plate: '',
    status: 'OFFLINE',
    isActive: true
  })

  useEffect(() => {
    fetchDeliveryPersons()
    // Polling para atualizar status em tempo real
    const interval = setInterval(fetchDeliveryPersons, 5000)
    return () => clearInterval(interval)
  }, [])

  const fetchDeliveryPersons = async () => {
    try {
      const response = await fetch('/api/delivery-persons')
      const data = await response.json()
      setDeliveryPersons(data)
    } catch (error) {
      toast.error('Erro ao carregar motoboys')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const url = editingPerson ? `/api/delivery-persons/${editingPerson.id}` : '/api/delivery-persons'
      const method = editingPerson ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        toast.success(editingPerson ? 'Motoboy atualizado!' : 'Motoboy cadastrado!')
        setShowForm(false)
        setEditingPerson(null)
        resetForm()
        fetchDeliveryPersons()
      } else {
        const error = await response.json()
        toast.error(error.message || 'Erro ao salvar motoboy')
      }
    } catch (error) {
      toast.error('Erro ao salvar motoboy')
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = (person: DeliveryPerson) => {
    setEditingPerson(person)
    setFormData({
      name: person.name,
      phone: person.phone,
      plate: person.plate || '',
      status: person.status,
      isActive: person.isActive
    })
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este motoboy?')) return

    try {
      const response = await fetch(`/api/delivery-persons/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Motoboy excluído!')
        fetchDeliveryPersons()
      } else {
        toast.error('Erro ao excluir motoboy')
      }
    } catch (error) {
      toast.error('Erro ao excluir motoboy')
    }
  }

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/delivery-persons/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        toast.success('Status atualizado!')
        fetchDeliveryPersons()
      } else {
        toast.error('Erro ao atualizar status')
      }
    } catch (error) {
      toast.error('Erro ao atualizar status')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      phone: '',
      plate: '',
      status: 'OFFLINE',
      isActive: true
    })
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingPerson(null)
    resetForm()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ONLINE':
        return 'bg-green-100 text-green-800'
      case 'DELIVERING':
        return 'bg-blue-100 text-blue-800'
      case 'UNAVAILABLE':
        return 'bg-red-100 text-red-800'
      case 'OUT_OF_ROTE':
        return 'bg-yellow-100 text-yellow-800'
      case 'OFFLINE':
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ONLINE':
        return <Wifi className="w-4 h-4" />
      case 'DELIVERING':
        return <Truck className="w-4 h-4" />
      case 'UNAVAILABLE':
        return <XCircle className="w-4 h-4" />
      case 'OUT_OF_ROTE':
        return <MapPin className="w-4 h-4" />
      case 'OFFLINE':
      default:
        return <WifiOff className="w-4 h-4" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ONLINE':
        return 'Online'
      case 'DELIVERING':
        return 'Em Entrega'
      case 'UNAVAILABLE':
        return 'Indisponível'
      case 'OUT_OF_ROTE':
        return 'Fora de Rota'
      case 'OFFLINE':
      default:
        return 'Offline'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR')
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
                  onClick={() => router.push('/dashboard')}
                  className="mr-4"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar
                </Button>
                <div className="flex items-center">
                  <Truck className="h-8 w-8 text-blue-500 mr-3" />
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                      Gestão de Motoboys
                    </h1>
                    <p className="text-sm text-gray-600">
                      Cadastre e gerencie os motoboys da casa
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={fetchDeliveryPersons}
                  disabled={isLoading}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                  Atualizar
                </Button>
                <Button onClick={() => setShowForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Motoboy
                </Button>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            
            {/* Formulário */}
            {showForm ? (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>
                    {editingPerson ? 'Editar Motoboy' : 'Novo Motoboy'}
                  </CardTitle>
                  <CardDescription>
                    {editingPerson ? 'Atualize as informações do motoboy' : 'Cadastre um novo motoboy'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name">Nome *</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          required
                          placeholder="Nome completo do motoboy"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="phone">Telefone *</Label>
                        <Input
                          id="phone"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          required
                          placeholder="(71) 99999-9999"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="plate">Placa da Moto (Opcional)</Label>
                        <Input
                          id="plate"
                          value={formData.plate}
                          onChange={(e) => setFormData({ ...formData, plate: e.target.value })}
                          placeholder="ABC-1234"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="status">Status Inicial</Label>
                        <select
                          id="status"
                          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                          value={formData.status}
                          onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        >
                          <option value="OFFLINE">Offline</option>
                          <option value="ONLINE">Online</option>
                          <option value="UNAVAILABLE">Indisponível</option>
                        </select>
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
                        <Label htmlFor="isActive">Motoboy ativo</Label>
                      </div>
                    </div>

                    <div className="flex justify-end space-x-2">
                      <Button type="button" variant="outline" onClick={handleCancel}>
                        Cancelar
                      </Button>
                      <Button type="submit" disabled={isLoading}>
                        {isLoading ? 'Salvando...' : editingPerson ? 'Atualizar' : 'Cadastrar'}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            ) : null}

            {/* Lista de Motoboys */}
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-gray-500">Carregando motoboys...</p>
              </div>
            ) : deliveryPersons.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {deliveryPersons.map((person) => (
                  <Card key={person.id} className="overflow-hidden">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <Truck className="h-6 w-6 text-blue-600" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">{person.name}</CardTitle>
                            <CardDescription className="flex items-center space-x-1">
                              <Phone className="h-3 w-3" />
                              <span>{person.phone}</span>
                            </CardDescription>
                          </div>
                        </div>
                        <div className="flex space-x-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(person)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(person.id)}
                            className="text-red-600 border-red-300 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {/* Status */}
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Status:</span>
                          <Badge className={`${getStatusColor(person.status)} flex items-center space-x-1`}>
                            {getStatusIcon(person.status)}
                            <span>{getStatusText(person.status)}</span>
                          </Badge>
                        </div>

                        {/* Placa */}
                        {person.plate && (
                          <div className="flex items-center space-x-2">
                            <Car className="h-4 w-4 text-gray-500" />
                            <span className="text-sm text-gray-600">Placa: {person.plate}</span>
                          </div>
                        )}

                        {/* Data de cadastro */}
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-600">
                            Cadastrado: {formatDate(person.createdAt)}
                          </span>
                        </div>

                        {/* Ações de Status */}
                        <div className="pt-3 border-t">
                          <div className="flex flex-wrap gap-2">
                            <Button
                              size="sm"
                              variant={person.status === 'ONLINE' ? 'default' : 'outline'}
                              onClick={() => updateStatus(person.id, 'ONLINE')}
                              className="text-xs"
                            >
                              <Wifi className="w-3 h-3 mr-1" />
                              Online
                            </Button>
                            <Button
                              size="sm"
                              variant={person.status === 'DELIVERING' ? 'default' : 'outline'}
                              onClick={() => updateStatus(person.id, 'DELIVERING')}
                              className="text-xs"
                            >
                              <Truck className="w-3 h-3 mr-1" />
                              Entrega
                            </Button>
                            <Button
                              size="sm"
                              variant={person.status === 'UNAVAILABLE' ? 'default' : 'outline'}
                              onClick={() => updateStatus(person.id, 'UNAVAILABLE')}
                              className="text-xs"
                            >
                              <XCircle className="w-3 h-3 mr-1" />
                              Indisponível
                            </Button>
                            <Button
                              size="sm"
                              variant={person.status === 'OUT_OF_ROTE' ? 'default' : 'outline'}
                              onClick={() => updateStatus(person.id, 'OUT_OF_ROTE')}
                              className="text-xs"
                            >
                              <MapPin className="w-3 h-3 mr-1" />
                              Fora de Rota
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Truck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Nenhum motoboy cadastrado ainda.</p>
                <Button onClick={() => setShowForm(true)} className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Cadastrar Primeiro Motoboy
                </Button>
              </div>
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
