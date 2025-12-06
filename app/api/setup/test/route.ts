import { NextResponse } from 'next/server'

/**
 * Endpoint de teste simples para verificar se a rota /api/setup funciona
 */
export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Endpoint /api/setup está funcionando!',
    timestamp: new Date().toISOString(),
    availableEndpoints: [
      '/api/setup/create-tables',
      '/api/setup/create-users',
      '/api/setup/diagnose',
      '/api/setup/test-connection',
      '/api/setup/debug-env'
    ]
  })
}


