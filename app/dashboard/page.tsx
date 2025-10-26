'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ProtectedRoute } from '@/components/protected-route'
import { DashboardShell } from '@/components/dashboard/shell'
import { UserRole } from '@/lib/constants'
import { 
  Home, 
  LogOut, 
  Package, 
  Users, 
  DollarSign, 
  Settings,
  ShoppingCart,
  ChefHat,
  TrendingUp,
  Clock,
  Shield,
  Zap,
  BarChart3,
  Bell,
  Search,
  Menu,
  X,
  Smartphone
} from 'lucide-react'
import { IfoodIframePopup } from '@/components/ifood-iframe-popup'
import { useState } from 'react'
import { ThemeToggle } from '@/components/theme-toggle'

export default function Dashboard() {
  const { data: session } = useSession()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showIfoodPopup, setShowIfoodPopup] = useState(false)

  const handleSignOut = () => {
    // Implementar logout
    router.push('/auth/signin')
  }

  const getDashboardContent = () => {
    switch (session?.user.role) {
      case UserRole.ADMIN:
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <Card className="group hover:shadow-2xl transition-all duration-300 border-0 bg-gradient-to-br from-blue-500 to-blue-600 text-white hover:scale-105">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Package className="h-8 w-8" />
                  <TrendingUp className="h-5 w-5 opacity-80" />
                </div>
                <CardTitle className="text-white text-lg">Gestão de Combos</CardTitle>
                <CardDescription className="text-blue-100">
                  Adicionar, editar e gerenciar combos e produtos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  variant="secondary" 
                  className="w-full bg-white/20 hover:bg-white/30 text-white border-0"
                  onClick={() => router.push('/admin/combos')}
                >
                  Acessar
                </Button>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-2xl transition-all duration-300 border-0 bg-gradient-to-br from-indigo-500 to-indigo-600 text-white hover:scale-105">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Menu className="h-8 w-8" />
                  <Filter className="h-5 w-5 opacity-80" />
                </div>
                <CardTitle className="text-white text-lg">Categorias</CardTitle>
                <CardDescription className="text-indigo-100">
                  Gerenciar categorias do cardápio
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  variant="secondary" 
                  className="w-full bg-white/20 hover:bg-white/30 text-white border-0"
                  onClick={() => router.push('/admin/categories')}
                >
                  Acessar
                </Button>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-2xl transition-all duration-300 border-0 bg-gradient-to-br from-green-500 to-green-600 text-white hover:scale-105">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Users className="h-8 w-8" />
                  <Shield className="h-5 w-5 opacity-80" />
                </div>
                <CardTitle className="text-white text-lg">Gestão de Usuários</CardTitle>
                <CardDescription className="text-green-100">
                  Gerenciar funcionários e permissões
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  variant="secondary" 
                  className="w-full bg-white/20 hover:bg-white/30 text-white border-0"
                  onClick={() => router.push('/admin/users')}
                >
                  Acessar
                </Button>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-2xl transition-all duration-300 border-0 bg-gradient-to-br from-purple-500 to-purple-600 text-white hover:scale-105">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <BarChart3 className="h-8 w-8" />
                  <TrendingUp className="h-5 w-5 opacity-80" />
                </div>
                <CardTitle className="text-white text-lg">Relatórios</CardTitle>
                <CardDescription className="text-purple-100">
                  Relatórios de vendas e financeiros
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  variant="secondary" 
                  className="w-full bg-white/20 hover:bg-white/30 text-white border-0"
                  onClick={() => router.push('/admin/reports')}
                >
                  Acessar
                </Button>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-2xl transition-all duration-300 border-0 bg-gradient-to-br from-orange-500 to-orange-600 text-white hover:scale-105">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Settings className="h-8 w-8" />
                  <Zap className="h-5 w-5 opacity-80" />
                </div>
                <CardTitle className="text-white text-lg">Configurações</CardTitle>
                <CardDescription className="text-orange-100">
                  Configurações do sistema e integrações
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  variant="secondary" 
                  className="w-full bg-white/20 hover:bg-white/30 text-white border-0"
                  onClick={() => router.push('/admin/settings')}
                >
                  Acessar
                </Button>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-2xl transition-all duration-300 border-0 bg-gradient-to-br from-pink-500 to-pink-600 text-white hover:scale-105">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Smartphone className="h-8 w-8" />
                  <TrendingUp className="h-5 w-5 opacity-80" />
                </div>
                <CardTitle className="text-white text-lg">Dashboard iFood</CardTitle>
                <CardDescription className="text-pink-100">
                  Gestão de pedidos e integração iFood
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  variant="secondary" 
                  className="w-full bg-white/20 hover:bg-white/30 text-white border-0"
                  onClick={() => router.push('/admin/ifood/dashboard')}
                >
                  Acessar
                </Button>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-2xl transition-all duration-300 border-0 bg-gradient-to-br from-indigo-500 to-indigo-600 text-white hover:scale-105">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Clock className="h-8 w-8" />
                  <Zap className="h-5 w-5 opacity-80" />
                </div>
                <CardTitle className="text-white text-lg">Fechamento Automático</CardTitle>
                <CardDescription className="text-indigo-100">
                  Configure fechamento automático de caixa
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  variant="secondary" 
                  className="w-full bg-white/20 hover:bg-white/30 text-white border-0"
                  onClick={() => router.push('/admin/cash/auto-close')}
                >
                  Acessar
                </Button>
              </CardContent>
            </Card>
          </div>
        )

      case UserRole.MANAGER:
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="group hover:shadow-2xl transition-all duration-300 border-0 bg-gradient-to-br from-blue-500 to-blue-600 text-white hover:scale-105">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Package className="h-8 w-8" />
                  <TrendingUp className="h-5 w-5 opacity-80" />
                </div>
                <CardTitle className="text-white text-lg">Gestão de Combos</CardTitle>
                <CardDescription className="text-blue-100">
                  Adicionar e editar combos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  variant="secondary" 
                  className="w-full bg-white/20 hover:bg-white/30 text-white border-0"
                  onClick={() => router.push('/manager/combos')}
                >
                  Acessar
                </Button>
              </CardContent>
            </Card>
            
            <Card className="group hover:shadow-2xl transition-all duration-300 border-0 bg-gradient-to-br from-green-500 to-green-600 text-white hover:scale-105">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <ShoppingCart className="h-8 w-8" />
                  <Clock className="h-5 w-5 opacity-80" />
                </div>
                <CardTitle className="text-white text-lg">Pedidos</CardTitle>
                <CardDescription className="text-green-100">
                  Visualizar e gerenciar pedidos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  variant="secondary" 
                  className="w-full bg-white/20 hover:bg-white/30 text-white border-0"
                  onClick={() => router.push('/manager/orders')}
                >
                  Acessar
                </Button>
              </CardContent>
            </Card>
            
            <Card className="group hover:shadow-2xl transition-all duration-300 border-0 bg-gradient-to-br from-purple-500 to-purple-600 text-white hover:scale-105">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <BarChart3 className="h-8 w-8" />
                  <TrendingUp className="h-5 w-5 opacity-80" />
                </div>
                <CardTitle className="text-white text-lg">Relatórios</CardTitle>
                <CardDescription className="text-purple-100">
                  Relatórios de vendas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  variant="secondary" 
                  className="w-full bg-white/20 hover:bg-white/30 text-white border-0"
                  onClick={() => router.push('/manager/reports')}
                >
                  Acessar
                </Button>
              </CardContent>
            </Card>
          </div>
        )

      case UserRole.CASHIER:
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="group hover:shadow-2xl transition-all duration-300 border-0 bg-gradient-to-br from-green-500 to-green-600 text-white hover:scale-105">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <ShoppingCart className="h-8 w-8" />
                  <Clock className="h-5 w-5 opacity-80" />
                </div>
                <CardTitle className="text-white text-lg">Pedidos</CardTitle>
                <CardDescription className="text-green-100">
                  Processar pedidos e pagamentos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  variant="secondary" 
                  className="w-full bg-white/20 hover:bg-white/30 text-white border-0"
                  onClick={() => router.push('/cashier/orders')}
                >
                  Acessar
                </Button>
              </CardContent>
            </Card>
            
            <Card className="group hover:shadow-2xl transition-all duration-300 border-0 bg-gradient-to-br from-blue-500 to-blue-600 text-white hover:scale-105">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <DollarSign className="h-8 w-8" />
                  <Shield className="h-5 w-5 opacity-80" />
                </div>
                <CardTitle className="text-white text-lg">Caixa</CardTitle>
                <CardDescription className="text-blue-100">
                  Controle de caixa e fechamento
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  variant="secondary" 
                  className="w-full bg-white/20 hover:bg-white/30 text-white border-0"
                  onClick={() => router.push('/cashier/cash')}
                >
                  Acessar
                </Button>
              </CardContent>
            </Card>
            
            <Card className="group hover:shadow-2xl transition-all duration-300 border-0 bg-gradient-to-br from-orange-500 to-orange-600 text-white hover:scale-105">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Package className="h-8 w-8" />
                  <TrendingUp className="h-5 w-5 opacity-80" />
                </div>
                <CardTitle className="text-white text-lg">Combos</CardTitle>
                <CardDescription className="text-orange-100">
                  Visualizar combos disponíveis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  variant="secondary" 
                  className="w-full bg-white/20 hover:bg-white/30 text-white border-0"
                  onClick={() => router.push('/cashier/combos')}
                >
                  Acessar
                </Button>
              </CardContent>
            </Card>
          </div>
        )

      case UserRole.KITCHEN:
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="group hover:shadow-2xl transition-all duration-300 border-0 bg-gradient-to-br from-orange-500 to-orange-600 text-white hover:scale-105">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <ChefHat className="h-8 w-8" />
                  <Clock className="h-5 w-5 opacity-80" />
                </div>
                <CardTitle className="text-white text-lg">Pedidos da Cozinha</CardTitle>
                <CardDescription className="text-orange-100">
                  Visualizar e atualizar status dos pedidos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  variant="secondary" 
                  className="w-full bg-white/20 hover:bg-white/30 text-white border-0"
                  onClick={() => router.push('/kitchen/orders')}
                >
                  Acessar
                </Button>
              </CardContent>
            </Card>
            
            <Card className="group hover:shadow-2xl transition-all duration-300 border-0 bg-gradient-to-br from-blue-500 to-blue-600 text-white hover:scale-105">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Package className="h-8 w-8" />
                  <TrendingUp className="h-5 w-5 opacity-80" />
                </div>
                <CardTitle className="text-white text-lg">Cardápio</CardTitle>
                <CardDescription className="text-blue-100">
                  Visualizar combos e ingredientes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  variant="secondary" 
                  className="w-full bg-white/20 hover:bg-white/30 text-white border-0"
                  onClick={() => router.push('/kitchen/menu')}
                >
                  Acessar
                </Button>
              </CardContent>
            </Card>
          </div>
        )

      case UserRole.CLIENT:
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="group hover:shadow-2xl transition-all duration-300 border-0 bg-gradient-to-br from-red-500 to-red-600 text-white hover:scale-105">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Package className="h-8 w-8" />
                  <TrendingUp className="h-5 w-5 opacity-80" />
                </div>
                <CardTitle className="text-white text-lg">Cardápio</CardTitle>
                <CardDescription className="text-red-100">
                  Visualizar combos e fazer pedidos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  variant="secondary" 
                  className="w-full bg-white/20 hover:bg-white/30 text-white border-0"
                  onClick={() => router.push('/client/menu')}
                >
                  Acessar
                </Button>
              </CardContent>
            </Card>
            
            <Card className="group hover:shadow-2xl transition-all duration-300 border-0 bg-gradient-to-br from-green-500 to-green-600 text-white hover:scale-105">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <ShoppingCart className="h-8 w-8" />
                  <Clock className="h-5 w-5 opacity-80" />
                </div>
                <CardTitle className="text-white text-lg">Meus Pedidos</CardTitle>
                <CardDescription className="text-green-100">
                  Acompanhar seus pedidos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  variant="secondary" 
                  className="w-full bg-white/20 hover:bg-white/30 text-white border-0"
                  onClick={() => router.push('/client/orders')}
                >
                  Acessar
                </Button>
              </CardContent>
            </Card>
          </div>
        )

      default:
        return (
          <Card className="border-0 bg-gradient-to-br from-gray-100 to-gray-200">
            <CardHeader>
              <CardTitle className="text-center">Bem-vindo ao Sistema PDV</CardTitle>
              <CardDescription className="text-center">
                Selecione uma opção para começar
              </CardDescription>
            </CardHeader>
          </Card>
        )
    }
  }

  return (
    <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER, UserRole.KITCHEN, UserRole.CLIENT]}>
      <DashboardShell>
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold mb-2">Dashboard</h2>
            <p className="text-muted-foreground">Bem-vindo ao sistema de gestão da Central Das Pizzas</p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-muted-foreground">Sistema Online</span>
          </div>
        </div>
        {getDashboardContent()}
        <IfoodIframePopup 
          isOpen={showIfoodPopup}
          onClose={() => setShowIfoodPopup(false)}
        />
      </DashboardShell>
    </ProtectedRoute>
  )
}