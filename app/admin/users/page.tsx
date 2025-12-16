'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ProtectedRoute } from '@/components/protected-route'
import { UserRole } from '@/lib/constants'
import { Plus, Edit, Trash2, ArrowLeft, Users, Shield, UserCheck, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'
import { maskEmail } from '@/lib/utils'

interface User {
  id: string
  name: string
  email: string
  role: UserRole
  isActive: boolean
  createdAt: string
}

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [showEmails, setShowEmails] = useState<{ [key: string]: boolean }>({})
  const router = useRouter()

  const [formData, setFormData] = useState<{
    name: string
    email: string
    password: string
    role: UserRole
    isActive: boolean
  }>({
    name: '',
    email: '',
    password: '',
    role: UserRole.CLIENT,
    isActive: true
  })

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users')
      const data = await response.json()
      setUsers(Array.isArray(data) ? data : [])
    } catch (error) {
      toast.error('Erro ao carregar usuários')
      setUsers([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const url = editingUser ? `/api/users/${editingUser.id}` : '/api/users'
      const method = editingUser ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        toast.success(editingUser ? 'Usuário atualizado!' : 'Usuário criado!')
        setShowForm(false)
        setEditingUser(null)
        resetForm()
        fetchUsers()
      } else {
        const error = await response.json()
        toast.error(error.message || 'Erro ao salvar usuário')
      }
    } catch (error) {
      toast.error('Erro ao salvar usuário')
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = (user: User) => {
    setEditingUser(user)
    setFormData({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role,
      isActive: user.isActive
    })
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este usuário?')) return

    try {
      const response = await fetch(`/api/users/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Usuário excluído!')
        fetchUsers()
      } else {
        toast.error('Erro ao excluir usuário')
      }
    } catch (error) {
      toast.error('Erro ao excluir usuário')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      role: UserRole.CLIENT,
      isActive: true
    })
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingUser(null)
    resetForm()
  }

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return <Shield className="w-4 h-4" />
      case UserRole.MANAGER:
        return <UserCheck className="w-4 h-4" />
      case UserRole.CASHIER:
        return <Users className="w-4 h-4" />
      default:
        return <Users className="w-4 h-4" />
    }
  }

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return 'bg-red-100 text-red-800'
      case UserRole.MANAGER:
        return 'bg-purple-100 text-purple-800'
      case UserRole.CASHIER:
        return 'bg-green-100 text-green-800'
      case UserRole.KITCHEN:
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
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
                  Gestão de Usuários
                </h1>
              </div>
              
              <Button onClick={() => setShowForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Usuário
              </Button>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            {showForm ? (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>
                    {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
                  </CardTitle>
                  <CardDescription>
                    {editingUser ? 'Atualize as informações do usuário' : 'Adicione um novo usuário ao sistema'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name">Nome</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          required
                          placeholder="Nome completo"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          required
                          placeholder="email@exemplo.com"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="password">
                          {editingUser ? 'Nova Senha (deixe em branco para manter)' : 'Senha'}
                        </Label>
                        <Input
                          id="password"
                          type="password"
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          required={!editingUser}
                          placeholder="••••••••"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="role">Função</Label>
                        <select
                          id="role"
                          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                          value={formData.role}
                          onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                          required
                        >
                          <option value={UserRole.CLIENT}>Cliente</option>
                          <option value={UserRole.CASHIER}>Caixa</option>
                          <option value={UserRole.KITCHEN}>Cozinha</option>
                          <option value={UserRole.MANAGER}>Gerente</option>
                          <option value={UserRole.ADMIN}>Administrador</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="isActive"
                        checked={formData.isActive}
                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                        className="rounded border-gray-300"
                      />
                      <Label htmlFor="isActive">Usuário ativo</Label>
                    </div>

                    <div className="flex justify-end space-x-2">
                      <Button type="button" variant="outline" onClick={handleCancel}>
                        Cancelar
                      </Button>
                      <Button type="submit" disabled={isLoading}>
                        {isLoading ? 'Salvando...' : editingUser ? 'Atualizar' : 'Criar'}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            ) : null}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {users.map((user) => (
                <Card key={user.id} className="overflow-hidden">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                          {getRoleIcon(user.role)}
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-lg">{user.name}</CardTitle>
                          <div className="flex items-center gap-2">
                            <CardDescription>
                              {showEmails[user.id] ? user.email : maskEmail(user.email)}
                            </CardDescription>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0"
                              onClick={() => setShowEmails({ ...showEmails, [user.id]: !showEmails[user.id] })}
                              title={showEmails[user.id] ? 'Ocultar email' : 'Mostrar email'}
                            >
                              {showEmails[user.id] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                            </Button>
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(user)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(user.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center">
                      <span className={`px-2 py-1 text-xs rounded-full ${getRoleColor(user.role)}`}>
                        {user.role}
                      </span>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        user.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {user.isActive ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {users.length === 0 && !isLoading && (
              <div className="text-center py-12">
                <p className="text-gray-500">Nenhum usuário cadastrado ainda.</p>
                <Button onClick={() => setShowForm(true)} className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeiro Usuário
                </Button>
              </div>
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
