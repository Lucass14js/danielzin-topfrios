import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Função para processar spintax
export function processSpintax(text: string): string {
  return text.replace(/\{([^}]+)\}/g, (match, content) => {
    const options = content.split('|')
    return options[Math.floor(Math.random() * options.length)]
  })
}

// Função para formatar número de telefone brasileiro para WhatsApp
export function formatPhoneForWhatsApp(phone: string, countryCode: string = '55'): string {
  // Remove todos os caracteres não numéricos
  const cleanPhone = phone.replace(/\D/g, '')
  
  // Se já tem código do país, remove
  let phoneNumber = cleanPhone
  if (phoneNumber.startsWith(countryCode)) {
    phoneNumber = phoneNumber.substring(countryCode.length)
  }
  
  // Para números brasileiros (DDI 55)
  if (countryCode === '55') {
    // Se tem 11 dígitos (DDD + 9 + 8 dígitos)
    if (phoneNumber.length === 11) {
      return `${countryCode}${phoneNumber}@s.whatsapp.net`
    }
    // Se tem 10 dígitos (DDD + 8 dígitos), adiciona o 9
    else if (phoneNumber.length === 10) {
      const ddd = phoneNumber.substring(0, 2)
      const number = phoneNumber.substring(2)
      return `${countryCode}${ddd}9${number}@s.whatsapp.net`
    }
  }
  
  return `${countryCode}${phoneNumber}@s.whatsapp.net`
}

// Função para tentar ambas as variações do número (com e sem 9)
export function getPhoneVariations(phone: string, countryCode: string = '55'): string[] {
  const cleanPhone = phone.replace(/\D/g, '')
  let phoneNumber = cleanPhone
  
  if (phoneNumber.startsWith(countryCode)) {
    phoneNumber = phoneNumber.substring(countryCode.length)
  }
  
  if (countryCode === '55' && phoneNumber.length >= 10) {
    const ddd = phoneNumber.substring(0, 2)
    const restNumber = phoneNumber.substring(2)
    
    // Variação com 9
    const withNine = `${countryCode}${ddd}9${restNumber.substring(restNumber.startsWith('9') ? 1 : 0)}@s.whatsapp.net`
    // Variação sem 9
    const withoutNine = `${countryCode}${ddd}${restNumber.startsWith('9') ? restNumber.substring(1) : restNumber}@s.whatsapp.net`
    
    return [withNine, withoutNine]
  }
  
  return [`${countryCode}${phoneNumber}@s.whatsapp.net`]
}

// Função para gerar delay aleatório
export function getRandomDelay(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

// Função para formatar data
export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

// Função para formatar números
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('pt-BR').format(num)
}

// Função para calcular porcentagem
export function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0
  return Math.round((value / total) * 100)
}
