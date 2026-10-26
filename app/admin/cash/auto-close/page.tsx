'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ProtectedRoute } from '@/components/protected-route'
import { UserRole } from '@/lib/constants'
import { ArrowLeft, Clock, Save, Play, Pause, Calendar, DollarSign } from 'lucide-react'
import toast from 'react-hot-toast'

interface AutoCloseSettings {
  autoCloseTime: string
  autoCloseEnabled: boolean
}

export default function AutoCloseSettings() {
  const [settings, setSettings] = useState<AutoCloseSettings>({
    autoCloseTime: '23:00',
    autoCloseEnabled: false
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const router = useRouter()

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/cash/schedule-close')
      const data = await response.json()
      setSettings(data)
    } catch (error) {
      toast.error('Erro ao carregar configurações')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const response = await fetch('/api/cash/schedule-close', {
        method: 'POST',
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
      setIsSaving(false)
    }
  }

  const testAutoClose = async () => {
    try {
      const response = await fetch('/api/cash/auto-close', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ date: new Date().toISOString().split('T')[0] }),
      })

      if (response.ok) {
        const result = await response.json()
        toast.success('Teste de fechamento executado com sucesso!')
      } else {
        toast.error('Erro no teste de fechamento')
      }
    } catch (error) {
      toast.error('Erro no teste de fechamento')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
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
                  <Clock className="h-8 w-8 text-blue-500 mr-3" />
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                      Fechamento Automático de Caixa
                    </h1>
                    <p className="text-sm text-gray-600">
                      Configure o fechamento automático diário
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0 space-y-6">
            {/* Configurações Principais */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="h-5 w-5 mr-2" />
                  Configurações de Fechamento
                </CardTitle>
                <CardDescription>
                  Configure o horário e ative o fechamento automático do caixa
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="autoCloseEnabled"
                    checked={settings.autoCloseEnabled}
                    onChange={(e) => setSettings({ ...settings, autoCloseEnabled: e.target.checked })}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="autoCloseEnabled" className="text-lg font-medium">
                    Ativar fechamento automático
                  </Label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="autoCloseTime">Horário de Fechamento</Label>
                    <Input
                      id="autoCloseTime"
                      type="time"
                      value={settings.autoCloseTime}
                      onChange={(e) => setSettings({ ...settings, autoCloseTime: e.target.value })}
                      className="mt-1"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      O caixa será fechado automaticamente neste horário
                    </p>
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={testAutoClose}
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Testar Fechamento
                  </Button>
                  <Button onClick={handleSave} disabled={isSaving}>
                    <Save className="h-4 w-4 mr-2" />
                    {isSaving ? 'Salvando...' : 'Salvar Configurações'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Informações sobre o Fechamento Automático */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2" />
                  Como Funciona o Fechamento Automático
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-blue-600 text-sm font-bold">1</span>
                    </div>
                    <div>
                      <h4 className="font-medium">Agendamento</h4>
                      <p className="text-sm text-gray-600">
                        O sistema verifica automaticamente se é hora de fechar o caixa
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-blue-600 text-sm font-bold">2</span>
                    </div>
                    <div>
                      <h4 className="font-medium">Cálculo de Vendas</h4>
                      <p className="text-sm text-gray-600">
                        Todas as vendas do dia são calculadas automaticamente
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-blue-600 text-sm font-bold">3</span>
                    </div>
                    <div>
                      <h4 className="font-medium">Relatório Gerado</h4>
                      <p className="text-sm text-gray-600">
                        Um relatório completo é gerado com vendas, top produtos e rendimento
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-blue-600 text-sm font-bold">4</span>
                    </div>
                    <div>
                      <h4 className="font-medium">Registro no Caixa</h4>
                      <p className="text-sm text-gray-600">
                        O fechamento é registrado no sistema de caixa para controle
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Benefícios */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <DollarSign className="h-5 w-5 mr-2" />
                  Benefícios do Fechamento Automático
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium text-green-600">✓ Controle Automático</h4>
                    <p className="text-sm text-gray-600">
                      Não precisa lembrar de fechar o caixa manualmente
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium text-green-600">✓ Relatórios Precisos</h4>
                    <p className="text-sm text-gray-600">
                      Relatórios gerados automaticamente todos os dias
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium text-green-600">✓ Economia de Tempo</h4>
                    <p className="text-sm text-gray-600">
                      Processo automatizado economiza tempo da equipe
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium text-green-600">✓ Controle Financeiro</h4>
                    <p className="text-sm text-gray-600">
                      Melhor controle do fluxo de caixa e rendimento
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}


