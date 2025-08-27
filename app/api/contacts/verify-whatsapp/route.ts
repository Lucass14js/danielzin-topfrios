import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { EvolutionAPI } from '@/lib/evolution-api'
import { getPhoneVariations } from '@/lib/utils'

export async function POST(request: NextRequest) {
  try {
    const { audienceId } = await request.json()

    if (!audienceId) {
      return NextResponse.json({ error: 'Audience ID é obrigatório' }, { status: 400 })
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Erro de configuração do servidor' }, { status: 500 })
    }

    // Buscar contatos da audiência que ainda não foram verificados
    const { data: contacts, error } = await supabaseAdmin
      .from('contacts')
      .select('id, phone, name')
      .eq('audience_id', audienceId)
      .is('has_whatsapp', null)

    if (error) throw error

    if (!contacts || contacts.length === 0) {
      return NextResponse.json({ verified: 0, message: 'Nenhum contato para verificar' })
    }

    // Buscar uma instância conectada para fazer a verificação
    const { data: instances } = await supabaseAdmin
      .from('instances')
      .select('name')
      .eq('status', 'connected')
      .limit(1)

    if (!instances || instances.length === 0) {
      return NextResponse.json({ 
        error: 'Nenhuma instância conectada encontrada' 
      }, { status: 400 })
    }

    const instanceName = instances[0].name
    let verifiedCount = 0

    // Verificar cada contato
    for (const contact of contacts) {
      try {
        const phoneVariations = getPhoneVariations(contact.phone)
        let hasWhatsApp = false
        let whatsappName = null

        // Tentar ambas as variações do número
        for (const phoneNumber of phoneVariations) {
          try {
            const result = await EvolutionAPI.checkWhatsApp(instanceName, phoneNumber)
            if (result.exists) {
              hasWhatsApp = true
              whatsappName = result.name
              break
            }
          } catch (error) {
            console.error(`Erro ao verificar ${phoneNumber}:`, error)
          }
        }

        // Atualizar contato no banco
        await supabaseAdmin
          .from('contacts')
          .update({
            has_whatsapp: hasWhatsApp,
            whatsapp_name: whatsappName,
            formatted_phone: hasWhatsApp ? phoneVariations[0] : null
          })
          .eq('id', contact.id)

        verifiedCount++

        // Delay entre verificações para não sobrecarregar a API
        await new Promise(resolve => setTimeout(resolve, 1000))

      } catch (error) {
        console.error(`Erro ao verificar contato ${contact.name}:`, error)
        
        // Marcar como não verificado em caso de erro
        await supabaseAdmin
          .from('contacts')
          .update({ has_whatsapp: false })
          .eq('id', contact.id)
      }
    }

    // Atualizar contadores da audiência
    await updateAudienceCounters(audienceId)

    return NextResponse.json({ 
      verified: verifiedCount,
      message: `${verifiedCount} contatos verificados com sucesso`
    })

  } catch (error) {
    console.error('Erro na verificação de WhatsApp:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor' 
    }, { status: 500 })
  }
}

async function updateAudienceCounters(audienceId: string) {
  if (!supabaseAdmin) return
  
  const { data: contacts } = await supabaseAdmin
    .from('contacts')
    .select('status, has_whatsapp')
    .eq('audience_id', audienceId)

  if (!contacts) return

  const totalContacts = contacts.length
  const activeContacts = contacts.filter(c => c.status === 'active').length

  await supabaseAdmin
    .from('audiences')
    .update({
      total_contacts: totalContacts,
      active_contacts: activeContacts
    })
    .eq('id', audienceId)
}
