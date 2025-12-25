'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { ImageUpload } from '@/components/image-upload'
import { Save, Upload, Eye, EyeOff, Usb, Music, X } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { requestSerialPort, getAvailablePorts, getPortInfo, discoverPrinters } from '@/lib/printer-client'

interface SystemSettings {
  id?: string
  restaurantName: string
  restaurantAddress?: string
  restaurantPhone?: string
  restaurantEmail?: string
  restaurantLogo?: string
  restaurantBanner?: string
  profileLogo?: string
  deliveryEstimate?: string
  isOpen: boolean
  openingHours?: string
  ifoodApiKey?: string
  ifoodApiSecret?: string
  printerIp?: string
  printerPort?: string
  printerName?: string
  autoPrint: boolean
  taxRate: number
  deliveryFee: number
  minOrderValue: number
  autoCloseTime?: string
  autoCloseEnabled: boolean
  notificationSound?: string
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<SystemSettings>({
    restaurantName: 'Central Das Pizzas',
    restaurantAddress: '',
    restaurantPhone: '',
    restaurantEmail: '',
    restaurantLogo: '',
    restaurantBanner: '',
    profileLogo: '',
    deliveryEstimate: '35 - 70min',
    isOpen: true,
    openingHours: '',
    ifoodApiKey: '',
    ifoodApiSecret: '',
    printerIp: '',
    printerPort: '9100',
    printerName: '',
    autoPrint: true,
    taxRate: 0,
    deliveryFee: 0,
    minOrderValue: 0,
    autoCloseTime: '23:00',
    autoCloseEnabled: false,
    notificationSound: ''
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showSecrets, setShowSecrets] = useState(false)
  const [availablePorts, setAvailablePorts] = useState<Array<{ port: any; info: ReturnType<typeof getPortInfo> }>>([])

  useEffect(() => {
    fetchSettings()
    loadAvailablePorts()
  }, [])

  const loadAvailablePorts = async () => {
    try {
      const ports = await getAvailablePorts()
      const portsWithInfo = ports.map(port => ({
        port,
        info: getPortInfo(port)
      }))
      setAvailablePorts(portsWithInfo)
    } catch (error) {
      console.error('Erro ao carregar portas disponíveis:', error)
    }
  }

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings')
      if (response.ok) {
        const data = await response.json()
        setSettings(data)
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error)
      toast.error('Erro ao carregar configurações')
    } finally {
      setLoading(false)
    }
  }

  const handleSelectPrinter = async () => {
    try {
      if (!('serial' in navigator)) {
        toast.error('Seu navegador não suporta seleção de impressora USB. Use Chrome ou Edge.')
        return
      }

      // Abrir diálogo para descobrir todas as impressoras disponíveis
      toast.loading('Abrindo seletor de impressoras...', { id: 'printer-select' })
      
      const port = await requestSerialPort()
      
      if (port) {
        // Abrir porta - Elgin i8 usa 9600 baud rate por padrão
        await port.open({ baudRate: 9600 })
        
        // Obter informações da porta
        const portInfo = port.getInfo()
        const portInfoDetails = getPortInfo(port)
        const printerName = portInfoDetails.name || (portInfo.usbVendorId && portInfo.usbProductId 
          ? `Impressora USB (Vendor: 0x${portInfo.usbVendorId.toString(16).toUpperCase().padStart(4, '0')}, Product: 0x${portInfo.usbProductId.toString(16).toUpperCase().padStart(4, '0')})`
          : 'Impressora USB Selecionada')
        
        // Atualizar estado
        setSettings(prev => ({
          ...prev,
          printerName: printerName
        }))

        // Salvar nas configurações
        const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null
        const headers: HeadersInit = { 'Content-Type': 'application/json' }
        if (token) {
          headers['Authorization'] = `Bearer ${token}`
        }

        const response = await fetch('/api/settings', {
          method: 'PUT',
          headers,
          body: JSON.stringify({
            ...settings,
            printerName: printerName,
            printerSerialPort: JSON.stringify({
              vendorId: portInfo.usbVendorId,
              productId: portInfo.usbProductId
            })
          })
        })

        if (response.ok) {
          toast.success('Impressora selecionada e salva com sucesso!', { id: 'printer-select' })
          // Atualizar lista de portas disponíveis
          await loadAvailablePorts()
        } else {
          const errorData = await response.json()
          toast.error(errorData.message || 'Erro ao salvar impressora', { id: 'printer-select' })
        }
      }
    } catch (error: any) {
      toast.dismiss('printer-select')
      if (error.name === 'NotFoundError') {
        toast.error('Nenhuma impressora selecionada')
      } else if (error.name === 'SecurityError') {
        toast.error('Permissão negada. Permita o acesso à impressora.')
      } else {
        console.error('Erro ao selecionar impressora:', error)
        toast.error('Erro ao selecionar impressora: ' + (error.message || 'Erro desconhecido'))
      }
    }
  }

  const handleConnectToPort = async (port: any) => {
    try {
      // Abrir porta se não estiver aberta - Elgin i8 usa 9600 baud rate
      if (!port.readable || !port.writable) {
        await port.open({ baudRate: 9600 })
      }
      
      const portInfo = getPortInfo(port)
      const printerName = portInfo.name || 'Impressora USB'
      
      // Atualizar estado
      setSettings(prev => ({
        ...prev,
        printerName: printerName
      }))

      // Salvar nas configurações
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null
      const headers: HeadersInit = { 'Content-Type': 'application/json' }
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          ...settings,
          printerName: printerName,
          printerSerialPort: JSON.stringify({
            vendorId: portInfo.vendorId,
            productId: portInfo.productId
          })
        })
      })

      if (response.ok) {
        toast.success('Conectado à impressora com sucesso!')
        await loadAvailablePorts()
      }
    } catch (error: any) {
      toast.error(error.message || 'Erro ao conectar à impressora')
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      }
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers,
        body: JSON.stringify(settings),
      })

      if (response.ok) {
        toast.success('Configurações salvas com sucesso!')
      } else {
        toast.error('Erro ao salvar configurações')
      }
    } catch (error) {
      console.error('Erro ao salvar configurações:', error)
      toast.error('Erro ao salvar configurações')
    } finally {
      setSaving(false)
    }
  }

  const handleSoundUpload = async (file: File | null) => {
    if (!file) {
      // Remover som
      setSettings(prev => ({
        ...prev,
        notificationSound: ''
      }))
      return
    }

    try {
      toast.loading('Enviando arquivo de som...', { id: 'sound-upload' })
      
      // Criar FormData para enviar o arquivo
      const formData = new FormData()
      formData.append('image', file) // API usa 'image' mas aceita MP3 agora
      formData.append('field', 'notificationSound')

      // Fazer upload para o servidor
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null
      const headers: HeadersInit = {}
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const response = await fetch('/api/upload', {
        method: 'POST',
        headers,
        body: formData
      })

      if (response.ok) {
        const data = await response.json()
        // Atualizar o estado com a URL retornada
        setSettings(prev => ({
          ...prev,
          notificationSound: data.url
        }))
        toast.success('Arquivo de som enviado com sucesso!', { id: 'sound-upload' })
        
        // Salvar nas configurações
        const saveResponse = await fetch('/api/settings', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          },
          body: JSON.stringify({
            ...settings,
            notificationSound: data.url
          })
        })
        
        if (saveResponse.ok) {
          toast.success('Som de notificação salvo!', { id: 'sound-upload' })
        }
      } else {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Erro ao fazer upload do arquivo')
      }
    } catch (error: any) {
      console.error('Erro ao fazer upload:', error)
      toast.error(error.message || 'Erro ao enviar arquivo de som.', { id: 'sound-upload' })
      
      // Fallback: usar base64 local
      if (file) {
        const reader = new FileReader()
        reader.onload = (e) => {
          const url = e.target?.result as string
          setSettings(prev => ({
            ...prev,
            notificationSound: url
          }))
        }
        reader.readAsDataURL(file)
      }
    }
  }

  const handleImageUpload = async (field: 'restaurantLogo' | 'restaurantBanner' | 'profileLogo', file: File) => {
    // Verificar se é um arquivo vazio (removido)
    if (file.size === 0) {
      setSettings(prev => ({
        ...prev,
        [field]: ''
      }))
      return
    }

    try {
      // Criar FormData para enviar o arquivo
      const formData = new FormData()
      formData.append('image', file)
      formData.append('field', field)

      // Fazer upload para o servidor
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null
      const headers: HeadersInit = {}
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const response = await fetch('/api/upload', {
        method: 'POST',
        headers,
        body: formData
      })

      if (response.ok) {
        const data = await response.json()
        // Atualizar o estado com a URL retornada
        setSettings(prev => ({
          ...prev,
          [field]: data.url
        }))
        toast.success('Imagem enviada com sucesso!')
      } else {
        throw new Error('Erro ao fazer upload da imagem')
      }
    } catch (error) {
      console.error('Erro ao fazer upload:', error)
      toast.error('Erro ao enviar imagem. Usando preview local.')
      
      // Fallback: usar base64 local
      const reader = new FileReader()
      reader.onload = (e) => {
        const url = e.target?.result as string
        setSettings(prev => ({
          ...prev,
          [field]: url
        }))
      }
      reader.readAsDataURL(file)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-red-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando configurações...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Configurações da Loja</h1>
          <p className="text-gray-600 mt-2">
            Gerencie as informações da sua loja, horários e configurações do sistema
          </p>
        </div>

        <div className="space-y-6">
          {/* Informações Básicas */}
          <Card>
            <CardHeader>
              <CardTitle>Informações Básicas</CardTitle>
              <CardDescription>
                Configure o nome, endereço e informações de contato da sua loja
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="restaurantName">Nome da Loja</Label>
                  <Input
                    id="restaurantName"
                    value={settings.restaurantName}
                    onChange={(e) => setSettings(prev => ({ ...prev, restaurantName: e.target.value }))}
                    placeholder="Ex: Central Das Pizzas"
                  />
                </div>
                <div>
                  <Label htmlFor="restaurantPhone">Telefone</Label>
                  <Input
                    id="restaurantPhone"
                    value={settings.restaurantPhone || ''}
                    onChange={(e) => setSettings(prev => ({ ...prev, restaurantPhone: e.target.value }))}
                    placeholder="(11) 99999-9999"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="restaurantAddress">Endereço</Label>
                <Input
                  id="restaurantAddress"
                  value={settings.restaurantAddress || ''}
                  onChange={(e) => setSettings(prev => ({ ...prev, restaurantAddress: e.target.value }))}
                  placeholder="Rua, número, bairro, cidade"
                />
              </div>

              <div>
                <Label htmlFor="restaurantEmail">E-mail</Label>
                <Input
                  id="restaurantEmail"
                  type="email"
                  value={settings.restaurantEmail || ''}
                  onChange={(e) => setSettings(prev => ({ ...prev, restaurantEmail: e.target.value }))}
                  placeholder="contato@centraldaspizzas.com"
                />
              </div>
            </CardContent>
          </Card>

          {/* Visual da Loja */}
          <Card>
            <CardHeader>
              <CardTitle>Visual da Loja</CardTitle>
              <CardDescription>
                Configure a logo e banner da sua loja para o cardápio online
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label>Logo da Loja</Label>
                <div className="mt-2">
                  <ImageUpload
                    onImageSelect={(file) => handleImageUpload('restaurantLogo', file)}
                    currentImage={settings.restaurantLogo}
                  />
                </div>
              </div>

              <div>
                <Label>Banner da Loja</Label>
                <div className="mt-2">
                  <ImageUpload
                    onImageSelect={(file) => handleImageUpload('restaurantBanner', file)}
                    currentImage={settings.restaurantBanner}
                  />
                </div>
              </div>

              <div>
                <Label>Logo do Perfil (Site)</Label>
                <p className="text-sm text-gray-600 mb-2">
                  Logo que será exibida na parte inferior esquerda do site
                </p>
                <div className="mt-2">
                  <ImageUpload
                    onImageSelect={(file) => handleImageUpload('profileLogo', file)}
                    currentImage={settings.profileLogo}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Horários e Status */}
          <Card>
            <CardHeader>
              <CardTitle>Horários e Status</CardTitle>
              <CardDescription>
                Configure os horários de funcionamento e status da loja
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="isOpen">Loja Aberta</Label>
                  <p className="text-sm text-gray-500">Marque se a loja está funcionando</p>
                </div>
                <Switch
                  id="isOpen"
                  checked={settings.isOpen}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, isOpen: checked }))}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="deliveryEstimate">Estimativa de Entrega</Label>
                  <Input
                    id="deliveryEstimate"
                    value={settings.deliveryEstimate || ''}
                    onChange={(e) => setSettings(prev => ({ ...prev, deliveryEstimate: e.target.value }))}
                    placeholder="Ex: 35 - 70min"
                  />
                </div>
                <div>
                  <Label htmlFor="openingHours">Horário de Funcionamento</Label>
                  <Input
                    id="openingHours"
                    value={settings.openingHours || ''}
                    onChange={(e) => setSettings(prev => ({ ...prev, openingHours: e.target.value }))}
                    placeholder="Ex: Seg-Sex: 18h-23h, Sáb-Dom: 17h-24h"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Configurações de Delivery */}
          <Card>
            <CardHeader>
              <CardTitle>Configurações de Delivery</CardTitle>
              <CardDescription>
                Configure taxas e valores mínimos para pedidos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="deliveryFee">Taxa de Entrega (R$)</Label>
                  <Input
                    id="deliveryFee"
                    type="number"
                    step="0.01"
                    value={settings.deliveryFee}
                    onChange={(e) => setSettings(prev => ({ ...prev, deliveryFee: parseFloat(e.target.value) || 0 }))}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label htmlFor="minOrderValue">Valor Mínimo (R$)</Label>
                  <Input
                    id="minOrderValue"
                    type="number"
                    step="0.01"
                    value={settings.minOrderValue}
                    onChange={(e) => setSettings(prev => ({ ...prev, minOrderValue: parseFloat(e.target.value) || 0 }))}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label htmlFor="taxRate">Taxa de Serviço (%)</Label>
                  <Input
                    id="taxRate"
                    type="number"
                    step="0.01"
                    value={settings.taxRate}
                    onChange={(e) => setSettings(prev => ({ ...prev, taxRate: parseFloat(e.target.value) || 0 }))}
                    placeholder="0.00"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Integração iFood */}
          <Card>
            <CardHeader>
              <CardTitle>Integração iFood</CardTitle>
              <CardDescription>
                Configure as credenciais da API do iFood para sincronização
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
                <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                  📋 Como obter as credenciais do iFood:
                </h4>
                <ol className="text-sm text-blue-800 dark:text-blue-200 space-y-2 list-decimal list-inside">
                  <li>Acesse o <strong>Painel do Parceiro iFood</strong>: <a href="https://parceiro.ifood.com.br" target="_blank" rel="noopener noreferrer" className="underline">parceiro.ifood.com.br</a></li>
                  <li>Faça login com suas credenciais de restaurante parceiro</li>
                  <li>Vá em <strong>Configurações</strong> → <strong>Integrações</strong> → <strong>API</strong></li>
                  <li>Clique em <strong>&quot;Gerar Credenciais&quot;</strong> ou <strong>&quot;Criar Aplicação&quot;</strong></li>
                  <li>Copie a <strong>API Key</strong> e o <strong>API Secret</strong> gerados</li>
                  <li>Cole as credenciais nos campos abaixo e salve</li>
                </ol>
                <p className="text-xs text-blue-700 dark:text-blue-300 mt-3">
                  💡 <strong>Dica:</strong> Se não encontrar a opção de API, entre em contato com o suporte do iFood para ativar a integração via API.
                </p>
              </div>
              <div>
                <Label htmlFor="ifoodApiKey">API Key</Label>
                <Input
                  id="ifoodApiKey"
                  type={showSecrets ? "text" : "password"}
                  value={settings.ifoodApiKey || ''}
                  onChange={(e) => setSettings(prev => ({ ...prev, ifoodApiKey: e.target.value }))}
                  placeholder="Sua API Key do iFood"
                />
              </div>
              <div>
                <Label htmlFor="ifoodApiSecret">API Secret</Label>
                <Input
                  id="ifoodApiSecret"
                  type={showSecrets ? "text" : "password"}
                  value={settings.ifoodApiSecret || ''}
                  onChange={(e) => setSettings(prev => ({ ...prev, ifoodApiSecret: e.target.value }))}
                  placeholder="Seu API Secret do iFood"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSecrets(!showSecrets)}
                >
                  {showSecrets ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  {showSecrets ? 'Ocultar' : 'Mostrar'} credenciais
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Configurações de Impressão */}
          <Card>
            <CardHeader>
              <CardTitle>Configurações de Impressão</CardTitle>
              <CardDescription>
                Configure a impressora para impressão automática de pedidos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="autoPrint">Impressão Automática</Label>
                  <p className="text-sm text-gray-500">Imprimir pedidos automaticamente</p>
                </div>
                <Switch
                  id="autoPrint"
                  checked={settings.autoPrint}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, autoPrint: checked }))}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="printerIp">IP da Impressora</Label>
                  <Input
                    id="printerIp"
                    value={settings.printerIp || ''}
                    onChange={(e) => setSettings(prev => ({ ...prev, printerIp: e.target.value }))}
                    placeholder="192.168.1.100"
                  />
                </div>
                <div>
                  <Label htmlFor="printerPort">Porta da Impressora</Label>
                  <Input
                    id="printerPort"
                    value={settings.printerPort || ''}
                    onChange={(e) => setSettings(prev => ({ ...prev, printerPort: e.target.value }))}
                    placeholder="9100"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="printerName">Selecionar Impressora USB</Label>
                  <p className="text-sm text-gray-500 mb-2">
                    Clique em &quot;Descobrir Impressoras&quot; para ver todas as impressoras USB conectadas ao dispositivo
                  </p>
                  <div className="flex gap-2 mt-1">
                    <Input
                      id="printerName"
                      value={settings.printerName || ''}
                      onChange={(e) => setSettings(prev => ({ ...prev, printerName: e.target.value }))}
                      placeholder="Nenhuma impressora selecionada"
                      readOnly
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      onClick={handleSelectPrinter}
                      disabled={!('serial' in navigator)}
                      variant="default"
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Usb className="h-4 w-4 mr-2" />
                      Descobrir Impressoras
                    </Button>
                    <Button
                      type="button"
                      onClick={loadAvailablePorts}
                      disabled={!('serial' in navigator)}
                      variant="outline"
                      title="Atualizar lista de portas já autorizadas"
                    >
                      Atualizar
                    </Button>
                  </div>
                  {availablePorts.length > 0 && (
                    <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <p className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
                        Portas USB Disponíveis:
                      </p>
                      <div className="space-y-2">
                        {availablePorts.map((portItem, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded border"
                          >
                            <div className="flex-1">
                              <p className="text-sm font-medium">
                                {portItem.info.name || `Porta USB ${index + 1}`}
                              </p>
                              {portItem.info.vendorId && portItem.info.productId && (
                                <p className="text-xs text-gray-500">
                                  Vendor: 0x{portItem.info.vendorId?.toString(16).toUpperCase().padStart(4, '0')} | 
                                  Product: 0x{portItem.info.productId?.toString(16).toUpperCase().padStart(4, '0')}
                                </p>
                              )}
                            </div>
                            <Button
                              onClick={() => handleConnectToPort(portItem.port)}
                              size="sm"
                              variant="outline"
                            >
                              Conectar
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    {('serial' in navigator) 
                      ? 'Clique em &quot;Selecionar&quot; para escolher a impressora USB conectada ou conecte-se a uma porta já autorizada acima'
                      : '⚠️ Use Chrome ou Edge para selecionar impressora USB'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Configurações de Notificação */}
          <Card>
            <CardHeader>
              <CardTitle>Som de Notificação de Pedidos</CardTitle>
              <CardDescription>
                Configure um som para ser reproduzido quando houver um novo pedido
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="notificationSound">Arquivo de Som (MP3)</Label>
                <p className="text-sm text-gray-600 mb-2">
                  Faça upload de um arquivo MP3 que será reproduzido sempre que houver um novo pedido
                </p>
                
                {settings.notificationSound ? (
                  <div className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
                    <div className="flex items-center space-x-3">
                      <Music className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="text-sm font-medium">Som configurado</p>
                        <p className="text-xs text-gray-500">Arquivo MP3 carregado</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <audio controls className="h-8">
                        <source src={settings.notificationSound} type="audio/mpeg" />
                        Seu navegador não suporta o elemento de áudio.
                      </audio>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleSoundUpload(null)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                    <div className="text-center">
                      <Music className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-sm text-gray-600 mb-4">
                        Nenhum som configurado
                      </p>
                      <input
                        type="file"
                        accept="audio/mpeg,audio/mp3,.mp3"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            handleSoundUpload(file)
                          }
                        }}
                        className="hidden"
                        id="sound-upload-input"
                      />
                      <label htmlFor="sound-upload-input">
                        <Button
                          type="button"
                          variant="outline"
                          className="cursor-pointer"
                          asChild
                        >
                          <span>
                            <Upload className="h-4 w-4 mr-2" />
                            Selecionar Arquivo MP3
                          </span>
                        </Button>
                      </label>
                      <p className="text-xs text-gray-500 mt-2">
                        Máximo 10MB
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Botão Salvar */}
          <div className="flex justify-end">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-red-500 hover:bg-red-600"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Configurações
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}