export interface Instance {
  id: string
  name: string
  api_url: string
  api_key: string
  status: 'connected' | 'disconnected' | 'connecting'
  qr_code?: string
  phone_number?: string
  created_at: string
  updated_at: string
}

export interface Audience {
  id: string
  name: string
  description?: string
  total_contacts: number
  active_contacts: number
  created_at: string
  updated_at: string
}

export interface Contact {
  id: string
  audience_id: string
  name: string
  phone: string
  formatted_phone?: string
  tag?: string
  status: 'active' | 'inactive'
  has_whatsapp?: boolean
  whatsapp_name?: string
  observations?: string
  created_at: string
  updated_at: string
}

export interface Campaign {
  id: string
  name: string
  description?: string
  instance_id: string
  audience_id: string
  status: 'draft' | 'active' | 'paused' | 'completed' | 'cancelled'
  message_type: 'text' | 'media'
  has_media: boolean
  media_url?: string
  media_caption?: string
  delay_min: number
  delay_max: number
  typing_delay_min: number
  typing_delay_max: number
  total_contacts: number
  sent_count: number
  delivered_count: number
  read_count: number
  failed_count: number
  started_at?: string
  completed_at?: string
  created_at: string
  updated_at: string
}

export interface CampaignMessage {
  id: string
  campaign_id: string
  message_text: string
  order_index: number
  created_at: string
}

export interface CampaignContact {
  id: string
  campaign_id: string
  contact_id: string
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed'
  message_sent?: string
  sent_at?: string
  delivered_at?: string
  read_at?: string
  failed_at?: string
  error_message?: string
  evolution_message_id?: string
  created_at: string
  updated_at: string
}

export interface WebhookEvent {
  id: string
  instance_name?: string
  event_type: string
  event_data: any
  message_id?: string
  remote_jid?: string
  processed: boolean
  created_at: string
}

// Tipos para a Evolution API
export interface EvolutionMessage {
  number: string
  text?: string
  media?: string
  caption?: string
  delay?: number
}

export interface EvolutionResponse {
  key: {
    remoteJid: string
    fromMe: boolean
    id: string
  }
  message: any
  messageTimestamp: string
  status: string
}

export interface SpintaxOptions {
  text: string
}

// Tipos para importação de contatos
export interface ImportContact {
  name: string
  phone: string
  tag?: string
  status: 'active' | 'inactive'
  observations?: string
}
