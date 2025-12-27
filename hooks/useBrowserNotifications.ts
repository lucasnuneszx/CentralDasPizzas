import { useEffect, useRef, useState } from 'react'

interface NotificationOptions {
  title: string
  message: string
  icon?: string
  badge?: string
  tag?: string
  data?: any
  requireInteraction?: boolean
}

/**
 * Hook para gerenciar notificações do navegador (Web Notifications API)
 * Funciona tanto no sistema quanto no PC
 */
export function useBrowserNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [isSupported, setIsSupported] = useState(false)
  const notificationRef = useRef<Notification | null>(null)

  useEffect(() => {
    // Verificar se o navegador suporta notificações
    if ('Notification' in window) {
      setIsSupported(true)
      setPermission(Notification.permission)

      // Se a permissão ainda não foi solicitada ou foi negada, tentar solicitar
      if (Notification.permission === 'default') {
        requestPermission()
      }
    } else {
      console.warn('⚠️ Este navegador não suporta notificações do sistema')
      setIsSupported(false)
    }
  }, [])

  /**
   * Solicitar permissão para mostrar notificações
   */
  const requestPermission = async () => {
    if (!('Notification' in window)) {
      console.warn('Notificações não são suportadas neste navegador')
      return false
    }

    try {
      const result = await Notification.requestPermission()
      setPermission(result)
      
      if (result === 'granted') {
        console.log('✅ Permissão para notificações concedida')
        return true
      } else if (result === 'denied') {
        console.warn('⚠️ Permissão para notificações negada pelo usuário')
        return false
      } else {
        console.warn('⚠️ Permissão para notificações ainda não foi decidida')
        return false
      }
    } catch (error) {
      console.error('Erro ao solicitar permissão de notificações:', error)
      return false
    }
  }

  /**
   * Mostrar notificação do navegador
   */
  const showNotification = (options: NotificationOptions) => {
    if (!isSupported) {
      console.warn('Notificações não são suportadas')
      return null
    }

    // Se não tiver permissão, tentar solicitar
    if (permission !== 'granted') {
      console.warn('Permissão para notificações não concedida. Tentando solicitar...')
      requestPermission().then(hasPermission => {
        if (hasPermission) {
          createNotification(options)
        }
      })
      return null
    }

    return createNotification(options)
  }

  /**
   * Criar e exibir a notificação
   */
  const createNotification = (options: NotificationOptions): Notification | null => {
    try {
      // Fechar notificação anterior se existir (para evitar múltiplas notificações)
      if (notificationRef.current) {
        notificationRef.current.close()
      }

      const notification = new Notification(options.title, {
        body: options.message,
        icon: options.icon || '/favicon.ico',
        badge: options.badge || '/favicon.ico',
        tag: options.tag || 'new-order',
        data: options.data,
        requireInteraction: options.requireInteraction || false,
      })

      // Fechar automaticamente após 5 segundos
      setTimeout(() => {
        notification.close()
      }, 5000)

      // Adicionar evento de clique para focar na janela
      notification.onclick = () => {
        window.focus()
        notification.close()
      }

      notificationRef.current = notification
      return notification
    } catch (error) {
      console.error('Erro ao criar notificação:', error)
      return null
    }
  }

  /**
   * Notificar sobre novo pedido
   */
  const notifyNewOrder = (orderNumber: string, total: number, orderId?: string) => {
    const title = '🍕 Novo Pedido Recebido!'
    const message = `Pedido #${orderNumber} - Total: R$ ${total.toFixed(2).replace('.', ',')}`
    
    return showNotification({
      title,
      message,
      tag: `order-${orderId || orderNumber}`,
      data: { orderId, orderNumber },
      requireInteraction: true, // Manter notificação até o usuário interagir
    })
  }

  /**
   * Fechar notificação atual
   */
  const closeNotification = () => {
    if (notificationRef.current) {
      notificationRef.current.close()
      notificationRef.current = null
    }
  }

  return {
    isSupported,
    permission,
    requestPermission,
    showNotification,
    notifyNewOrder,
    closeNotification,
  }
}

