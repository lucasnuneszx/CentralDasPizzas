'use client'

import { useState, useEffect } from 'react'
import { Bell, X, CheckCircle, XCircle, Printer, Smartphone, Store } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import toast from 'react-hot-toast'

interface Notification {
  id: string
  type: 'NEW_ORDER' | 'ORDER_UPDATE' | 'SYSTEM'
  source: 'IFOOD' | 'SYSTEM'
  title: string
  message: string
  orderId?: string
  timestamp: string
  read: boolean
  logo?: string
}

interface NotificationCenterProps {
  isOpen: boolean
  onClose: () => void
}

export function NotificationCenter({ isOpen, onClose }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      fetchNotifications()
      // Polling para novas notificações
      const interval = setInterval(fetchNotifications, 5000)
      return () => clearInterval(interval)
    }
  }, [isOpen])

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/notifications')
      const data = await response.json()
      setNotifications(data)
    } catch (error) {
      console.error('Erro ao buscar notificações:', error)
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PUT'
      })
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      )
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error)
    }
  }

  const handleOrderAction = async (orderId: string, action: 'ACCEPT' | 'REJECT' | 'PRINT') => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/orders/${orderId}/${action.toLowerCase()}`, {
        method: 'POST'
      })

      if (response.ok) {
        toast.success(`Pedido ${action === 'ACCEPT' ? 'aceito' : action === 'REJECT' ? 'rejeitado' : 'impresso'}!`)
        fetchNotifications()
      } else {
        toast.error('Erro ao processar pedido')
      }
    } catch (error) {
      toast.error('Erro ao processar pedido')
    } finally {
      setIsLoading(false)
    }
  }

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'IFOOD':
        return <Smartphone className="w-5 h-5 text-orange-500" />
      case 'SYSTEM':
        return <Store className="w-5 h-5 text-blue-500" />
      default:
        return <Bell className="w-5 h-5 text-gray-500" />
    }
  }

  const getSourceLogo = (source: string): string | undefined => {
    switch (source) {
      case 'IFOOD':
        return '/images/ifood-logo.png' // Logo do iFood
      case 'SYSTEM':
        return '/images/store-logo.png' // Logo da loja (configurável)
      default:
        return undefined
    }
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Agora'
    if (diffInMinutes < 60) return `${diffInMinutes}min atrás`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h atrás`
    return date.toLocaleDateString('pt-BR')
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[80vh] overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle className="flex items-center">
              <Bell className="w-5 h-5 mr-2" />
              Notificações
            </CardTitle>
            <CardDescription>
              Novos pedidos e atualizações do sistema
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="overflow-y-auto max-h-[60vh]">
          {notifications.length === 0 ? (
            <div className="text-center py-8">
              <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Nenhuma notificação</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 rounded-lg border ${
                    notification.read ? 'bg-gray-50' : 'bg-blue-50 border-blue-200'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    {/* Logo da fonte */}
                    <div className="flex-shrink-0">
                      {(() => {
                        const logo = getSourceLogo(notification.source)
                        return logo ? (
                          <img
                            src={logo}
                            alt={notification.source}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                            {getSourceIcon(notification.source)}
                          </div>
                        )
                      })()}
                    </div>

                    {/* Conteúdo da notificação */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-gray-900">
                          {notification.title}
                        </h4>
                        <span className="text-xs text-gray-500">
                          {formatTimestamp(notification.timestamp)}
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-600 mt-1">
                        {notification.message}
                      </p>

                      {/* Ações para pedidos */}
                      {notification.type === 'NEW_ORDER' && notification.orderId && (
                        <div className="flex space-x-2 mt-3">
                          <Button
                            size="sm"
                            onClick={() => handleOrderAction(notification.orderId!, 'ACCEPT')}
                            disabled={isLoading}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Aceitar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOrderAction(notification.orderId!, 'PRINT')}
                            disabled={isLoading}
                          >
                            <Printer className="w-4 h-4 mr-1" />
                            Imprimir
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOrderAction(notification.orderId!, 'REJECT')}
                            disabled={isLoading}
                            className="text-red-600 border-red-300 hover:bg-red-50"
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Negar
                          </Button>
                        </div>
                      )}

                      {/* Botão para marcar como lida */}
                      {!notification.read && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => markAsRead(notification.id)}
                          className="mt-2 text-xs"
                        >
                          Marcar como lida
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
