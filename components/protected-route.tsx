'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { UserRole } from '@/lib/constants'
import { useAuth } from '@/hooks/useAuth'

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: UserRole[]
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, loading, authenticated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (loading) return

    if (!authenticated || !user) {
      router.push('/auth/signin')
      return
    }

    if (allowedRoles && !allowedRoles.includes(user.role as UserRole)) {
      router.push('/unauthorized')
      return
    }
  }, [user, loading, authenticated, router, allowedRoles])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!authenticated || !user) {
    return null
  }

  if (allowedRoles && !allowedRoles.includes(user.role as UserRole)) {
    return null
  }

  return <>{children}</>
}



