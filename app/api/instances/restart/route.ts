import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { EvolutionAPI } from '@/lib/evolution-api'

export async function POST(request: NextRequest) {
  try {
    const { instanceId } = await request.json()

    if (!instanceId) {
      return NextResponse.json({ error: 'Instance ID é obrigatório' }, { status: 400 })
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
      // Reiniciar instância na Evolution API
      await EvolutionAPI.restartInstance(instance.name)

      // Atualizar status
      await supabaseAdmin
        .from('instances')
        .update({ status: 'connecting' })
        .eq('id', instanceId)

      return NextResponse.json({ success: true })

    } catch (evolutionError) {
      console.error('Erro na Evolution API:', evolutionError)
      return NextResponse.json({ 
        error: 'Erro ao reiniciar instância na Evolution API' 
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Erro ao reiniciar instância:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
