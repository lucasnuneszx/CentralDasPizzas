'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export function BrowserCompatibilityCheck() {
  const [isOldBrowser, setIsOldBrowser] = useState(false)
  const [browserInfo, setBrowserInfo] = useState<{ name: string; version: string } | null>(null)

  useEffect(() => {
    // Detectar navegador antigo
    const userAgent = navigator.userAgent
    let browserName = 'Desconhecido'
    let browserVersion = '0'
    let isOld = false

    // Detectar Chrome
    if (userAgent.includes('Chrome') && !userAgent.includes('Edge')) {
      const match = userAgent.match(/Chrome\/(\d+)/)
      if (match) {
        browserName = 'Chrome'
        browserVersion = match[1]
        // Chrome versão < 90 é considerado antigo
        if (parseInt(match[1]) < 90) {
          isOld = true
        }
      }
    }
    // Detectar Firefox
    else if (userAgent.includes('Firefox')) {
      const match = userAgent.match(/Firefox\/(\d+)/)
      if (match) {
        browserName = 'Firefox'
        browserVersion = match[1]
        // Firefox versão < 88 é considerado antigo
        if (parseInt(match[1]) < 88) {
          isOld = true
        }
      }
    }
    // Detectar Edge
    else if (userAgent.includes('Edge')) {
      const match = userAgent.match(/Edge\/(\d+)/)
      if (match) {
        browserName = 'Edge'
        browserVersion = match[1]
        if (parseInt(match[1]) < 90) {
          isOld = true
        }
      }
    }
    // Detectar Safari
    else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
      const match = userAgent.match(/Version\/(\d+)/)
      if (match) {
        browserName = 'Safari'
        browserVersion = match[1]
        if (parseInt(match[1]) < 14) {
          isOld = true
        }
      }
    }
    // Detectar Internet Explorer
    else if (userAgent.includes('MSIE') || userAgent.includes('Trident')) {
      browserName = 'Internet Explorer'
      browserVersion = 'Antigo'
      isOld = true
    }

    // Verificar suporte a recursos modernos
    if (!isOld) {
      // Verificar se tem suporte a fetch API (básico)
      if (typeof fetch === 'undefined') {
        isOld = true
      }
      // Verificar se tem suporte a Promise
      if (typeof Promise === 'undefined') {
        isOld = true
      }
    }

    setIsOldBrowser(isOld)
    setBrowserInfo({ name: browserName, version: browserVersion })
  }, [])

  if (!isOldBrowser) {
    return null
  }

  return (
    <Card className="mb-4 border-yellow-500 bg-yellow-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-yellow-800">
          <AlertTriangle className="h-5 w-5" />
          Navegador Antigo Detectado
        </CardTitle>
        <CardDescription className="text-yellow-700">
          {browserInfo && `${browserInfo.name} ${browserInfo.version}`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-yellow-800">
          Seu navegador pode não suportar todas as funcionalidades deste sistema. 
          Para melhor experiência, recomendamos atualizar para a versão mais recente.
        </p>
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold text-yellow-900">Soluções:</p>
          <ul className="text-xs text-yellow-800 space-y-1 ml-4 list-disc">
            <li>Atualize o Chrome para a versão mais recente compatível</li>
            <li>Ou use Firefox atualizado</li>
            <li>Limpe cache e cookies do navegador</li>
            <li>Tente usar modo anônimo/privado</li>
          </ul>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            // Limpar cache
            if ('caches' in window) {
              caches.keys().then(names => {
                names.forEach(name => caches.delete(name))
              })
            }
            // Limpar localStorage
            localStorage.clear()
            // Recarregar página
            window.location.reload()
          }}
          className="w-full border-yellow-600 text-yellow-800 hover:bg-yellow-100"
        >
          Limpar Cache e Recarregar
        </Button>
      </CardContent>
    </Card>
  )
}

