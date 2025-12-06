import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({ 
    success: true, 
    message: 'Test ping funcionando!',
    timestamp: new Date().toISOString(),
    path: '/api/test-ping'
  })
}

