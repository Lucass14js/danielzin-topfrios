import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { EvolutionAPI } from '@/lib/evolution-api'

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

    try {
      // Fazer logout na Evolution API
      await EvolutionAPI.logoutInstance(instance.name)

      // Atualizar status e limpar dados
      if (supabaseAdmin) {
        await supabaseAdmin
          .from('instances')
          .update({ 
            status: 'disconnected',
            qr_code: null,
            phone_number: null
          })
          .eq('id', instanceId)
      }

      return NextResponse.json({ success: true })

    } catch (evolutionError) {
      console.error('Erro na Evolution API:', evolutionError)
      return NextResponse.json({ 
        error: 'Erro ao desconectar instância na Evolution API' 
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Erro ao desconectar instância:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
