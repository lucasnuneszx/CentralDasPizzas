'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'

interface SiteLogoProps {
  className?: string
}

export function SiteLogo({ className = '' }: SiteLogoProps) {
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchLogo = async () => {
      try {
        const response = await fetch('/api/settings')
        if (response.ok) {
          const settings = await response.json()
          setLogoUrl(settings.profileLogo || null)
        }
      } catch (error) {
        console.error('Erro ao carregar logo:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchLogo()
  }, [])

  if (isLoading) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
        <span className="text-sm font-medium text-gray-600">Central das Pizzas</span>
      </div>
    )
  }

  if (!logoUrl) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
          <span className="text-white font-bold text-sm">C</span>
        </div>
        <span className="text-sm font-medium text-gray-600">Central das Pizzas</span>
      </div>
    )
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className="relative w-8 h-8">
        <Image
          src={logoUrl}
          alt="Central das Pizzas"
          fill
          className="object-contain rounded"
          sizes="32px"
        />
      </div>
      <span className="text-sm font-medium text-gray-600">Central das Pizzas</span>
    </div>
  )
}
