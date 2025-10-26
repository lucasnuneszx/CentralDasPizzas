'use client'

import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { UserRole } from '@/lib/constants'

export default function DebugPage() {
  const { data: session, status } = useSession()
  const [userData, setUserData] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const checkUser = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/check-user')
      const data = await response.json()
      setUserData(data)
    } catch (error) {
      console.error('Erro ao verificar usuário:', error)
    } finally {
      setLoading(false)
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
            <CardTitle>Status da Sessão</CardTitle>
            <CardDescription>Informações sobre a autenticação</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <strong>Status:</strong> {status}
              </div>
              <div>
                <strong>Autenticado:</strong> {session ? 'Sim' : 'Não'}
              </div>
              {session && (
                <>
                  <div>
                    <strong>Email:</strong> {session.user?.email}
                  </div>
                  <div>
                    <strong>Nome:</strong> {session.user?.name}
                  </div>
                  <div>
                    <strong>Role:</strong> {session.user?.role}
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
              {loading ? (
                <div>Carregando...</div>
              ) : userData ? (
                <>
                  <div>
                    <strong>Autenticado no banco:</strong> {userData.authenticated ? 'Sim' : 'Não'}
                  </div>
                  {userData.user && (
                    <>
                      <div>
                        <strong>ID:</strong> {userData.user.id}
                      </div>
                      <div>
                        <strong>Nome:</strong> {userData.user.name}
                      </div>
                      <div>
                        <strong>Email:</strong> {userData.user.email}
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



