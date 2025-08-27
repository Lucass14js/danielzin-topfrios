import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Log do evento recebido
    console.log('Webhook recebido:', JSON.stringify(body, null, 2))

    if (!supabaseAdmin) {
      console.error('supabaseAdmin não configurado')
      return NextResponse.json({ error: 'Erro de configuração do servidor' }, { status: 500 })
    }

    // Filtrar eventos apenas de contatos conhecidos (exceto eventos de sistema)
    const systemEvents = ['CONNECTION_UPDATE', 'QRCODE_UPDATED']
    const remoteJid = body.data?.key?.remoteJid

    if (!systemEvents.includes(body.event) && remoteJid) {
      // Verificar se o contato existe no sistema
      const phoneNumber = remoteJid.split('@')[0]
      const { data: contact } = await supabaseAdmin
        .from('contacts')
        .select('id')
        .or(`phone.eq.${phoneNumber},formatted_phone.eq.${remoteJid}`)
        .limit(1)
        .single()

      // Se o contato não existe, ignorar o evento
      if (!contact) {
        console.log(`Evento ignorado - contato ${phoneNumber} não encontrado no sistema`)
        return NextResponse.json({ success: true, ignored: true })
      }
    }

    // Salvar evento no banco
    await supabaseAdmin
      .from('webhook_events')
      .insert([{
        instance_name: body.instance,
        event_type: body.event,
        event_data: body.data,
        message_id: body.data?.key?.id,
        remote_jid: remoteJid,
        processed: false
      }])

    // Processar diferentes tipos de eventos
    switch (body.event) {
      case 'CONNECTION_UPDATE':
        await handleConnectionUpdate(body)
        break
      
      case 'QRCODE_UPDATED':
        await handleQRCodeUpdate(body)
        break
      
      case 'MESSAGES_UPDATE':
        await handleMessageUpdate(body)
        break
      
      case 'SEND_MESSAGE':
        await handleSendMessage(body)
        break
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Erro no webhook:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

async function handleConnectionUpdate(body: any) {
  try {
    if (!supabaseAdmin) return
    
    const instanceName = body.instance
    const connectionData = body.data
    
    let status = 'disconnected'
    let phoneNumber = null

    if (connectionData.state === 'open') {
      status = 'connected'
      phoneNumber = connectionData.user?.id?.split('@')[0] || null
    } else if (connectionData.state === 'connecting') {
      status = 'connecting'
    }

    // Atualizar status da instância
    await supabaseAdmin
      .from('instances')
      .update({ 
        status,
        phone_number: phoneNumber,
        qr_code: connectionData.qrcode || null
      })
      .eq('name', instanceName)

  } catch (error) {
    console.error('Erro ao processar CONNECTION_UPDATE:', error)
  }
}

async function handleQRCodeUpdate(body: any) {
  try {
    if (!supabaseAdmin) return
    
    const instanceName = body.instance
    const qrCode = body.data.qrcode

    // Atualizar QR code da instância
    await supabaseAdmin
      .from('instances')
      .update({ qr_code: qrCode })
      .eq('name', instanceName)

  } catch (error) {
    console.error('Erro ao processar QRCODE_UPDATED:', error)
  }
}

async function handleMessageUpdate(body: any) {
  try {
    if (!supabaseAdmin) return
    
    const messageData = body.data
    const messageId = messageData.key?.id
    const remoteJid = messageData.key?.remoteJid

    if (!messageId || !remoteJid) return

    // Buscar campaign_contact relacionado
    const { data: campaignContact } = await supabaseAdmin
      .from('campaign_contacts')
      .select('*')
      .eq('evolution_message_id', messageId)
      .single()

    if (!campaignContact) return

    // Atualizar status baseado no update
    let updateData: any = {}

    if (messageData.update?.status === 3) {
      // Mensagem entregue
      updateData.status = 'delivered'
      updateData.delivered_at = new Date().toISOString()
    } else if (messageData.update?.status === 4) {
      // Mensagem lida
      updateData.status = 'read'
      updateData.read_at = new Date().toISOString()
    }

    if (Object.keys(updateData).length > 0) {
      await supabaseAdmin
        .from('campaign_contacts')
        .update(updateData)
        .eq('id', campaignContact.id)

      // Atualizar contadores da campanha
      await updateCampaignCounters(campaignContact.campaign_id)
    }

  } catch (error) {
    console.error('Erro ao processar MESSAGES_UPDATE:', error)
  }
}

async function handleSendMessage(body: any) {
  try {
    if (!supabaseAdmin) return
    
    const messageData = body.data
    const messageId = messageData.key?.id

    if (!messageId) return

    // Buscar campaign_contact relacionado
    const { data: campaignContact } = await supabaseAdmin
      .from('campaign_contacts')
      .select('*')
      .eq('evolution_message_id', messageId)
      .single()

    if (!campaignContact) return

    // Atualizar como enviado
    await supabaseAdmin
      .from('campaign_contacts')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString()
      })
      .eq('id', campaignContact.id)

    // Atualizar contadores da campanha
    await updateCampaignCounters(campaignContact.campaign_id)

  } catch (error) {
    console.error('Erro ao processar SEND_MESSAGE:', error)
  }
}

async function updateCampaignCounters(campaignId: string) {
  try {
    if (!supabaseAdmin) return
    
    // Contar status dos contatos da campanha
    const { data: contacts } = await supabaseAdmin
      .from('campaign_contacts')
      .select('status')
      .eq('campaign_id', campaignId)

    if (!contacts) return

    const sentCount = contacts.filter(c => ['sent', 'delivered', 'read'].includes(c.status)).length
    const deliveredCount = contacts.filter(c => ['delivered', 'read'].includes(c.status)).length
    const readCount = contacts.filter(c => c.status === 'read').length
    const failedCount = contacts.filter(c => c.status === 'failed').length

    // Atualizar contadores da campanha
    await supabaseAdmin
      .from('campaigns')
      .update({
        sent_count: sentCount,
        delivered_count: deliveredCount,
        read_count: readCount,
        failed_count: failedCount
      })
      .eq('id', campaignId)

  } catch (error) {
    console.error('Erro ao atualizar contadores da campanha:', error)
  }
}
