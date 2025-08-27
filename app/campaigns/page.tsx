'use client'

import { useEffect, useState } from 'react'
import Sidebar from '@/components/Sidebar'
import { 
  Plus, 
  MessageSquare, 
  Play, 
  Pause, 
  Square, 
  Eye,
  Trash2,
  Image,
  Clock,
  Users,
  CheckCircle,
  XCircle,
  Send
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Campaign, Audience, Instance } from '@/lib/types'
import { formatDate, formatNumber, calculatePercentage } from '@/lib/utils'
import toast from 'react-hot-toast'

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [audiences, setAudiences] = useState<Audience[]>([])
  const [instances, setInstances] = useState<Instance[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newCampaign, setNewCampaign] = useState({
    name: '',
    description: '',
    instance_id: '',
    audience_id: '',
    message_type: 'text' as 'text' | 'media',
    has_media: false,
    media_url: '',
    media_caption: '',
    delay_min: 5,
    delay_max: 15,
    typing_delay_min: 1000,
    typing_delay_max: 3000,
    messages: ['']
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [campaignsRes, audiencesRes, instancesRes] = await Promise.all([
        supabase.from('campaigns').select('*').order('created_at', { ascending: false }),
        supabase.from('audiences').select('*').order('name'),
        supabase.from('instances').select('*').eq('status', 'connected')
      ])

      setCampaigns(campaignsRes.data || [])
      setAudiences(audiencesRes.data || [])
      setInstances(instancesRes.data || [])
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      toast.error('Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }

  const createCampaign = async () => {
    if (!newCampaign.name || !newCampaign.instance_id || !newCampaign.audience_id) {
      toast.error('Preencha todos os campos obrigatórios')
      return
    }

    if (newCampaign.messages.some(msg => !msg.trim())) {
      toast.error('Todas as mensagens devem ser preenchidas')
      return
    }

    try {
      // Buscar total de contatos ativos da audiência
      const { data: audience } = await supabase
        .from('audiences')
        .select('active_contacts')
        .eq('id', newCampaign.audience_id)
        .single()

      if (!audience) throw new Error('Audiência não encontrada')

      // Criar campanha
      const { data: campaign, error: campaignError } = await supabase
        .from('campaigns')
        .insert([{
          name: newCampaign.name,
          description: newCampaign.description,
          instance_id: newCampaign.instance_id,
          audience_id: newCampaign.audience_id,
          message_type: newCampaign.message_type,
          has_media: newCampaign.has_media,
          media_url: newCampaign.media_url || null,
          media_caption: newCampaign.media_caption || null,
          delay_min: newCampaign.delay_min,
          delay_max: newCampaign.delay_max,
          typing_delay_min: newCampaign.typing_delay_min,
          typing_delay_max: newCampaign.typing_delay_max,
          total_contacts: audience.active_contacts,
          status: 'draft'
        }])
        .select()
        .single()

      if (campaignError) throw campaignError

      // Criar mensagens da campanha
      const campaignMessages = newCampaign.messages.map((message, index) => ({
        campaign_id: campaign.id,
        message_text: message,
        order_index: index
      }))

      const { error: messagesError } = await supabase
        .from('campaign_messages')
        .insert(campaignMessages)

      if (messagesError) throw messagesError

      toast.success('Campanha criada com sucesso!')
      setShowCreateModal(false)
      resetNewCampaign()
      loadData()
    } catch (error) {
      console.error('Erro ao criar campanha:', error)
      toast.error('Erro ao criar campanha')
    }
  }

  const resetNewCampaign = () => {
    setNewCampaign({
      name: '',
      description: '',
      instance_id: '',
      audience_id: '',
      message_type: 'text',
      has_media: false,
      media_url: '',
      media_caption: '',
      delay_min: 5,
      delay_max: 15,
      typing_delay_min: 1000,
      typing_delay_max: 3000,
      messages: ['']
    })
  }

  const startCampaign = async (campaign: Campaign) => {
    if (!confirm(`Tem certeza que deseja iniciar a campanha "${campaign.name}"?`)) return

    try {
      const response = await fetch('/api/campaigns/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignId: campaign.id })
      })

      if (!response.ok) throw new Error('Erro ao iniciar campanha')

      toast.success('Campanha iniciada!')
      loadData()
    } catch (error) {
      console.error('Erro ao iniciar campanha:', error)
      toast.error('Erro ao iniciar campanha')
    }
  }

  const pauseCampaign = async (campaign: Campaign) => {
    try {
      const { error } = await supabase
        .from('campaigns')
        .update({ status: 'paused' })
        .eq('id', campaign.id)

      if (error) throw error

      toast.success('Campanha pausada!')
      loadData()
    } catch (error) {
      console.error('Erro ao pausar campanha:', error)
      toast.error('Erro ao pausar campanha')
    }
  }

  const stopCampaign = async (campaign: Campaign) => {
    if (!confirm(`Tem certeza que deseja parar a campanha "${campaign.name}"?`)) return

    try {
      const { error } = await supabase
        .from('campaigns')
        .update({ 
          status: 'cancelled',
          completed_at: new Date().toISOString()
        })
        .eq('id', campaign.id)

      if (error) throw error

      toast.success('Campanha parada!')
      loadData()
    } catch (error) {
      console.error('Erro ao parar campanha:', error)
      toast.error('Erro ao parar campanha')
    }
  }

  const deleteCampaign = async (campaign: Campaign) => {
    if (!confirm(`Tem certeza que deseja excluir a campanha "${campaign.name}"?`)) return

    try {
      const { error } = await supabase
        .from('campaigns')
        .delete()
        .eq('id', campaign.id)

      if (error) throw error

      toast.success('Campanha excluída!')
      loadData()
    } catch (error) {
      console.error('Erro ao excluir campanha:', error)
      toast.error('Erro ao excluir campanha')
    }
  }

  const addMessage = () => {
    setNewCampaign({
      ...newCampaign,
      messages: [...newCampaign.messages, '']
    })
  }

  const removeMessage = (index: number) => {
    if (newCampaign.messages.length > 1) {
      setNewCampaign({
        ...newCampaign,
        messages: newCampaign.messages.filter((_, i) => i !== index)
      })
    }
  }

  const updateMessage = (index: number, value: string) => {
    const updatedMessages = [...newCampaign.messages]
    updatedMessages[index] = value
    setNewCampaign({
      ...newCampaign,
      messages: updatedMessages
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-success-600 bg-success-50'
      case 'completed': return 'text-blue-600 bg-blue-50'
      case 'paused': return 'text-warning-600 bg-warning-50'
      case 'cancelled': return 'text-error-600 bg-error-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'draft': return 'Rascunho'
      case 'active': return 'Ativa'
      case 'paused': return 'Pausada'
      case 'completed': return 'Concluída'
      case 'cancelled': return 'Cancelada'
      default: return status
    }
  }

  if (loading) {
    return (
      <div className="flex">
        <Sidebar />
        <div className="flex-1 p-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="card p-6">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Campanhas</h1>
            <p className="text-gray-600 mt-2">Gerencie suas campanhas de mensagens</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary"
            disabled={instances.length === 0 || audiences.length === 0}
          >
            <Plus className="h-5 w-5 mr-2" />
            Nova Campanha
          </button>
        </div>

        {instances.length === 0 && (
          <div className="card p-4 mb-6 bg-warning-50 border-warning-200">
            <p className="text-warning-800">
              ⚠️ Você precisa ter pelo menos uma instância conectada para criar campanhas.
            </p>
          </div>
        )}

        {audiences.length === 0 && (
          <div className="card p-4 mb-6 bg-warning-50 border-warning-200">
            <p className="text-warning-800">
              ⚠️ Você precisa ter pelo menos uma audiência para criar campanhas.
            </p>
          </div>
        )}

        {campaigns.length === 0 ? (
          <div className="card p-12 text-center">
            <MessageSquare className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Nenhuma campanha encontrada</h3>
            <p className="text-gray-600 mb-6">Crie sua primeira campanha para começar</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn btn-primary"
              disabled={instances.length === 0 || audiences.length === 0}
            >
              <Plus className="h-5 w-5 mr-2" />
              Criar Primeira Campanha
            </button>
          </div>
        ) : (
          <div className="grid gap-6">
            {campaigns.map((campaign) => {
              const deliveryRate = calculatePercentage(campaign.delivered_count, campaign.sent_count)
              const readRate = calculatePercentage(campaign.read_count, campaign.delivered_count)
              
              return (
                <div key={campaign.id} className="card p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <div className="p-3 bg-primary-50 rounded-lg">
                        {campaign.has_media ? (
                          <Image className="h-6 w-6 text-primary-600" />
                        ) : (
                          <MessageSquare className="h-6 w-6 text-primary-600" />
                        )}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{campaign.name}</h3>
                        <p className="text-sm text-gray-600">{campaign.description}</p>
                        <div className="flex items-center space-x-4 mt-1">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(campaign.status)}`}>
                            {getStatusText(campaign.status)}
                          </span>
                          <span className="text-xs text-gray-500">
                            {formatNumber(campaign.total_contacts)} contatos
                          </span>
                          <span className="text-xs text-gray-500">
                            Criado em {formatDate(campaign.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      {campaign.status === 'draft' && (
                        <button
                          onClick={() => startCampaign(campaign)}
                          className="p-2 text-success-600 hover:bg-success-50 rounded-lg transition-colors"
                          title="Iniciar Campanha"
                        >
                          <Play className="h-5 w-5" />
                        </button>
                      )}

                      {campaign.status === 'active' && (
                        <>
                          <button
                            onClick={() => pauseCampaign(campaign)}
                            className="p-2 text-warning-600 hover:bg-warning-50 rounded-lg transition-colors"
                            title="Pausar"
                          >
                            <Pause className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => stopCampaign(campaign)}
                            className="p-2 text-error-600 hover:bg-error-50 rounded-lg transition-colors"
                            title="Parar"
                          >
                            <Square className="h-5 w-5" />
                          </button>
                        </>
                      )}

                      {campaign.status === 'paused' && (
                        <button
                          onClick={() => startCampaign(campaign)}
                          className="p-2 text-success-600 hover:bg-success-50 rounded-lg transition-colors"
                          title="Retomar"
                        >
                          <Play className="h-5 w-5" />
                        </button>
                      )}

                      <button
                        onClick={() => deleteCampaign(campaign)}
                        className="p-2 text-error-600 hover:bg-error-50 rounded-lg transition-colors"
                        title="Excluir"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>

                  {/* Estatísticas da campanha */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                    <div className="text-center">
                      <div className="flex justify-center mb-1">
                        <Send className="h-5 w-5 text-blue-600" />
                      </div>
                      <p className="text-lg font-semibold text-gray-900">{formatNumber(campaign.sent_count)}</p>
                      <p className="text-xs text-gray-600">Enviadas</p>
                    </div>

                    <div className="text-center">
                      <div className="flex justify-center mb-1">
                        <CheckCircle className="h-5 w-5 text-success-600" />
                      </div>
                      <p className="text-lg font-semibold text-gray-900">
                        {formatNumber(campaign.delivered_count)}
                        <span className="text-sm text-gray-500 ml-1">({deliveryRate}%)</span>
                      </p>
                      <p className="text-xs text-gray-600">Entregues</p>
                    </div>

                    <div className="text-center">
                      <div className="flex justify-center mb-1">
                        <Eye className="h-5 w-5 text-green-600" />
                      </div>
                      <p className="text-lg font-semibold text-gray-900">
                        {formatNumber(campaign.read_count)}
                        <span className="text-sm text-gray-500 ml-1">({readRate}%)</span>
                      </p>
                      <p className="text-xs text-gray-600">Lidas</p>
                    </div>

                    <div className="text-center">
                      <div className="flex justify-center mb-1">
                        <XCircle className="h-5 w-5 text-error-600" />
                      </div>
                      <p className="text-lg font-semibold text-gray-900">{formatNumber(campaign.failed_count)}</p>
                      <p className="text-xs text-gray-600">Falharam</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Modal de Criar Campanha */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl m-4 max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Nova Campanha</h2>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nome da Campanha *
                    </label>
                    <input
                      type="text"
                      className="input"
                      placeholder="Ex: Promoção de Verão"
                      value={newCampaign.name}
                      onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Instância *
                    </label>
                    <select
                      className="select"
                      value={newCampaign.instance_id}
                      onChange={(e) => setNewCampaign({ ...newCampaign, instance_id: e.target.value })}
                    >
                      <option value="">Selecione uma instância</option>
                      {instances.map(instance => (
                        <option key={instance.id} value={instance.id}>
                          {instance.name} ({instance.phone_number})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Audiência *
                  </label>
                  <select
                    className="select"
                    value={newCampaign.audience_id}
                    onChange={(e) => setNewCampaign({ ...newCampaign, audience_id: e.target.value })}
                  >
                    <option value="">Selecione uma audiência</option>
                    {audiences.map(audience => (
                      <option key={audience.id} value={audience.id}>
                        {audience.name} ({formatNumber(audience.active_contacts)} contatos ativos)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descrição
                  </label>
                  <textarea
                    className="textarea"
                    placeholder="Descrição da campanha..."
                    value={newCampaign.description}
                    onChange={(e) => setNewCampaign({ ...newCampaign, description: e.target.value })}
                  />
                </div>

                {/* Configurações de Delay */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Delay entre mensagens (segundos)
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="number"
                        className="input"
                        placeholder="Min"
                        value={newCampaign.delay_min}
                        onChange={(e) => setNewCampaign({ ...newCampaign, delay_min: parseInt(e.target.value) || 5 })}
                      />
                      <input
                        type="number"
                        className="input"
                        placeholder="Max"
                        value={newCampaign.delay_max}
                        onChange={(e) => setNewCampaign({ ...newCampaign, delay_max: parseInt(e.target.value) || 15 })}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Delay "digitando" (milissegundos)
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="number"
                        className="input"
                        placeholder="Min"
                        value={newCampaign.typing_delay_min}
                        onChange={(e) => setNewCampaign({ ...newCampaign, typing_delay_min: parseInt(e.target.value) || 1000 })}
                      />
                      <input
                        type="number"
                        className="input"
                        placeholder="Max"
                        value={newCampaign.typing_delay_max}
                        onChange={(e) => setNewCampaign({ ...newCampaign, typing_delay_max: parseInt(e.target.value) || 3000 })}
                      />
                    </div>
                  </div>
                </div>

                {/* Tipo de Mensagem */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Mensagem
                  </label>
                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="messageType"
                        value="text"
                        checked={newCampaign.message_type === 'text'}
                        onChange={(e) => setNewCampaign({ 
                          ...newCampaign, 
                          message_type: e.target.value as 'text' | 'media',
                          has_media: false 
                        })}
                        className="mr-2"
                      />
                      Apenas Texto
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="messageType"
                        value="media"
                        checked={newCampaign.message_type === 'media'}
                        onChange={(e) => setNewCampaign({ 
                          ...newCampaign, 
                          message_type: e.target.value as 'text' | 'media',
                          has_media: true 
                        })}
                        className="mr-2"
                      />
                      Com Mídia
                    </label>
                  </div>
                </div>

                {/* Configurações de Mídia */}
                {newCampaign.has_media && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        URL da Mídia
                      </label>
                      <input
                        type="url"
                        className="input"
                        placeholder="https://exemplo.com/imagem.jpg"
                        value={newCampaign.media_url}
                        onChange={(e) => setNewCampaign({ ...newCampaign, media_url: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Legenda da Mídia
                      </label>
                      <textarea
                        className="textarea"
                        placeholder="Legenda da imagem/vídeo..."
                        value={newCampaign.media_caption}
                        onChange={(e) => setNewCampaign({ ...newCampaign, media_caption: e.target.value })}
                      />
                    </div>
                  </div>
                )}

                {/* Mensagens com Spintax */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Mensagens (Spintax) *
                    </label>
                    <button
                      type="button"
                      onClick={addMessage}
                      className="text-sm text-primary-600 hover:text-primary-700"
                    >
                      + Adicionar Variação
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mb-3">
                    Use {'{opção1|opção2|opção3}'} para criar variações aleatórias
                  </p>
                  
                  {newCampaign.messages.map((message, index) => (
                    <div key={index} className="flex space-x-2 mb-2">
                      <textarea
                        className="textarea flex-1"
                        placeholder={`Mensagem ${index + 1}: {Olá|Oi|E aí} {pessoal|galera}! Como {vocês estão|vai}?`}
                        value={message}
                        onChange={(e) => updateMessage(index, e.target.value)}
                        rows={3}
                      />
                      {newCampaign.messages.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeMessage(index)}
                          className="p-2 text-error-600 hover:bg-error-50 rounded-lg"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowCreateModal(false)
                    resetNewCampaign()
                  }}
                  className="btn btn-secondary"
                >
                  Cancelar
                </button>
                <button
                  onClick={createCampaign}
                  className="btn btn-primary"
                >
                  Criar Campanha
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
