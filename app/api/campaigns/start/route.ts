import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { EvolutionAPI } from '@/lib/evolution-api'
import { processSpintax, getRandomDelay } from '@/lib/utils'

export async function POST(request: NextRequest) {
  try {
    const { campaignId } = await request.json()

    if (!campaignId) {
      return NextResponse.json({ error: 'Campaign ID é obrigatório' }, { status: 400 })
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Erro de configuração do servidor' }, { status: 500 })
    }

    // Buscar dados da campanha
    const { data: campaign, error: campaignError } = await supabaseAdmin
      .from('campaigns')
      .select(`
        *,
        instances (name, api_url, api_key),
        campaign_messages (message_text, order_index)
      `)
      .eq('id', campaignId)
      .single()

    if (campaignError || !campaign) {
      return NextResponse.json({ error: 'Campanha não encontrada' }, { status: 404 })
    }

    if (campaign.status !== 'draft' && campaign.status !== 'paused') {
      return NextResponse.json({ error: 'Campanha não pode ser iniciada' }, { status: 400 })
    }

    // Buscar contatos ativos da audiência
    const { data: contacts, error: contactsError } = await supabaseAdmin
      .from('contacts')
      .select('id, name, phone, formatted_phone')
      .eq('audience_id', campaign.audience_id)
      .eq('status', 'active')
      .eq('has_whatsapp', true)

    if (contactsError) throw contactsError

    if (!contacts || contacts.length === 0) {
      return NextResponse.json({ 
        error: 'Nenhum contato ativo com WhatsApp encontrado' 
      }, { status: 400 })
    }

    // Criar registros de campaign_contacts se não existirem
    const existingContacts = await supabaseAdmin
      .from('campaign_contacts')
      .select('contact_id')
      .eq('campaign_id', campaignId)

    const existingContactIds = existingContacts.data?.map(c => c.contact_id) || []
    const newContacts = contacts.filter(c => !existingContactIds.includes(c.id))

    if (newContacts.length > 0) {
      const campaignContacts = newContacts.map(contact => ({
        campaign_id: campaignId,
        contact_id: contact.id,
        status: 'pending'
      }))

      await supabaseAdmin
        .from('campaign_contacts')
        .insert(campaignContacts)
    }

    // Atualizar status da campanha
    await supabaseAdmin
      .from('campaigns')
      .update({ 
        status: 'active',
        started_at: new Date().toISOString()
      })
      .eq('id', campaignId)

    // Iniciar processamento em background
    processCampaignInBackground(campaignId)

    return NextResponse.json({ 
      success: true,
      message: `Campanha iniciada para ${contacts.length} contatos`
    })

  } catch (error) {
    console.error('Erro ao iniciar campanha:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

async function processCampaignInBackground(campaignId: string) {
  try {
    if (!supabaseAdmin) return
    
    // Buscar dados da campanha novamente
    const { data: campaign } = await supabaseAdmin
      .from('campaigns')
      .select(`
        *,
        instances (name, api_url, api_key),
        campaign_messages (message_text, order_index)
      `)
      .eq('id', campaignId)
      .single()

    if (!campaign || campaign.status !== 'active') return

    // Buscar contatos pendentes
    const { data: campaignContacts } = await supabaseAdmin
      .from('campaign_contacts')
      .select(`
        id,
        contacts (id, name, phone, formatted_phone)
      `)
      .eq('campaign_id', campaignId)
      .eq('status', 'pending')

    if (!campaignContacts || campaignContacts.length === 0) return

    const instanceName = campaign.instances.name
    const messages = campaign.campaign_messages.sort((a: any, b: any) => a.order_index - b.order_index)

    // Processar cada contato
    for (const campaignContact of campaignContacts) {
      try {
        // Verificar se a campanha ainda está ativa
        const { data: currentCampaign } = await supabaseAdmin
          .from('campaigns')
          .select('status')
          .eq('id', campaignId)
          .single()

        if (!currentCampaign || currentCampaign.status !== 'active') {
          break // Parar se a campanha foi pausada/cancelada
        }

        const contact = campaignContact.contacts as any
        const phoneNumber = contact.formatted_phone || contact.phone

        // Selecionar mensagem aleatória e processar spintax
        const randomMessage = messages[Math.floor(Math.random() * messages.length)]
        const processedMessage = processSpintax(randomMessage.message_text)

        // Simular "digitando"
        const typingDelay = getRandomDelay(campaign.typing_delay_min, campaign.typing_delay_max)
        await EvolutionAPI.sendPresence(instanceName, phoneNumber, 'composing')
        await new Promise(resolve => setTimeout(resolve, typingDelay))

        // Enviar mensagem
        let evolutionResponse
        if (campaign.has_media && campaign.media_url) {
          evolutionResponse = await EvolutionAPI.sendMediaMessage(instanceName, {
            number: phoneNumber,
            media: campaign.media_url,
            caption: campaign.media_caption || processedMessage,
            delay: 0
          })
        } else {
          evolutionResponse = await EvolutionAPI.sendTextMessage(instanceName, {
            number: phoneNumber,
            text: processedMessage,
            delay: 0
          })
        }

        // Parar "digitando"
        await EvolutionAPI.sendPresence(instanceName, phoneNumber, 'paused')

        // Atualizar status do contato
        await supabaseAdmin
          .from('campaign_contacts')
          .update({
            status: 'sent',
            message_sent: processedMessage,
            evolution_message_id: evolutionResponse.key.id,
            sent_at: new Date().toISOString()
          })
          .eq('id', campaignContact.id)

        // Delay entre mensagens
        const messageDelay = getRandomDelay(campaign.delay_min * 1000, campaign.delay_max * 1000)
        await new Promise(resolve => setTimeout(resolve, messageDelay))

      } catch (error) {
        console.error(`Erro ao enviar para ${(campaignContact.contacts as any).name}:`, error)
        
        // Marcar como falhou
        await supabaseAdmin
          .from('campaign_contacts')
          .update({
            status: 'failed',
            error_message: error instanceof Error ? error.message : 'Erro desconhecido',
            failed_at: new Date().toISOString()
          })
          .eq('id', campaignContact.id)
      }
    }

    // Verificar se a campanha foi concluída
    const { data: remainingContacts } = await supabaseAdmin
      .from('campaign_contacts')
      .select('id')
      .eq('campaign_id', campaignId)
      .eq('status', 'pending')

    if (!remainingContacts || remainingContacts.length === 0) {
      await supabaseAdmin
        .from('campaigns')
        .update({ 
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', campaignId)
    }

    // Atualizar contadores da campanha
    await updateCampaignCounters(campaignId)

  } catch (error) {
    console.error('Erro no processamento da campanha:', error)
    
    // Marcar campanha como com erro
    if (supabaseAdmin) {
      await supabaseAdmin
        .from('campaigns')
        .update({ status: 'cancelled' })
        .eq('id', campaignId)
    }
  }
}

async function updateCampaignCounters(campaignId: string) {
  if (!supabaseAdmin) return
  
  const { data: contacts } = await supabaseAdmin
    .from('campaign_contacts')
    .select('status')
    .eq('campaign_id', campaignId)

  if (!contacts) return

  const sentCount = contacts.filter(c => ['sent', 'delivered', 'read'].includes(c.status)).length
  const deliveredCount = contacts.filter(c => ['delivered', 'read'].includes(c.status)).length
  const readCount = contacts.filter(c => c.status === 'read').length
  const failedCount = contacts.filter(c => c.status === 'failed').length

  await supabaseAdmin
    .from('campaigns')
    .update({
      sent_count: sentCount,
      delivered_count: deliveredCount,
      read_count: readCount,
      failed_count: failedCount
    })
    .eq('id', campaignId)
}
