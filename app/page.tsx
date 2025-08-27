'use client'

import { useEffect, useState } from 'react'
import Sidebar from '@/components/Sidebar'
import { 
  MessageSquare, 
  Users, 
  Smartphone, 
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  Eye
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { formatNumber } from '@/lib/utils'

interface DashboardStats {
  totalInstances: number
  connectedInstances: number
  totalAudiences: number
  totalContacts: number
  totalCampaigns: number
  activeCampaigns: number
  totalSent: number
  totalDelivered: number
  totalRead: number
  totalFailed: number
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalInstances: 0,
    connectedInstances: 0,
    totalAudiences: 0,
    totalContacts: 0,
    totalCampaigns: 0,
    activeCampaigns: 0,
    totalSent: 0,
    totalDelivered: 0,
    totalRead: 0,
    totalFailed: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardStats()
  }, [])

  const loadDashboardStats = async () => {
    try {
      // Buscar estatísticas das instâncias
      const { data: instances } = await supabase
        .from('instances')
        .select('status')
      
      // Buscar estatísticas das audiências
      const { data: audiences } = await supabase
        .from('audiences')
        .select('total_contacts')
      
      // Buscar estatísticas das campanhas
      const { data: campaigns } = await supabase
        .from('campaigns')
        .select('status, sent_count, delivered_count, read_count, failed_count')

      const totalInstances = instances?.length || 0
      const connectedInstances = instances?.filter(i => i.status === 'connected').length || 0
      const totalAudiences = audiences?.length || 0
      const totalContacts = audiences?.reduce((sum, a) => sum + (a.total_contacts || 0), 0) || 0
      const totalCampaigns = campaigns?.length || 0
      const activeCampaigns = campaigns?.filter(c => c.status === 'active').length || 0
      
      const totalSent = campaigns?.reduce((sum, c) => sum + (c.sent_count || 0), 0) || 0
      const totalDelivered = campaigns?.reduce((sum, c) => sum + (c.delivered_count || 0), 0) || 0
      const totalRead = campaigns?.reduce((sum, c) => sum + (c.read_count || 0), 0) || 0
      const totalFailed = campaigns?.reduce((sum, c) => sum + (c.failed_count || 0), 0) || 0

      setStats({
        totalInstances,
        connectedInstances,
        totalAudiences,
        totalContacts,
        totalCampaigns,
        activeCampaigns,
        totalSent,
        totalDelivered,
        totalRead,
        totalFailed,
      })
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error)
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    {
      title: 'Instâncias Conectadas',
      value: `${stats.connectedInstances}/${stats.totalInstances}`,
      icon: Smartphone,
      color: 'text-primary-600',
      bgColor: 'bg-primary-50',
    },
    {
      title: 'Total de Contatos',
      value: formatNumber(stats.totalContacts),
      icon: Users,
      color: 'text-success-600',
      bgColor: 'bg-success-50',
    },
    {
      title: 'Campanhas Ativas',
      value: `${stats.activeCampaigns}/${stats.totalCampaigns}`,
      icon: MessageSquare,
      color: 'text-warning-600',
      bgColor: 'bg-warning-50',
    },
    {
      title: 'Mensagens Enviadas',
      value: formatNumber(stats.totalSent),
      icon: TrendingUp,
      color: 'text-primary-600',
      bgColor: 'bg-primary-50',
    },
  ]

  const messageStats = [
    {
      title: 'Enviadas',
      value: formatNumber(stats.totalSent),
      icon: Clock,
      color: 'text-blue-600',
    },
    {
      title: 'Entregues',
      value: formatNumber(stats.totalDelivered),
      icon: CheckCircle,
      color: 'text-success-600',
    },
    {
      title: 'Lidas',
      value: formatNumber(stats.totalRead),
      icon: Eye,
      color: 'text-green-600',
    },
    {
      title: 'Falharam',
      value: formatNumber(stats.totalFailed),
      icon: XCircle,
      color: 'text-error-600',
    },
  ]

  if (loading) {
    return (
      <div className="flex">
        <Sidebar />
        <div className="flex-1 p-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="card p-6">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">Visão geral do sistema de disparo WhatsApp</p>
        </div>

        {/* Cards de estatísticas principais */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((stat, index) => (
            <div key={index} className="card p-6">
              <div className="flex items-center">
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Estatísticas de mensagens */}
        <div className="card p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Estatísticas de Mensagens</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {messageStats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="flex justify-center mb-2">
                  <stat.icon className={`h-8 w-8 ${stat.color}`} />
                </div>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-sm text-gray-600">{stat.title}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Ações rápidas */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card p-6 text-center">
            <Smartphone className="h-12 w-12 text-primary-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Nova Instância</h3>
            <p className="text-gray-600 mb-4">Conecte uma nova instância WhatsApp</p>
            <a href="/instances" className="btn btn-primary">
              Gerenciar Instâncias
            </a>
          </div>

          <div className="card p-6 text-center">
            <Users className="h-12 w-12 text-success-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Nova Audiência</h3>
            <p className="text-gray-600 mb-4">Importe contatos para campanhas</p>
            <a href="/audiences" className="btn btn-success">
              Gerenciar Audiências
            </a>
          </div>

          <div className="card p-6 text-center">
            <MessageSquare className="h-12 w-12 text-warning-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Nova Campanha</h3>
            <p className="text-gray-600 mb-4">Crie uma campanha de mensagens</p>
            <a href="/campaigns" className="btn btn-warning">
              Criar Campanha
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
