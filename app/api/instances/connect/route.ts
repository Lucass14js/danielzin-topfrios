import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { EvolutionAPI } from '@/lib/evolution-api'

function getWebhookUrl(request: NextRequest): string {
  // Prioridade: variável de ambiente > URL da requisição
  if (process.env.NEXT_PUBLIC_APP_URL && !process.env.NEXT_PUBLIC_APP_URL.includes('localhost')) {
    return `${process.env.NEXT_PUBLIC_APP_URL}/api/webhook/evolution`
  }
  
  // Usar a URL da requisição atual (funciona na Vercel, Railway, etc.)
  const url = new URL(request.url)
  const baseUrl = `${url.protocol}//${url.host}`
  return `${baseUrl}/api/webhook/evolution`
}

export async function POST(request: NextRequest) {
  try {
    const { instanceId } = await request.json()

    if (!instanceId) {
      return NextResponse.json({ error: 'Instance ID é obrigatório' }, { status: 400 })
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Erro de configuração do servidor' }, { status: 500 })
    }

    // Buscar dados da instância
    const { data: instance, error } = await supabaseAdmin
      .from('instances')
      .select('*')
      .eq('id', instanceId)
      .single()

    if (error || !instance) {
      return NextResponse.json({ error: 'Instância não encontrada' }, { status: 404 })
    }

    // Atualizar status para connecting
    if (supabaseAdmin) {
      await supabaseAdmin
        .from('instances')
        .update({ status: 'connecting' })
        .eq('id', instanceId)
    }

    try {
      // Preparar configurações de proxy se disponíveis
      const proxyConfig = instance.proxy_host && instance.proxy_port ? {
        host: instance.proxy_host,
        port: instance.proxy_port,
        username: instance.proxy_username,
        password: instance.proxy_password
      } : undefined

      // Tentar criar/conectar instância na Evolution API
      const evolutionResponse = await EvolutionAPI.createInstance(instance.name, proxyConfig)
      
      // Configurar webhook automaticamente
      const webhookUrl = getWebhookUrl(request)
      try {
        await EvolutionAPI.setWebhook(instance.name, webhookUrl)
        console.log(`Webhook configurado para ${instance.name}: ${webhookUrl}`)
      } catch (webhookError) {
        console.error('Erro ao configurar webhook:', webhookError)
        // Não falhar a conexão por causa do webhook
      }

      // Obter status da conexão
      const connectionStatus = await EvolutionAPI.getInstanceStatus(instance.name)
      
      let qrCode = null
      if (connectionStatus.qrcode) {
        qrCode = connectionStatus.qrcode
      }

      // Atualizar instância com QR code se disponível
      if (supabaseAdmin) {
        await supabaseAdmin
          .from('instances')
          .update({ 
            qr_code: qrCode,
            status: connectionStatus.state === 'open' ? 'connected' : 'connecting'
          })
          .eq('id', instanceId)
      }

      return NextResponse.json({ 
        success: true, 
        qrCode,
        status: connectionStatus.state 
      })

    } catch (evolutionError) {
      console.error('Erro na Evolution API:', evolutionError)
      
      // Reverter status em caso de erro
      if (supabaseAdmin) {
        await supabaseAdmin
          .from('instances')
          .update({ status: 'disconnected' })
          .eq('id', instanceId)
      }

      return NextResponse.json({ 
        error: 'Erro ao conectar com a Evolution API' 
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Erro ao conectar instância:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
