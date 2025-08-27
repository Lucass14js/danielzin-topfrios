'use client'

import { useEffect, useState } from 'react'
import Sidebar from '@/components/Sidebar'
import { 
  Plus, 
  Smartphone, 
  Wifi, 
  WifiOff, 
  RotateCcw, 
  Trash2, 
  QrCode,
  LogOut,
  Settings
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Instance } from '@/lib/types'
import { formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'

export default function InstancesPage() {
  const [instances, setInstances] = useState<Instance[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showQRModal, setShowQRModal] = useState(false)
  const [selectedInstance, setSelectedInstance] = useState<Instance | null>(null)
  const [newInstance, setNewInstance] = useState({
    name: '',
    api_url: '',
    api_key: '',
    proxy_host: '',
    proxy_port: '',
    proxy_username: '',
    proxy_password: ''
  })

  useEffect(() => {
    loadInstances()
    // Carregar dados da Evolution API e Proxy das variáveis de ambiente
    setNewInstance(prev => ({
      ...prev,
      api_url: process.env.NEXT_PUBLIC_EVOLUTION_API_URL || process.env.EVOLUTION_API_URL || '',
      api_key: process.env.NEXT_PUBLIC_EVOLUTION_API_KEY || process.env.EVOLUTION_API_KEY || '',
      proxy_host: process.env.NEXT_PUBLIC_PROXY_HOST || '',
      proxy_port: process.env.NEXT_PUBLIC_PROXY_PORT || '',
      proxy_username: process.env.NEXT_PUBLIC_PROXY_USERNAME || '',
      proxy_password: process.env.NEXT_PUBLIC_PROXY_PASSWORD || ''
    }))
  }, [])

  const loadInstances = async () => {
    try {
      const { data, error } = await supabase
        .from('instances')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setInstances(data || [])
    } catch (error) {
      console.error('Erro ao carregar instâncias:', error)
      toast.error('Erro ao carregar instâncias')
    } finally {
      setLoading(false)
    }
  }

  const createInstance = async () => {
    if (!newInstance.name || !newInstance.api_url || !newInstance.api_key) {
      toast.error('Preencha todos os campos')
      return
    }

    try {
      const { error } = await supabase
        .from('instances')
        .insert([{
          name: newInstance.name,
          api_url: newInstance.api_url,
          api_key: newInstance.api_key,
          status: 'disconnected'
        }])

      if (error) throw error

      toast.success('Instância criada com sucesso!')
      setShowCreateModal(false)
      setNewInstance({ 
        name: '', 
        api_url: process.env.NEXT_PUBLIC_EVOLUTION_API_URL || process.env.EVOLUTION_API_URL || '',
        api_key: process.env.NEXT_PUBLIC_EVOLUTION_API_KEY || process.env.EVOLUTION_API_KEY || '',
        proxy_host: process.env.NEXT_PUBLIC_PROXY_HOST || '',
        proxy_port: process.env.NEXT_PUBLIC_PROXY_PORT || '',
        proxy_username: process.env.NEXT_PUBLIC_PROXY_USERNAME || '',
        proxy_password: process.env.NEXT_PUBLIC_PROXY_PASSWORD || ''
      })
      loadInstances()
    } catch (error) {
      console.error('Erro ao criar instância:', error)
      toast.error('Erro ao criar instância')
    }
  }

  const connectInstance = async (instance: Instance) => {
    try {
      // Aqui você faria a chamada para a Evolution API
      const response = await fetch('/api/instances/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instanceId: instance.id })
      })

      if (!response.ok) throw new Error('Erro ao conectar instância')

      const data = await response.json()
      
      if (data.qrCode) {
        setSelectedInstance({ ...instance, qr_code: data.qrCode })
        setShowQRModal(true)
      }

      toast.success('Conectando instância...')
      loadInstances()
    } catch (error) {
      console.error('Erro ao conectar instância:', error)
      toast.error('Erro ao conectar instância')
    }
  }

  const restartInstance = async (instance: Instance) => {
    try {
      const response = await fetch('/api/instances/restart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instanceId: instance.id })
      })

      if (!response.ok) throw new Error('Erro ao reiniciar instância')

      toast.success('Instância reiniciada!')
      loadInstances()
    } catch (error) {
      console.error('Erro ao reiniciar instância:', error)
      toast.error('Erro ao reiniciar instância')
    }
  }

  const logoutInstance = async (instance: Instance) => {
    try {
      const response = await fetch('/api/instances/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instanceId: instance.id })
      })

      if (!response.ok) throw new Error('Erro ao desconectar instância')

      toast.success('Instância desconectada!')
      loadInstances()
    } catch (error) {
      console.error('Erro ao desconectar instância:', error)
      toast.error('Erro ao desconectar instância')
    }
  }

  const deleteInstance = async (instance: Instance) => {
    if (!confirm('Tem certeza que deseja excluir esta instância?')) return

    try {
      const { error } = await supabase
        .from('instances')
        .delete()
        .eq('id', instance.id)

      if (error) throw error

      toast.success('Instância excluída!')
      loadInstances()
    } catch (error) {
      console.error('Erro ao excluir instância:', error)
      toast.error('Erro ao excluir instância')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'text-success-600 bg-success-50'
      case 'connecting': return 'text-warning-600 bg-warning-50'
      default: return 'text-error-600 bg-error-50'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected': return Wifi
      case 'connecting': return RotateCcw
      default: return WifiOff
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
            <h1 className="text-3xl font-bold text-gray-900">Instâncias WhatsApp</h1>
            <p className="text-gray-600 mt-2">Gerencie suas conexões WhatsApp</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary"
          >
            <Plus className="h-5 w-5 mr-2" />
            Nova Instância
          </button>
        </div>

        {instances.length === 0 ? (
          <div className="card p-12 text-center">
            <Smartphone className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Nenhuma instância encontrada</h3>
            <p className="text-gray-600 mb-6">Crie sua primeira instância WhatsApp para começar</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn btn-primary"
            >
              <Plus className="h-5 w-5 mr-2" />
              Criar Primeira Instância
            </button>
          </div>
        ) : (
          <div className="grid gap-6">
            {instances.map((instance) => {
              const StatusIcon = getStatusIcon(instance.status)
              return (
                <div key={instance.id} className="card p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="p-3 bg-primary-50 rounded-lg">
                        <Smartphone className="h-6 w-6 text-primary-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{instance.name}</h3>
                        <p className="text-sm text-gray-600">{instance.phone_number || 'Não conectado'}</p>
                        <p className="text-xs text-gray-500">Criado em {formatDate(instance.created_at)}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <div className={`flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(instance.status)}`}>
                        <StatusIcon className="h-4 w-4 mr-1" />
                        {instance.status === 'connected' ? 'Conectado' : 
                         instance.status === 'connecting' ? 'Conectando' : 'Desconectado'}
                      </div>

                      <div className="flex space-x-2">
                        {instance.status === 'disconnected' && (
                          <button
                            onClick={() => connectInstance(instance)}
                            className="p-2 text-success-600 hover:bg-success-50 rounded-lg transition-colors"
                            title="Conectar"
                          >
                            <Wifi className="h-5 w-5" />
                          </button>
                        )}

                        {instance.status === 'connected' && (
                          <>
                            <button
                              onClick={() => {
                                setSelectedInstance(instance)
                                setShowQRModal(true)
                              }}
                              className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                              title="Ver QR Code"
                            >
                              <QrCode className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => logoutInstance(instance)}
                              className="p-2 text-warning-600 hover:bg-warning-50 rounded-lg transition-colors"
                              title="Desconectar"
                            >
                              <LogOut className="h-5 w-5" />
                            </button>
                          </>
                        )}

                        <button
                          onClick={() => restartInstance(instance)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Reiniciar"
                        >
                          <RotateCcw className="h-5 w-5" />
                        </button>

                        <button
                          onClick={() => deleteInstance(instance)}
                          className="p-2 text-error-600 hover:bg-error-50 rounded-lg transition-colors"
                          title="Excluir"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Modal de Criar Instância */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Nova Instância</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome da Instância
                  </label>
                  <input
                    type="text"
                    className="input"
                    placeholder="Ex: WhatsApp Principal"
                    value={newInstance.name}
                    onChange={(e) => setNewInstance({ ...newInstance, name: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    URL da Evolution API
                  </label>
                  <input
                    type="url"
                    className="input"
                    placeholder="http://localhost:8080"
                    value={newInstance.api_url}
                    onChange={(e) => setNewInstance({ ...newInstance, api_url: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Chave da API
                  </label>
                  <input
                    type="password"
                    className="input"
                    placeholder="Sua chave da Evolution API"
                    value={newInstance.api_key}
                    onChange={(e) => setNewInstance({ ...newInstance, api_key: e.target.value })}
                  />
                </div>
              </div>

              {/* Configurações de Proxy */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="text-sm font-medium text-gray-900 mb-3">🔒 Configurações de Proxy</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Host do Proxy
                    </label>
                    <input
                      type="text"
                      className="input"
                      placeholder="p.webshare.io"
                      value={newInstance.proxy_host}
                      onChange={(e) => setNewInstance({ ...newInstance, proxy_host: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Porta do Proxy
                    </label>
                    <input
                      type="text"
                      className="input"
                      placeholder="80"
                      value={newInstance.proxy_port}
                      onChange={(e) => setNewInstance({ ...newInstance, proxy_port: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Usuário do Proxy
                    </label>
                    <input
                      type="text"
                      className="input"
                      placeholder="nytyprkr-rotate"
                      value={newInstance.proxy_username}
                      onChange={(e) => setNewInstance({ ...newInstance, proxy_username: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Senha do Proxy
                    </label>
                    <input
                      type="password"
                      className="input"
                      placeholder="t61vqb1kx3qg"
                      value={newInstance.proxy_password}
                      onChange={(e) => setNewInstance({ ...newInstance, proxy_password: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="btn btn-secondary"
                >
                  Cancelar
                </button>
                <button
                  onClick={createInstance}
                  className="btn btn-primary"
                >
                  Criar Instância
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de QR Code */}
        {showQRModal && selectedInstance && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md text-center">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                QR Code - {selectedInstance.name}
              </h2>
              
              {selectedInstance.qr_code ? (
                <div className="mb-4">
                  <img 
                    src={selectedInstance.qr_code} 
                    alt="QR Code" 
                    className="mx-auto border rounded-lg"
                  />
                  <p className="text-sm text-gray-600 mt-2">
                    Escaneie este QR Code com seu WhatsApp
                  </p>
                </div>
              ) : (
                <div className="mb-4 p-8">
                  <QrCode className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Gerando QR Code...</p>
                </div>
              )}

              <button
                onClick={() => setShowQRModal(false)}
                className="btn btn-secondary"
              >
                Fechar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
