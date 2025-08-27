import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json()

    if (!url) {
      return NextResponse.json({ error: 'URL é obrigatória' }, { status: 400 })
    }

    // Tentar fazer uma requisição de teste para a URL
    const testPayload = {
      event: 'TEST_EVENT',
      instance: 'test-instance',
      data: {
        message: 'Este é um teste do webhook',
        timestamp: new Date().toISOString()
      }
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testPayload)
    })

    if (response.ok) {
      return NextResponse.json({ 
        success: true, 
        message: 'Webhook testado com sucesso',
        status: response.status
      })
    } else {
      return NextResponse.json({ 
        success: false, 
        message: 'Webhook retornou erro',
        status: response.status
      }, { status: 400 })
    }

  } catch (error) {
    console.error('Erro no teste do webhook:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Erro ao testar webhook',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}
