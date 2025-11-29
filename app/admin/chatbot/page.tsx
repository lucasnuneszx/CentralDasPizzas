'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { DashboardShell } from '@/components/dashboard/shell'
import { ProtectedRoute } from '@/components/protected-route'
import { UserRole } from '@/lib/constants'
import { 
  MessageSquare, 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X,
  Send,
  TestTube,
  Smartphone,
  CheckCircle,
  XCircle,
  Link as LinkIcon
} from 'lucide-react'
import toast from 'react-hot-toast'

interface ChatbotTemplate {
  id?: string
  name: string
  trigger: string
  message: string
  isActive: boolean
  order: number
}

const defaultTemplates: ChatbotTemplate[] = [
  {
    name: 'Pedido Confirmado',
    trigger: 'ORDER_CONFIRMED',
    message: 'Olá {customerName}! Seu pedido #{orderNumber} foi confirmado e está sendo preparado. 🍕⏰',
    isActive: true,
    order: 1
  },
  {
    name: 'Pedido em Preparação',
    trigger: 'ORDER_PREPARING',
    message: 'Olá {customerName}! Seu pedido #{orderNumber} está sendo preparado com muito carinho! Em breve estará pronto. 🍕👨‍🍳',
    isActive: true,
    order: 2
  },
  {
    name: 'Pedido Pronto para Retirada',
    trigger: 'ORDER_READY',
    message: 'Olá {customerName}! Seu pedido #{orderNumber} está pronto para retirada! Pode vir buscar quando quiser. 🍕✅',
    isActive: true,
    order: 3
  },
  {
    name: 'Pedido Saiu para Entrega',
    trigger: 'ORDER_OUT_FOR_DELIVERY',
    message: 'Olá {customerName}! Seu pedido #{orderNumber} saiu para entrega! O entregador está a caminho. 🚚📦',
    isActive: true,
    order: 4
  },
  {
    name: 'Pedido Entregue',
    trigger: 'ORDER_DELIVERED',
    message: 'Olá {customerName}! Seu pedido #{orderNumber} foi entregue! Esperamos que tenha gostado. Obrigado pela preferência! 🍕❤️',
    isActive: true,
    order: 5
  }
]

const availableVariables = [
  { var: '{customerName}', description: 'Nome do cliente' },
  { var: '{orderNumber}', description: 'Número do pedido (últimos 8 dígitos)' },
  { var: '{orderTotal}', description: 'Valor total do pedido (R$)' },
  { var: '{deliveryType}', description: 'Tipo de entrega (Entrega/Retirada)' },
  { var: '{estimatedTime}', description: 'Tempo estimado de entrega' },
  { var: '{deliveryPerson}', description: 'Nome do entregador (se aplicável)' }
]

export default function ChatbotManagement() {
  const [templates, setTemplates] = useState<ChatbotTemplate[]>([])
  const [editingTemplate, setEditingTemplate] = useState<ChatbotTemplate | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [testPhone, setTestPhone] = useState('')
  const [whatsappConfig, setWhatsappConfig] = useState({
    provider: 'business',
    apiUrl: '',
    apiKey: '',
    instanceName: '',
    phoneNumberId: '',
    accessToken: '',
    businessAccountId: '',
    connected: false
  })
  const [isTestingConnection, setIsTestingConnection] = useState(false)

  useEffect(() => {
    fetchTemplates()
    fetchWhatsappConfig()
  }, [])

  const fetchWhatsappConfig = async () => {
    try {
      const response = await fetch('/api/settings')
      if (response.ok) {
        const settings = await response.json()
        setWhatsappConfig({
          provider: 'business',
          apiUrl: '',
          apiKey: '',
          instanceName: '',
          phoneNumberId: settings.whatsappPhoneNumberId || '',
          accessToken: settings.whatsappAccessToken || '',
          businessAccountId: settings.whatsappBusinessAccountId || '',
          connected: settings.whatsappConnected || false
        })
      }
    } catch (error) {
      console.error('Erro ao carregar configurações do WhatsApp:', error)
    }
  }

  const handleSaveWhatsappConfig = async () => {
    setIsSaving(true)
    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          whatsappProvider: 'business',
          whatsappPhoneNumberId: whatsappConfig.phoneNumberId,
          whatsappAccessToken: whatsappConfig.accessToken,
          whatsappBusinessAccountId: whatsappConfig.businessAccountId,
          whatsappConnected: whatsappConfig.connected
        })
      })

      if (response.ok) {
        toast.success('Configurações do WhatsApp salvas!')
        fetchWhatsappConfig()
      } else {
        toast.error('Erro ao salvar configurações')
      }
    } catch (error) {
      toast.error('Erro ao salvar configurações')
    } finally {
      setIsSaving(false)
    }
  }

  const handleTestWhatsappConnection = async () => {
    setIsTestingConnection(true)
    try {
      const response = await fetch('/api/chatbot/test-whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(whatsappConfig)
      })

      if (response.ok) {
        const data = await response.json()
        if (data.connected) {
          toast.success('WhatsApp conectado com sucesso!')
          setWhatsappConfig(prev => ({ ...prev, connected: true }))
        } else {
          toast.error(data.message || 'Erro ao conectar WhatsApp')
        }
      } else {
        const error = await response.json()
        toast.error(error.message || 'Erro ao testar conexão')
      }
    } catch (error) {
      toast.error('Erro ao testar conexão do WhatsApp')
    } finally {
      setIsTestingConnection(false)
    }
  }

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/chatbot/templates')
      if (response.ok) {
        const data = await response.json()
        setTemplates(data.length > 0 ? data : defaultTemplates)
      } else {
        // Se não houver templates, usar os padrões
        setTemplates(defaultTemplates)
      }
    } catch (error) {
      console.error('Erro ao carregar templates:', error)
      setTemplates(defaultTemplates)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveTemplate = async (template: ChatbotTemplate) => {
    setIsSaving(true)
    try {
      const url = template.id ? `/api/chatbot/templates/${template.id}` : '/api/chatbot/templates'
      const method = template.id ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(template)
      })

      if (response.ok) {
        toast.success('Template salvo com sucesso!')
        setEditingTemplate(null)
        fetchTemplates()
      } else {
        toast.error('Erro ao salvar template')
      }
    } catch (error) {
      toast.error('Erro ao salvar template')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este template?')) return

    try {
      const response = await fetch(`/api/chatbot/templates/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Template excluído!')
        fetchTemplates()
      } else {
        toast.error('Erro ao excluir template')
      }
    } catch (error) {
      toast.error('Erro ao excluir template')
    }
  }

  const handleToggleActive = async (template: ChatbotTemplate) => {
    const updated = { ...template, isActive: !template.isActive }
    await handleSaveTemplate(updated)
  }

  const handleTestMessage = async (template: ChatbotTemplate) => {
    if (!testPhone) {
      toast.error('Digite um número de telefone para teste')
      return
    }

    try {
      // Se o template não tem id (ainda não foi salvo), usar trigger ou dados diretos
      const requestBody: any = {
        phone: testPhone,
        orderId: 'TEST12345678' // ID de teste
      }

      if (template.id) {
        requestBody.templateId = template.id
      } else if (template.trigger) {
        requestBody.trigger = template.trigger
      } else {
        // Se não tem id nem trigger, enviar dados do template diretamente
        requestBody.templateData = {
          name: template.name,
          trigger: template.trigger,
          message: template.message,
          isActive: template.isActive
        }
      }

      const response = await fetch('/api/chatbot/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      })

      if (response.ok) {
        toast.success('Mensagem de teste enviada!')
      } else {
        const error = await response.json()
        toast.error(error.message || 'Erro ao enviar mensagem de teste')
      }
    } catch (error) {
      toast.error('Erro ao enviar mensagem de teste')
    }
  }

  const replaceVariables = (message: string, order?: any) => {
    let result = message
    result = result.replace(/{customerName}/g, order?.customerName || 'Cliente')
    result = result.replace(/{orderNumber}/g, order?.id?.slice(-8) || '00000000')
    result = result.replace(/{orderTotal}/g, order?.total ? `R$ ${order.total.toFixed(2).replace('.', ',')}` : 'R$ 0,00')
    result = result.replace(/{deliveryType}/g, order?.deliveryType === 'DELIVERY' ? 'Entrega' : 'Retirada')
    result = result.replace(/{estimatedTime}/g, '35-70min')
    result = result.replace(/{deliveryPerson}/g, order?.deliveryPerson || 'Entregador')
    return result
  }

  if (isLoading) {
    return (
      <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.MANAGER]}>
        <DashboardShell>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-red-500 border-t-transparent mx-auto"></div>
            <p className="mt-2 text-sm text-muted-foreground">Carregando templates...</p>
          </div>
        </DashboardShell>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.MANAGER]}>
      <DashboardShell>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Gerenciamento de Chatbot</h1>
              <p className="text-muted-foreground">
                Configure mensagens automáticas para notificar clientes sobre o status dos pedidos
              </p>
            </div>
            <Button
              onClick={() => setEditingTemplate({
                name: '',
                trigger: '',
                message: '',
                isActive: true,
                order: templates.length + 1
              })}
            >
              <Plus className="h-4 w-4 mr-2" />
              Novo Template
            </Button>
          </div>

          {/* Configuração do WhatsApp */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Smartphone className="h-5 w-5 text-green-500" />
                  <div>
                    <CardTitle>Integração WhatsApp</CardTitle>
                    <CardDescription>
                      Configure a conexão com WhatsApp para enviar mensagens automáticas
                    </CardDescription>
                  </div>
                </div>
                <Badge variant={whatsappConfig.connected ? 'default' : 'secondary'} className="flex items-center gap-2">
                  {whatsappConfig.connected ? (
                    <>
                      <CheckCircle className="h-3 w-3" />
                      Conectado
                    </>
                  ) : (
                    <>
                      <XCircle className="h-3 w-3" />
                      Desconectado
                    </>
                  )}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="whatsapp-phone-id">Phone Number ID</Label>
                <Input
                  id="whatsapp-phone-id"
                  value={whatsappConfig.phoneNumberId}
                  onChange={(e) => setWhatsappConfig({ ...whatsappConfig, phoneNumberId: e.target.value })}
                  placeholder="123456789"
                />
              </div>
              <div>
                <Label htmlFor="whatsapp-access-token">Access Token</Label>
                <Input
                  id="whatsapp-access-token"
                  type="password"
                  value={whatsappConfig.accessToken}
                  onChange={(e) => setWhatsappConfig({ ...whatsappConfig, accessToken: e.target.value })}
                  placeholder="Seu Access Token"
                />
              </div>
              <div>
                <Label htmlFor="whatsapp-business-id">Business Account ID</Label>
                <Input
                  id="whatsapp-business-id"
                  value={whatsappConfig.businessAccountId}
                  onChange={(e) => setWhatsappConfig({ ...whatsappConfig, businessAccountId: e.target.value })}
                  placeholder="123456789"
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  onClick={handleTestWhatsappConnection}
                  disabled={isTestingConnection}
                  variant="outline"
                  className="flex-1"
                >
                  <LinkIcon className="h-4 w-4 mr-2" />
                  {isTestingConnection ? 'Testando...' : 'Testar Conexão'}
                </Button>
                <Button
                  onClick={handleSaveWhatsappConfig}
                  disabled={isSaving}
                  className="flex-1"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Configurações
                </Button>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                  📋 Como obter as credenciais do WhatsApp Business API:
                </h4>
                <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
                  <li>Acesse: <a href="https://business.facebook.com" target="_blank" rel="noopener noreferrer" className="underline">business.facebook.com</a></li>
                  <li>Crie um app no <a href="https://developers.facebook.com" target="_blank" rel="noopener noreferrer" className="underline">Meta for Developers</a></li>
                  <li>Adicione o produto &quot;WhatsApp&quot; ao seu app</li>
                  <li>Configure o WhatsApp Business API</li>
                  <li>Copie o <strong>Phone Number ID</strong>, <strong>Access Token</strong> e <strong>Business Account ID</strong></li>
                  <li>Cole as credenciais nos campos acima e clique em &quot;Testar Conexão&quot;</li>
                </ul>
                <p className="text-xs text-blue-700 dark:text-blue-300 mt-3">
                  💡 <strong>Dica:</strong> O processo de aprovação pode levar alguns dias. Enquanto isso, você pode usar o modo de teste.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Variáveis Disponíveis */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Variáveis Disponíveis</CardTitle>
              <CardDescription>
                Use estas variáveis nas mensagens para personalizar o conteúdo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {availableVariables.map((variable) => (
                  <div
                    key={variable.var}
                    className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border"
                  >
                    <code className="text-sm font-mono text-blue-600 dark:text-blue-400">
                      {variable.var}
                    </code>
                    <p className="text-xs text-muted-foreground mt-1">
                      {variable.description}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Lista de Templates */}
          <div className="space-y-4">
            {templates.map((template) => (
              <Card key={template.id || template.trigger}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <MessageSquare className="h-5 w-5 text-blue-500" />
                      <div>
                        <CardTitle className="text-lg">{template.name}</CardTitle>
                        <CardDescription>
                          Trigger: <code className="text-xs">{template.trigger}</code>
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={template.isActive ? 'default' : 'secondary'}>
                        {template.isActive ? 'Ativo' : 'Inativo'}
                      </Badge>
                      <Switch
                        checked={template.isActive}
                        onCheckedChange={() => handleToggleActive(template)}
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {editingTemplate && editingTemplate.id === template.id ? (
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="name">Nome do Template</Label>
                        <Input
                          id="name"
                          value={editingTemplate?.name || ''}
                          onChange={(e) => setEditingTemplate({ ...editingTemplate, name: e.target.value })}
                          placeholder="Ex: Pedido Confirmado"
                        />
                      </div>
                      <div>
                        <Label htmlFor="trigger">Trigger/Evento</Label>
                        <Input
                          id="trigger"
                          value={editingTemplate?.trigger || ''}
                          onChange={(e) => setEditingTemplate({ ...editingTemplate, trigger: e.target.value })}
                          placeholder="Ex: ORDER_CONFIRMED"
                        />
                      </div>
                      <div>
                        <Label htmlFor="message">Mensagem</Label>
                        <Textarea
                          id="message"
                          value={editingTemplate?.message || ''}
                          onChange={(e) => setEditingTemplate({ ...editingTemplate, message: e.target.value })}
                          placeholder="Digite a mensagem aqui..."
                          rows={4}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => editingTemplate && handleSaveTemplate(editingTemplate)}
                          disabled={isSaving || !editingTemplate}
                        >
                          <Save className="h-4 w-4 mr-2" />
                          Salvar
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setEditingTemplate(null)}
                        >
                          <X className="h-4 w-4 mr-2" />
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <p className="text-sm text-muted-foreground mb-2">Preview da mensagem:</p>
                        <p className="text-sm whitespace-pre-wrap">
                          {replaceVariables(template.message)}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingTemplate(template)}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </Button>
                        {template.id && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteTemplate(template.id!)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Excluir
                          </Button>
                        )}
                        <div className="flex-1 flex gap-2">
                          <Input
                            placeholder="Telefone para teste (ex: 5511999999999)"
                            value={testPhone}
                            onChange={(e) => setTestPhone(e.target.value)}
                            className="flex-1"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleTestMessage(template)}
                            disabled={!testPhone}
                          >
                            <TestTube className="h-4 w-4 mr-2" />
                            Testar
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Formulário de Novo Template */}
          {editingTemplate && !editingTemplate.id && (
            <Card>
              <CardHeader>
                <CardTitle>Novo Template</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="new-name">Nome do Template</Label>
                    <Input
                      id="new-name"
                      value={editingTemplate?.name || ''}
                      onChange={(e) => setEditingTemplate({ ...editingTemplate, name: e.target.value })}
                      placeholder="Ex: Pedido Confirmado"
                    />
                  </div>
                  <div>
                    <Label htmlFor="new-trigger">Trigger/Evento</Label>
                    <Input
                      id="new-trigger"
                      value={editingTemplate?.trigger || ''}
                      onChange={(e) => setEditingTemplate({ ...editingTemplate, trigger: e.target.value })}
                      placeholder="Ex: ORDER_CONFIRMED"
                    />
                  </div>
                  <div>
                    <Label htmlFor="new-message">Mensagem</Label>
                    <Textarea
                      id="new-message"
                      value={editingTemplate?.message || ''}
                      onChange={(e) => setEditingTemplate({ ...editingTemplate, message: e.target.value })}
                      placeholder="Digite a mensagem aqui..."
                      rows={4}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => editingTemplate && handleSaveTemplate(editingTemplate)}
                      disabled={isSaving || !editingTemplate?.name || !editingTemplate?.trigger || !editingTemplate?.message}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Salvar
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setEditingTemplate(null)}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancelar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DashboardShell>
    </ProtectedRoute>
  )
}

