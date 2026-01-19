'use client'

import { useState, useEffect } from 'react'
import { Volume2, VolumeX, CheckCircle, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useContinuousSound } from '@/hooks/useContinuousSound'

interface OrderSoundAlertProps {
  orderId: string
  orderNumber: string
  total: number
  soundUrl?: string
  onAccept: () => void
  isAccepting?: boolean
  pendingCount?: number
}

export function OrderSoundAlert({
  orderId,
  orderNumber,
  total,
  soundUrl,
  onAccept,
  isAccepting = false,
  pendingCount = 1
}: OrderSoundAlertProps) {
  const [showAlert, setShowAlert] = useState(true)
  const { toggleSound, soundEnabled } = useContinuousSound({
    soundUrl: soundUrl || '/sounds/notification.mp3',
    isActive: showAlert,
    volume: 1.0,
    interval: 2500 // Som a cada 2.5 segundos
  })

  if (!showAlert) {
    return null
  }

  const handleAccept = async () => {
    setShowAlert(false)
    await onAccept()
  }

  return (
    <div className="fixed top-4 right-4 z-50">
      <div className={`
        animate-pulse rounded-lg shadow-2xl p-4 max-w-md
        ${soundEnabled 
          ? 'bg-red-500 border-2 border-red-700' 
          : 'bg-yellow-500 border-2 border-yellow-700'
        }
      `}>
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-2">
            {soundEnabled && (
              <div className="animate-bounce">
                <Volume2 className="w-6 h-6 text-white" />
              </div>
            )}
            {!soundEnabled && (
              <VolumeX className="w-6 h-6 text-white" />
            )}
            <div>
              <h3 className="text-white font-bold text-lg">
                ⏰ NOVO PEDIDO!
              </h3>
              <p className="text-white text-sm opacity-90">
                {pendingCount > 1 && `${pendingCount} pedidos pendentes`}
              </p>
            </div>
          </div>
          <Badge className="bg-white text-red-600 font-bold animate-bounce">
            {orderNumber}
          </Badge>
        </div>

        <div className="bg-white/20 rounded p-3 mb-3 backdrop-blur">
          <p className="text-white text-sm mb-2">
            <strong>Valor:</strong> {new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL'
            }).format(total)}
          </p>
          <p className="text-white text-xs opacity-90">
            Clique em ACEITAR para parar o alarme
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={handleAccept}
            disabled={isAccepting}
            className="flex-1 bg-white text-red-600 hover:bg-green-400 hover:text-white font-bold"
          >
            {isAccepting ? (
              <>
                <Clock className="w-4 h-4 mr-2 animate-spin" />
                Processando...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                ACEITAR
              </>
            )}
          </Button>
          <Button
            onClick={toggleSound}
            variant="outline"
            className="bg-white/30 text-white border-white hover:bg-white/50"
            size="sm"
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4" />
            ) : (
              <VolumeX className="w-4 h-4" />
            )}
          </Button>
          <Button
            onClick={() => setShowAlert(false)}
            variant="outline"
            className="bg-white/30 text-white border-white hover:bg-white/50"
            size="sm"
          >
            ✕
          </Button>
        </div>

        {soundEnabled && (
          <p className="text-white text-xs mt-3 text-center opacity-90 animate-pulse">
            🔊 Som toque a cada 2.5 segundos
          </p>
        )}
      </div>
    </div>
  )
}
