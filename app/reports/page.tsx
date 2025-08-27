'use client'

import { useEffect, useState } from 'react'
import Sidebar from '@/components/Sidebar'
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  MessageSquare,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  Download,
  Filter
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { formatDate, formatNumber, calculatePercentage } from '@/lib/utils'

interface ReportData {
  totalCampaigns: number
  activeCampaigns: number
  totalContacts: number
  totalSent: number
  totalDelivered: number
  totalRead: number
  totalFailed: number
  campaignStats: any[]
  audienceStats: any[]
  instanceStats: any[]
}

export default function ReportsPage() {
  const [reportData, setReportData] = useState<ReportData>({
    totalCampaigns: 0,
    activeCampaigns: 0,
    totalContacts: 0,
    totalSent: 0,
    totalDelivered: 0,
    totalRead: 0,
    totalFailed: 0,
    campaignStats: [],
    audienceStats: [],
    instanceStats: []
  })
  const [loading, setLoading] = useState(true)
  const [dateFilter, setDateFilter] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 dias atrás
    endDate: new Date().toISOString().split('T')[0]
  })

  useEffect(() => {
    loadReportData()
  }, [dateFilter])

  const loadReportData = async () => {
    try {
      setLoading(true)

      // Buscar estatísticas gerais
      const [campaignsRes, audiencesRes, instancesRes] = await Promise.all([
        supabase
          .from('campaigns')
          .select('*')
          .gte('created_at', `${dateFilter.startDate}T00:00:00`)
          .lte('created_at', `${dateFilter.endDate}T23:59:59`),
        supabase.from('audiences').select('*'),
        supabase.from('instances').select('*')
      ])

      const campaigns = campaignsRes.data || []
      const audiences = audiencesRes.data || []
      const instances = instancesRes.data || []

      // Calcular estatísticas
      const totalCampaigns = campaigns.length
      const activeCampaigns = campaigns.filter(c => c.status === 'active').length
      const totalContacts = audiences.reduce((sum, a) => sum + (a.total_contacts || 0), 0)
      const totalSent = campaigns.reduce((sum, c) => sum + (c.sent_count || 0), 0)
      const totalDelivered = campaigns.reduce((sum, c) => sum + (c.delivered_count || 0), 0)
      const totalRead = campaigns.reduce((sum, c) => sum + (c.read_count || 0), 0)
      const totalFailed = campaigns.reduce((sum, c) => sum + (c.failed_count || 0), 0)

      // Estatísticas por campanha
      const campaignStats = campaigns.map(campaign => ({
        ...campaign,
        deliveryRate: calculatePercentage(campaign.delivered_count, campaign.sent_count),
        readRate: calculatePercentage(campaign.read_count, campaign.delivered_count),
        successRate: calculatePercentage(campaign.sent_count - campaign.failed_count, campaign.total_contacts)
      }))

      // Estatísticas por audiência
      const audienceStats = audiences.map(audience => ({
        ...audience,
        whatsappRate: 0 // Será calculado se necessário
      }))

      // Estatísticas por instância
      const instanceStats = instances.map(instance => {
        const instanceCampaigns = campaigns.filter(c => c.instance_id === instance.id)
        const instanceSent = instanceCampaigns.reduce((sum, c) => sum + (c.sent_count || 0), 0)
        const instanceDelivered = instanceCampaigns.reduce((sum, c) => sum + (c.delivered_count || 0), 0)
        
        return {
          ...instance,
          campaignCount: instanceCampaigns.length,
          totalSent: instanceSent,
          totalDelivered: instanceDelivered,
          deliveryRate: calculatePercentage(instanceDelivered, instanceSent)
        }
      })

      setReportData({
        totalCampaigns,
        activeCampaigns,
        totalContacts,
        totalSent,
        totalDelivered,
        totalRead,
        totalFailed,
        campaignStats: campaignStats.slice(0, 10), // Top 10
        audienceStats: audienceStats.slice(0, 10),
        instanceStats
      })

    } catch (error) {
      console.error('Erro ao carregar relatórios:', error)
    } finally {
      setLoading(false)
    }
  }

  const exportReport = () => {
    // Implementar exportação para CSV/PDF
    console.log('Exportar relatório')
  }

  const deliveryRate = calculatePercentage(reportData.totalDelivered, reportData.totalSent)
  const readRate = calculatePercentage(reportData.totalRead, reportData.totalDelivered)
  const failureRate = calculatePercentage(reportData.totalFailed, reportData.totalSent)

  if (loading) {
    return (
      <div className="flex">
        <Sidebar />
        <div className="flex-1 p-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Relatórios</h1>
            <p className="text-gray-600 mt-2">Análise detalhada das suas campanhas</p>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-gray-500" />
              <input
                type="date"
                value={dateFilter.startDate}
                onChange={(e) => setDateFilter({ ...dateFilter, startDate: e.target.value })}
                className="input text-sm"
              />
              <span className="text-gray-500">até</span>
              <input
                type="date"
                value={dateFilter.endDate}
                onChange={(e) => setDateFilter({ ...dateFilter, endDate: e.target.value })}
                className="input text-sm"
              />
            </div>
            
            <button
              onClick={exportReport}
              className="btn btn-secondary"
            >
              <Download className="h-5 w-5 mr-2" />
              Exportar
            </button>
          </div>
        </div>

        {/* Cards de estatísticas principais */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="card p-6">
            <div className="flex items-center">
              <div className="p-3 bg-primary-50 rounded-lg">
                <MessageSquare className="h-6 w-6 text-primary-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Campanhas</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatNumber(reportData.totalCampaigns)}
                </p>
                <p className="text-xs text-gray-500">
                  {reportData.activeCampaigns} ativas
                </p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center">
              <div className="p-3 bg-success-50 rounded-lg">
                <Users className="h-6 w-6 text-success-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Contatos</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatNumber(reportData.totalContacts)}
                </p>
                <p className="text-xs text-gray-500">Total cadastrado</p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-50 rounded-lg">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Enviadas</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatNumber(reportData.totalSent)}
                </p>
                <p className="text-xs text-gray-500">
                  {deliveryRate}% entregues
                </p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-50 rounded-lg">
                <Eye className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Lidas</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatNumber(reportData.totalRead)}
                </p>
                <p className="text-xs text-gray-500">
                  {readRate}% das entregues
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Gráfico de performance */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Geral</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-success-600 mr-2" />
                  <span className="text-sm text-gray-600">Taxa de Entrega</span>
                </div>
                <div className="text-right">
                  <span className="text-lg font-semibold text-gray-900">{deliveryRate}%</span>
                  <div className="w-32 bg-gray-200 rounded-full h-2 ml-2">
                    <div 
                      className="bg-success-600 h-2 rounded-full" 
                      style={{ width: `${deliveryRate}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Eye className="h-5 w-5 text-green-600 mr-2" />
                  <span className="text-sm text-gray-600">Taxa de Leitura</span>
                </div>
                <div className="text-right">
                  <span className="text-lg font-semibold text-gray-900">{readRate}%</span>
                  <div className="w-32 bg-gray-200 rounded-full h-2 ml-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full" 
                      style={{ width: `${readRate}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <XCircle className="h-5 w-5 text-error-600 mr-2" />
                  <span className="text-sm text-gray-600">Taxa de Falha</span>
                </div>
                <div className="text-right">
                  <span className="text-lg font-semibold text-gray-900">{failureRate}%</span>
                  <div className="w-32 bg-gray-200 rounded-full h-2 ml-2">
                    <div 
                      className="bg-error-600 h-2 rounded-full" 
                      style={{ width: `${failureRate}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Distribuição de Status</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-success-600">
                  {formatNumber(reportData.totalDelivered)}
                </div>
                <div className="text-sm text-gray-600">Entregues</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {formatNumber(reportData.totalRead)}
                </div>
                <div className="text-sm text-gray-600">Lidas</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-error-600">
                  {formatNumber(reportData.totalFailed)}
                </div>
                <div className="text-sm text-gray-600">Falharam</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-600">
                  {formatNumber(reportData.totalSent - reportData.totalDelivered - reportData.totalFailed)}
                </div>
                <div className="text-sm text-gray-600">Pendentes</div>
              </div>
            </div>
          </div>
        </div>

        {/* Top Campanhas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Campanhas</h3>
            <div className="space-y-3">
              {reportData.campaignStats.length === 0 ? (
                <p className="text-gray-500 text-center py-4">Nenhuma campanha encontrada</p>
              ) : (
                reportData.campaignStats.map((campaign, index) => (
                  <div key={campaign.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{campaign.name}</p>
                      <p className="text-sm text-gray-600">
                        {formatNumber(campaign.sent_count)} enviadas • {campaign.deliveryRate}% entregues
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        campaign.status === 'completed' ? 'bg-success-50 text-success-600' :
                        campaign.status === 'active' ? 'bg-blue-50 text-blue-600' :
                        'bg-gray-50 text-gray-600'
                      }`}>
                        {campaign.status === 'completed' ? 'Concluída' :
                         campaign.status === 'active' ? 'Ativa' : 'Rascunho'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Instâncias</h3>
            <div className="space-y-3">
              {reportData.instanceStats.length === 0 ? (
                <p className="text-gray-500 text-center py-4">Nenhuma instância encontrada</p>
              ) : (
                reportData.instanceStats.map((instance) => (
                  <div key={instance.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{instance.name}</p>
                      <p className="text-sm text-gray-600">
                        {instance.campaignCount} campanhas • {formatNumber(instance.totalSent)} enviadas
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        instance.status === 'connected' ? 'bg-success-50 text-success-600' :
                        'bg-error-50 text-error-600'
                      }`}>
                        {instance.status === 'connected' ? 'Conectada' : 'Desconectada'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
