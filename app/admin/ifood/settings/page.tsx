'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { ProtectedRoute } from '@/components/protected-route'
import { UserRole } from '@/lib/constants'
import { 
  ArrowLeft, 
  Save, 
  TestTube, 
  Smartphone,
  Settings,
  Bell,
  Printer,
  CheckCircle,
  XCircle
} from 'lucide-react'
import toast from 'react-hot-toast'

interface IfoodSettings {
  apiUrl: string
  apiKey: string
  merchantId: string
  autoPrint: boolean
  autoAccept: boolean
  notificationsEnabled: boolean
  webhookUrl: string
  logo?: string
}

export default function IfoodSettings() {
  const [settings, setSettings] = useState<IfoodSettings>({
    apiUrl: '',
    apiKey: '',
    merchantId: '',
    autoPrint: false,
    autoAccept: false,
    notificationsEnabled: true,
    webhookUrl: '',
    logo: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const router = useRouter()

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/ifood/settings')
      const data = await response.json()
      setSettings(data)
    } catch (error) {
      toast.error('Erro ao carregar configurações')
    }
  }

  const handleSave = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/ifood/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      })

      if (response.ok) {
        toast.success('Configurações salvas com sucesso!')
      } else {
        toast.error('Erro ao salvar configurações')
      }
    } catch (error) {
      toast.error('Erro ao salvar configurações')
    } finally {
      setIsLoading(false)
    }
  }

  const testConnection = async () => {
    setIsTesting(true)
    try {
      const response = await fetch('/api/ifood/test-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          apiUrl: settings.apiUrl,
          apiKey: settings.apiKey,
          merchantId: settings.merchantId
        }),
      })

      if (response.ok) {
        toast.success('Conexão com iFood estabelecida com sucesso!')
      } else {
        toast.error('Erro na conexão com iFood')
      }
    } catch (error) {
      toast.error('Erro ao testar conexão')
    } finally {
      setIsTesting(false)
    }
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setSettings({ ...settings, logo: e.target?.result as string })
      }
      reader.readAsDataURL(file)
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
                  onClick={() => router.push('/admin/ifood/dashboard')}
                  className="mr-4"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar
                </Button>
                <div className="flex items-center">
                  <Settings className="h-8 w-8 text-orange-500 mr-3" />
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                      Configurações iFood
                    </h1>
                    <p className="text-sm text-gray-600">
                      Configure a integração com a plataforma iFood
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0 space-y-6">
            
            {/* Configurações da API */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Smartphone className="h-5 w-5 mr-2 text-orange-500" />
                  Configurações da API
                </CardTitle>
                <CardDescription>
                  Configure as credenciais e URLs da API do iFood
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="apiUrl">URL da API</Label>
                    <Input
                      id="apiUrl"
                      value={settings.apiUrl}
                      onChange={(e) => setSettings({ ...settings, apiUrl: e.target.value })}
                      placeholder="https://api.ifood.com.br"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="merchantId">ID do Merchant</Label>
                    <Input
                      id="merchantId"
                      value={settings.merchantId}
                      onChange={(e) => setSettings({ ...settings, merchantId: e.target.value })}
                      placeholder="Seu ID do merchant"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="apiKey">Chave da API</Label>
                  <Input
                    id="apiKey"
                    type="password"
                    value={settings.apiKey}
                    onChange={(e) => setSettings({ ...settings, apiKey: e.target.value })}
                    placeholder="Sua chave de API do iFood"
                  />
                </div>

                <div>
                  <Label htmlFor="webhookUrl">URL do Webhook</Label>
                  <Input
                    id="webhookUrl"
                    value={settings.webhookUrl}
                    onChange={(e) => setSettings({ ...settings, webhookUrl: e.target.value })}
                    placeholder="https://seudominio.com/api/ifood/webhook"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    URL para receber notificações de novos pedidos do iFood
                  </p>
                </div>

                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    onClick={testConnection}
                    disabled={isTesting || !settings.apiUrl || !settings.apiKey}
                  >
                    <TestTube className="h-4 w-4 mr-2" />
                    {isTesting ? 'Testando...' : 'Testar Conexão'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Configurações de Comportamento */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="h-5 w-5 mr-2 text-blue-500" />
                  Comportamento Automático
                </CardTitle>
                <CardDescription>
                  Configure como o sistema deve reagir aos novos pedidos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Impressão Automática</Label>
                    <p className="text-sm text-gray-500">
                      Imprimir automaticamente novos pedidos do iFood
                    </p>
                  </div>
                  <Switch
                    checked={settings.autoPrint}
                    onCheckedChange={(checked) => setSettings({ ...settings, autoPrint: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Aceitação Automática</Label>
                    <p className="text-sm text-gray-500">
                      Aceitar automaticamente novos pedidos do iFood
                    </p>
                  </div>
                  <Switch
                    checked={settings.autoAccept}
                    onCheckedChange={(checked) => setSettings({ ...settings, autoAccept: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Notificações Ativadas</Label>
                    <p className="text-sm text-gray-500">
                      Receber notificações de novos pedidos
                    </p>
                  </div>
                  <Switch
                    checked={settings.notificationsEnabled}
                    onCheckedChange={(checked) => setSettings({ ...settings, notificationsEnabled: checked })}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Logo da Loja */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Printer className="h-5 w-5 mr-2 text-green-500" />
                  Logo da Loja
                </CardTitle>
                <CardDescription>
                  Logo que aparecerá nas notificações de pedidos do sistema próprio
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="logo">Upload da Logo</Label>
                  <Input
                    id="logo"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Imagem que aparecerá nas notificações de pedidos feitos pelo sistema
                  </p>
                </div>

                {settings.logo && (
                  <div className="flex items-center space-x-4">
                    <img
                      src={settings.logo}
                      alt="Logo da loja"
                      className="w-16 h-16 object-cover rounded-lg border"
                    />
                    <div>
                      <p className="text-sm font-medium">Preview da Logo</p>
                      <p className="text-xs text-gray-500">
                        Esta logo aparecerá nas notificações
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Botões de Ação */}
            <div className="flex justify-end space-x-4">
              <Button
                variant="outline"
                onClick={() => router.push('/admin/ifood/dashboard')}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSave}
                disabled={isLoading}
              >
                <Save className="h-4 w-4 mr-2" />
                {isLoading ? 'Salvando...' : 'Salvar Configurações'}
              </Button>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
