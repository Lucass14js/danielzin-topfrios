import axios from 'axios'
import { EvolutionMessage, EvolutionResponse } from './types'

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || 'http://localhost:8080'
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || ''

const api = axios.create({
  baseURL: EVOLUTION_API_URL,
  headers: {
    'Content-Type': 'application/json',
    'apikey': EVOLUTION_API_KEY,
  },
})

export class EvolutionAPI {
  // Gerenciamento de instâncias
  static async createInstance(instanceName: string, proxyConfig?: {
    host?: string;
    port?: string;
    username?: string;
    password?: string;
  }) {
    const payload: any = {
      instanceName,
      qrcode: true,
      integration: 'WHATSAPP-BAILEYS'
    }

    // Adicionar configurações de proxy se fornecidas
    if (proxyConfig?.host && proxyConfig?.port) {
      payload.proxyHost = proxyConfig.host
      payload.proxyPort = proxyConfig.port
      payload.proxyProtocol = 'HTTP'
      
      if (proxyConfig.username) {
        payload.proxyUsername = proxyConfig.username
      }
      
      if (proxyConfig.password) {
        payload.proxyPassword = proxyConfig.password
      }
    }

    const response = await api.post('/instance/create', payload)
    return response.data
  }

  static async connectInstance(instanceName: string) {
    const response = await api.get(`/instance/connect/${instanceName}`)
    return response.data
  }

  static async getInstanceStatus(instanceName: string) {
    const response = await api.get(`/instance/connectionState/${instanceName}`)
    return response.data
  }

  static async restartInstance(instanceName: string) {
    const response = await api.put(`/instance/restart/${instanceName}`)
    return response.data
  }

  static async deleteInstance(instanceName: string) {
    const response = await api.delete(`/instance/delete/${instanceName}`)
    return response.data
  }

  static async logoutInstance(instanceName: string) {
    const response = await api.delete(`/instance/logout/${instanceName}`)
    return response.data
  }

  // Verificação de WhatsApp
  static async checkWhatsApp(instanceName: string, phone: string): Promise<{ exists: boolean, name?: string }> {
    try {
      const response = await api.post(`/chat/whatsappNumbers/${instanceName}`, {
        numbers: [phone]
      })
      
      const result = response.data?.[0]
      return {
        exists: result?.exists || false,
        name: result?.name
      }
    } catch (error) {
      console.error('Erro ao verificar WhatsApp:', error)
      return { exists: false }
    }
  }

  // Envio de mensagens
  static async sendTextMessage(instanceName: string, message: EvolutionMessage): Promise<EvolutionResponse> {
    const response = await api.post(`/message/sendText/${instanceName}`, message)
    return response.data
  }

  static async sendMediaMessage(instanceName: string, message: EvolutionMessage): Promise<EvolutionResponse> {
    const response = await api.post(`/message/sendMedia/${instanceName}`, {
      number: message.number,
      media: message.media,
      caption: message.caption,
      delay: message.delay
    })
    return response.data
  }

  // Presença (digitando)
  static async sendPresence(instanceName: string, phone: string, presence: 'composing' | 'paused' = 'composing') {
    try {
      await api.post(`/chat/sendPresence/${instanceName}`, {
        number: phone,
        presence
      })
    } catch (error) {
      console.error('Erro ao enviar presença:', error)
    }
  }

  // Configurar webhook
  static async setWebhook(instanceName: string, webhookUrl: string) {
    const response = await api.post(`/webhook/set/${instanceName}`, {
      url: webhookUrl,
      webhook_by_events: false,
      webhook_base64: false,
      events: [
        'QRCODE_UPDATED',
        'MESSAGES_UPSERT',
        'MESSAGES_UPDATE',
        'SEND_MESSAGE',
        'CONNECTION_UPDATE'
      ]
    })
    return response.data
  }

  // Obter webhook configurado
  static async getWebhook(instanceName: string) {
    const response = await api.get(`/webhook/find/${instanceName}`)
    return response.data
  }
}
