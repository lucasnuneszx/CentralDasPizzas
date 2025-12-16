'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Copy, CheckCircle, User, Shield, CreditCard, ChefHat, Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { maskEmail, maskPassword } from '@/lib/utils'

export default function CredentialsPage() {
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null)
  const [showCredentials, setShowCredentials] = useState<{ [key: number]: boolean }>({})

  const credentials = [
    {
      role: 'Administrador',
      email: 'admin@centraldaspizzas.com',
      password: '123456',
      icon: Shield,
      color: 'from-red-500 to-red-600',
      description: 'Acesso completo ao sistema, gestão de usuários, configurações e relatórios'
    },
    {
      role: 'Gerente',
      email: 'gerente@centraldaspizzas.com',
      password: '123456',
      icon: User,
      color: 'from-blue-500 to-blue-600',
      description: 'Gestão de combos, pedidos, relatórios e controle operacional'
    },
    {
      role: 'Caixa',
      email: 'caixa@centraldaspizzas.com',
      password: '123456',
      icon: CreditCard,
      color: 'from-green-500 to-green-600',
      description: 'Processamento de pedidos, controle de caixa e fechamento'
    },
    {
      role: 'Cozinha',
      email: 'cozinha@centraldaspizzas.com',
      password: '123456',
      icon: ChefHat,
      color: 'from-orange-500 to-orange-600',
      description: 'Visualização de pedidos e atualização de status'
    }
  ]

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text)
    setCopiedEmail(type)
    toast.success(`${type} copiado!`)
    setTimeout(() => setCopiedEmail(null), 2000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50">
      <header className="bg-white/90 backdrop-blur-sm shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Link href="/">
                <Button variant="outline" className="mr-4">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar
                </Button>
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">
                Credenciais de Acesso
              </h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Acesso ao Sistema
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Use as credenciais abaixo para acessar o sistema com diferentes tipos de usuário.
            Cada perfil tem acesso a funcionalidades específicas.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {credentials.map((cred, index) => {
            const IconComponent = cred.icon
            return (
              <Card key={index} className="group hover:shadow-xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader className="text-center pb-4">
                  <div className={`w-16 h-16 bg-gradient-to-br ${cred.color} rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <IconComponent className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-xl font-bold text-gray-900">{cred.role}</CardTitle>
                  <CardDescription className="text-gray-600">
                    {cred.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-600">Email:</span>
                      <div className="flex items-center space-x-2">
                        <code className="text-sm bg-white px-2 py-1 rounded border">
                          {showCredentials[index] ? cred.email : maskEmail(cred.email)}
                        </code>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setShowCredentials({ ...showCredentials, [index]: !showCredentials[index] })}
                          title={showCredentials[index] ? 'Ocultar email' : 'Mostrar email'}
                        >
                          {showCredentials[index] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard(cred.email, 'Email')}
                        >
                          {copiedEmail === 'Email' ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-600">Senha:</span>
                      <div className="flex items-center space-x-2">
                        <code className="text-sm bg-white px-2 py-1 rounded border">
                          {showCredentials[index] ? cred.password : maskPassword(cred.password)}
                        </code>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setShowCredentials({ ...showCredentials, [index]: !showCredentials[index] })}
                          title={showCredentials[index] ? 'Ocultar senha' : 'Mostrar senha'}
                        >
                          {showCredentials[index] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard(cred.password, 'Senha')}
                        >
                          {copiedEmail === 'Senha' ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  <Link href="/auth/signin">
                    <Button className="w-full bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600">
                      Fazer Login como {cred.role}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 border border-red-100">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              🎯 Como Testar o Sistema
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
              <div className="space-y-2">
                <h4 className="font-semibold text-gray-900">1. Login</h4>
                <p className="text-gray-600 text-sm">
                  Use qualquer uma das credenciais acima para fazer login no sistema
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-gray-900">2. Explore</h4>
                <p className="text-gray-600 text-sm">
                  Cada perfil tem acesso a funcionalidades específicas do sistema
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-gray-900">3. Teste</h4>
                <p className="text-gray-600 text-sm">
                  Experimente criar combos, fazer pedidos e usar todas as funcionalidades
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}


