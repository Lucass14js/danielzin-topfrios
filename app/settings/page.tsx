'use client'

import { useState } from 'react'
import Sidebar from '@/components/Sidebar'
import { 
  Settings as SettingsIcon, 
  Globe, 
  Shield, 
  Bell, 
  Database,
  Webhook,
  Save,
  TestTube
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    webhookUrl: process.env.NEXT_PUBLIC_APP_URL + '/api/webhook/evolution',
    defaultDelayMin: 5,
    defaultDelayMax: 15,
    defaultTypingDelayMin: 1000,
    defaultTypingDelayMax: 3000,
    autoVerifyWhatsApp: true,
    enableNotifications: true,
    maxConcurrentMessages: 10,
    retryFailedMessages: true,
    maxRetryAttempts: 3
  })

  const [testingWebhook, setTestingWebhook] = useState(false)

  const saveSettings = async () => {
    try {
      // Aqui você salvaria as configurações no banco ou localStorage
      localStorage.setItem('danielzin-settings', JSON.stringify(settings))
      toast.success('Configurações salvas com sucesso!')
    } catch (error) {
      console.error('Erro ao salvar configurações:', error)
      toast.error('Erro ao salvar configurações')
    }
  }

  const testWebhook = async () => {
    setTestingWebhook(true)
    try {
      const response = await fetch('/api/webhook/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: settings.webhookUrl })
      })

      if (response.ok) {
        toast.success('Webhook testado com sucesso!')
      } else {
        toast.error('Falha no teste do webhook')
      }
    } catch (error) {
      console.error('Erro no teste:', error)
      toast.error('Erro ao testar webhook')
    } finally {
      setTestingWebhook(false)
    }
  }

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Configurações</h1>
          <p className="text-gray-600 mt-2">Configure o comportamento do sistema</p>
        </div>

        <div className="max-w-4xl space-y-6">
          {/* Configurações de Webhook */}
          <div className="card p-6">
            <div className="flex items-center mb-4">
              <Webhook className="h-6 w-6 text-primary-600 mr-3" />
              <h2 className="text-xl font-semibold text-gray-900">Webhook</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL do Webhook
                </label>
                <div className="flex space-x-2">
                  <input
                    type="url"
                    className="input flex-1"
                    value={settings.webhookUrl}
                    onChange={(e) => setSettings({ ...settings, webhookUrl: e.target.value })}
                    placeholder="https://seu-dominio.com/api/webhook/evolution"
                  />
                  <button
                    onClick={testWebhook}
                    disabled={testingWebhook}
                    className="btn btn-secondary"
                  >
                    <TestTube className="h-4 w-4 mr-2" />
                    {testingWebhook ? 'Testando...' : 'Testar'}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Esta URL será configurada automaticamente em todas as instâncias
                </p>
              </div>
            </div>
          </div>

          {/* Configurações de Mensagens */}
          <div className="card p-6">
            <div className="flex items-center mb-4">
              <Bell className="h-6 w-6 text-success-600 mr-3" />
              <h2 className="text-xl font-semibold text-gray-900">Mensagens</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Delay Padrão entre Mensagens (segundos)
                </label>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    className="input"
                    placeholder="Min"
                    value={settings.defaultDelayMin}
                    onChange={(e) => setSettings({ ...settings, defaultDelayMin: parseInt(e.target.value) || 5 })}
                  />
                  <input
                    type="number"
                    className="input"
                    placeholder="Max"
                    value={settings.defaultDelayMax}
                    onChange={(e) => setSettings({ ...settings, defaultDelayMax: parseInt(e.target.value) || 15 })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Delay "Digitando" Padrão (milissegundos)
                </label>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    className="input"
                    placeholder="Min"
                    value={settings.defaultTypingDelayMin}
                    onChange={(e) => setSettings({ ...settings, defaultTypingDelayMin: parseInt(e.target.value) || 1000 })}
                  />
                  <input
                    type="number"
                    className="input"
                    placeholder="Max"
                    value={settings.defaultTypingDelayMax}
                    onChange={(e) => setSettings({ ...settings, defaultTypingDelayMax: parseInt(e.target.value) || 3000 })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Máximo de Mensagens Simultâneas
                </label>
                <input
                  type="number"
                  className="input"
                  value={settings.maxConcurrentMessages}
                  onChange={(e) => setSettings({ ...settings, maxConcurrentMessages: parseInt(e.target.value) || 10 })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tentativas de Reenvio
                </label>
                <input
                  type="number"
                  className="input"
                  value={settings.maxRetryAttempts}
                  onChange={(e) => setSettings({ ...settings, maxRetryAttempts: parseInt(e.target.value) || 3 })}
                />
              </div>
            </div>
          </div>

          {/* Configurações Gerais */}
          <div className="card p-6">
            <div className="flex items-center mb-4">
              <SettingsIcon className="h-6 w-6 text-gray-600 mr-3" />
              <h2 className="text-xl font-semibold text-gray-900">Geral</h2>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Verificação Automática de WhatsApp</h3>
                  <p className="text-sm text-gray-500">Verificar automaticamente se os contatos têm WhatsApp ao importar</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={settings.autoVerifyWhatsApp}
                    onChange={(e) => setSettings({ ...settings, autoVerifyWhatsApp: e.target.checked })}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Notificações</h3>
                  <p className="text-sm text-gray-500">Receber notificações sobre campanhas e eventos</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={settings.enableNotifications}
                    onChange={(e) => setSettings({ ...settings, enableNotifications: e.target.checked })}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Retentar Mensagens Falhadas</h3>
                  <p className="text-sm text-gray-500">Tentar reenviar mensagens que falharam automaticamente</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={settings.retryFailedMessages}
                    onChange={(e) => setSettings({ ...settings, retryFailedMessages: e.target.checked })}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Informações do Sistema */}
          <div className="card p-6">
            <div className="flex items-center mb-4">
              <Database className="h-6 w-6 text-blue-600 mr-3" />
              <h2 className="text-xl font-semibold text-gray-900">Sistema</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Versão:</span>
                <span className="ml-2 text-gray-600">1.0.0</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Banco de Dados:</span>
                <span className="ml-2 text-gray-600">Supabase</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">API WhatsApp:</span>
                <span className="ml-2 text-gray-600">Evolution API v2</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Ambiente:</span>
                <span className="ml-2 text-gray-600">
                  {process.env.NODE_ENV === 'production' ? 'Produção' : 'Desenvolvimento'}
                </span>
              </div>
            </div>
          </div>

          {/* Botão de Salvar */}
          <div className="flex justify-end">
            <button
              onClick={saveSettings}
              className="btn btn-primary"
            >
              <Save className="h-5 w-5 mr-2" />
              Salvar Configurações
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
