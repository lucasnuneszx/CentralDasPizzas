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
      const currentPermission = Notification.permission
      setPermission(currentPermission)
      console.log('🔔 Status de notificações:', {
        suportado: true,
        permissao: currentPermission
      })

      // Se a permissão ainda não foi solicitada, tentar solicitar
      if (currentPermission === 'default') {
        console.log('🔔 Solicitando permissão para notificações...')
        requestPermission()
      } else if (currentPermission === 'granted') {
        console.log('✅ Permissão para notificações já concedida')
      } else {
        console.warn('⚠️ Permissão para notificações negada. O usuário precisa permitir manualmente nas configurações do navegador.')
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
    // Verificar suporte diretamente (não confiar apenas no estado)
    if (!('Notification' in window)) {
      console.warn('⚠️ Notificações não são suportadas neste navegador')
      return null
    }

    // Verificar permissão diretamente (não confiar apenas no estado)
    const currentPermission = Notification.permission
    if (currentPermission !== 'granted') {
      console.warn('⚠️ Permissão para notificações não concedida. Status:', currentPermission)
      // Tentar solicitar se ainda não foi decidido
      if (currentPermission === 'default') {
        requestPermission().then(hasPermission => {
          if (hasPermission) {
            createNotification(options)
          }
        })
      }
      return null
    }

    return createNotification(options)
  }

  /**
   * Criar e exibir a notificação
   */
  const createNotification = (options: NotificationOptions): Notification | null => {
    try {
      // Verificar suporte e permissão novamente antes de criar
      if (!('Notification' in window)) {
        console.warn('⚠️ Notificações não são suportadas neste navegador')
        return null
      }

      if (Notification.permission !== 'granted') {
        console.warn('⚠️ Permissão não concedida. Status atual:', Notification.permission)
        return null
      }

      // Fechar notificação anterior se existir (para evitar múltiplas notificações)
      if (notificationRef.current) {
        notificationRef.current.close()
      }

      console.log('🔔 Criando notificação:', {
        title: options.title,
        message: options.message,
        tag: options.tag
      })

      const notification = new Notification(options.title, {
        body: options.message,
        icon: options.icon || '/favicon.ico',
        badge: options.badge || '/favicon.ico',
        tag: options.tag || 'new-order',
        data: options.data,
        requireInteraction: options.requireInteraction || false,
      })

      console.log('✅ Notificação criada com sucesso')

      // Fechar automaticamente após 10 segundos (aumentado de 5 para 10)
      setTimeout(() => {
        if (notification) {
          notification.close()
          console.log('🔔 Notificação fechada automaticamente após 10 segundos')
        }
      }, 10000)

      // Adicionar evento de clique para focar na janela
      notification.onclick = () => {
        console.log('🔔 Notificação clicada, focando janela')
        window.focus()
        notification.close()
      }

      // Adicionar eventos de erro
      notification.onerror = (error) => {
        console.error('❌ Erro na notificação:', error)
      }

      notificationRef.current = notification
      return notification
    } catch (error) {
      console.error('❌ Erro ao criar notificação:', error)
      return null
    }
  }

  /**
   * Notificar sobre novo pedido
   */
  const notifyNewOrder = (orderNumber: string, total: number, orderId?: string) => {
    // Verificar suporte e permissão diretamente no window (não confiar no estado)
    const hasSupport = 'Notification' in window
    const currentPermission = hasSupport ? Notification.permission : 'denied'
    
    console.log('🔔 Tentando mostrar notificação para novo pedido:', {
      orderNumber,
      total,
      orderId,
      hasSupport,
      currentPermission,
      permissionState: permission,
      isSupportedState: isSupported
    })
    
    if (!hasSupport) {
      console.error('❌ Notificações não são suportadas neste navegador')
      return null
    }
    
    if (currentPermission !== 'granted') {
      console.warn('⚠️ Permissão não concedida. Status:', currentPermission)
      // Tentar solicitar se ainda não foi decidido
      if (currentPermission === 'default') {
        requestPermission().then(hasPermission => {
          if (hasPermission) {
            const title = '🍕 Novo Pedido Recebido!'
            const message = `Pedido #${orderNumber} - Total: R$ ${total.toFixed(2).replace('.', ',')}`
            showNotification({
              title,
              message,
              tag: `order-${orderId || orderNumber}`,
              data: { orderId, orderNumber },
              requireInteraction: true,
            })
          }
        })
      }
      return null
    }
    
    const title = '🍕 Novo Pedido Recebido!'
    const message = `Pedido #${orderNumber} - Total: R$ ${total.toFixed(2).replace('.', ',')}`
    
    const result = showNotification({
      title,
      message,
      tag: `order-${orderId || orderNumber}`,
      data: { orderId, orderNumber },
      requireInteraction: true, // Manter notificação até o usuário interagir
    })
    
    if (result) {
      console.log('✅ Notificação exibida com sucesso')
    } else {
      console.warn('⚠️ Não foi possível exibir a notificação. Verifique a permissão do navegador.')
    }
    
    return result
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

