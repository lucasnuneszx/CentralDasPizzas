'use client'

import { useAuth } from '@/hooks/useAuth'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { UserRole } from '@/lib/constants'
import { maskEmail, maskName, maskId } from '@/lib/utils'
import { Eye, EyeOff } from 'lucide-react'

export default function DebugPage() {
  const { user, loading, authenticated } = useAuth()
  const [userData, setUserData] = useState<any>(null)
  const [checking, setChecking] = useState(false)
  const [showSensitiveData, setShowSensitiveData] = useState(false)

  const checkUser = async () => {
    setChecking(true)
    try {
      const response = await fetch('/api/check-user')
      const data = await response.json()
      setUserData(data)
    } catch (error) {
      console.error('Erro ao verificar usuário:', error)
    } finally {
      setChecking(false)
    }
  }

  useEffect(() => {
    checkUser()
  }, [])

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">Debug - Status do Sistema</h1>
        
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Status da Sessão</CardTitle>
                <CardDescription>Informações sobre a autenticação</CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSensitiveData(!showSensitiveData)}
              >
                {showSensitiveData ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                {showSensitiveData ? 'Ocultar' : 'Mostrar'} Dados
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <strong>Status:</strong> {loading ? 'Carregando...' : authenticated ? 'Autenticado' : 'Não autenticado'}
              </div>
              <div>
                <strong>Autenticado:</strong> {authenticated ? 'Sim' : 'Não'}
              </div>
              {user && (
                <>
                  <div>
                    <strong>Email:</strong> {showSensitiveData ? user.email : maskEmail(user.email || '')}
                  </div>
                  <div>
                    <strong>Nome:</strong> {showSensitiveData ? user.name : maskName(user.name || '')}
                  </div>
                  <div>
                    <strong>Role:</strong> {user.role}
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Dados do Banco</CardTitle>
            <CardDescription>Informações do usuário no banco de dados</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {checking ? (
                <div>Carregando...</div>
              ) : userData ? (
                <>
                  <div>
                    <strong>Autenticado no banco:</strong> {userData.authenticated ? 'Sim' : 'Não'}
                  </div>
                  {userData.user && (
                    <>
                      <div>
                        <strong>ID:</strong> {showSensitiveData ? userData.user.id : maskId(userData.user.id || '')}
                      </div>
                      <div>
                        <strong>Nome:</strong> {showSensitiveData ? userData.user.name : maskName(userData.user.name || '')}
                      </div>
                      <div>
                        <strong>Email:</strong> {showSensitiveData ? userData.user.email : maskEmail(userData.user.email || '')}
                      </div>
                      <div>
                        <strong>Role:</strong> {userData.user.role}
                      </div>
                      <div>
                        <strong>Ativo:</strong> {userData.user.isActive ? 'Sim' : 'Não'}
                      </div>
                    </>
                  )}
                  {userData.error && (
                    <div className="text-red-500">
                      <strong>Erro:</strong> {userData.error}
                    </div>
                  )}
                </>
              ) : (
                <div>Nenhum dado carregado</div>
              )}
            </div>
            <Button onClick={checkUser} className="mt-4">
              Atualizar Dados
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Links de Teste</CardTitle>
            <CardDescription>Links para testar diferentes áreas do sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <a href="/dashboard" className="block text-blue-600 hover:underline">
                Dashboard Principal
              </a>
              <a href="/admin/ifood/dashboard" className="block text-blue-600 hover:underline">
                Dashboard iFood
              </a>
              <a href="/admin/ifood/partners" className="block text-blue-600 hover:underline">
                Parceiros iFood
              </a>
              <a href="/admin/users" className="block text-blue-600 hover:underline">
                Usuários
              </a>
              <a href="/api/make-admin" className="block text-blue-600 hover:underline">
                Tornar Usuário Admin
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}






