'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { ImageUpload } from '@/components/image-upload'
import { Save, Upload, Eye, EyeOff } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface SystemSettings {
  id?: string
  restaurantName: string
  restaurantAddress?: string
  restaurantPhone?: string
  restaurantEmail?: string
  restaurantLogo?: string
  restaurantBanner?: string
  deliveryEstimate?: string
  isOpen: boolean
  openingHours?: string
  ifoodApiKey?: string
  ifoodApiSecret?: string
  printerIp?: string
  printerPort?: string
  autoPrint: boolean
  taxRate: number
  deliveryFee: number
  minOrderValue: number
  autoCloseTime?: string
  autoCloseEnabled: boolean
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<SystemSettings>({
    restaurantName: 'Central Das Pizzas',
    restaurantAddress: '',
    restaurantPhone: '',
    restaurantEmail: '',
    restaurantLogo: '',
    restaurantBanner: '',
    deliveryEstimate: '35 - 70min',
    isOpen: true,
    openingHours: '',
    ifoodApiKey: '',
    ifoodApiSecret: '',
    printerIp: '',
    printerPort: '9100',
    autoPrint: true,
    taxRate: 0,
    deliveryFee: 0,
    minOrderValue: 0,
    autoCloseTime: '23:00',
    autoCloseEnabled: false
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showSecrets, setShowSecrets] = useState(false)

  useEffect(() => {
    fetchSettings()
  }, [])

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

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/settings', {
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
      console.error('Erro ao salvar configurações:', error)
      toast.error('Erro ao salvar configurações')
    } finally {
      setSaving(false)
    }
  }

  const handleImageUpload = async (field: 'restaurantLogo' | 'restaurantBanner', file: File) => {
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
      const response = await fetch('/api/upload', {
        method: 'POST',
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