# DanielzinGelado - Sistema de Disparo WhatsApp

Sistema completo de disparo de mensagens WhatsApp usando Evolution API, com interface minimalista e funcionalidades avançadas.

## 🚀 Funcionalidades

### ✅ **SISTEMA COMPLETO IMPLEMENTADO**

#### **Dashboard Inteligente**
- Estatísticas em tempo real
- Visão geral de campanhas, instâncias e contatos
- Métricas de performance
- Ações rápidas para criação

#### **Gerenciamento de Instâncias WhatsApp**
- Conectar/desconectar instâncias automaticamente
- Visualizar QR codes em tempo real
- Monitorar status de conexão
- **Webhook configurado automaticamente** 🆕
- Reiniciar e gerenciar instâncias

#### **Sistema de Audiências Completo**
- **Importar contatos via planilha CSV** 📊
- **Verificação automática de WhatsApp** com regras brasileiras
- **Exportar audiências** atualizadas
- Suporte a números com/sem 9º dígito
- Controle de status (ativo/inativo)

#### **Sistema de Campanhas Avançado**
- **Spintax completo** - {variação1|variação2|variação3} 🔄
- **Delays randomizados** entre mensagens (5-15s configurável)
- **Controle de "digitando"** (1-3s configurável)
- **Mensagens com/sem mídia** (imagens, vídeos)
- **Processamento em background** não-bloqueante
- **Múltiplas variações** de mensagem por campanha

#### **Webhook Inteligente**
- **Filtragem automática** - apenas contatos conhecidos 🎯
- Sincronização em tempo real
- Eventos: conexão, QR code, mensagens, status
- **Não salva eventos desnecessários**

#### **Relatórios e Estatísticas**
- **Controle total** de mensagens enviadas/entregues/lidas/falhadas
- **Análise de performance** por campanha
- **Filtros por data** personalizáveis
- **Taxa de entrega e leitura** calculadas automaticamente
- **Top campanhas** e estatísticas por instância

#### **Configurações Avançadas**
- **Configuração de delays padrão**
- **Teste de webhook** integrado
- **Configurações de reenvio**
- **Controles de concorrência**

## 🛠 Tecnologias

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Banco de Dados**: Supabase (PostgreSQL)
- **WhatsApp API**: Evolution API
- **UI**: Lucide React Icons, React Hot Toast

## 📋 Pré-requisitos

1. **Evolution API** rodando (localhost:8080 ou servidor)
2. **Supabase** projeto configurado
3. **Node.js** 18+ instalado

## 🚀 Instalação

1. **Clone o repositório**
```bash
git clone <repo-url>
cd DanielzinGelado
```

2. **Instale as dependências**
```bash
npm install
```

3. **Configure as variáveis de ambiente**
```bash
cp env.example .env.local
```

Edite o `.env.local` com suas configurações:
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Evolution API
EVOLUTION_API_URL=http://localhost:8080
EVOLUTION_API_KEY=your_evolution_api_key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

4. **Configure o banco de dados**

Execute os comandos SQL fornecidos no Supabase para criar as tabelas.

5. **Inicie o servidor**
```bash
npm run dev
```

## 📊 Estrutura do Banco de Dados

### Tabelas Principais
- `instances` - Instâncias WhatsApp
- `audiences` - Audiências/listas de contatos
- `contacts` - Contatos individuais
- `campaigns` - Campanhas de mensagens
- `campaign_messages` - Mensagens com spintax
- `campaign_contacts` - Relacionamento campanha-contatos
- `webhook_events` - Eventos recebidos via webhook

## 🔗 Integração Evolution API

### Eventos de Webhook Configurados
- `QRCODE_UPDATED` - Atualização de QR codes
- `MESSAGES_UPSERT` - Mensagens recebidas
- `MESSAGES_UPDATE` - Status de mensagens (entregue/lida)
- `SEND_MESSAGE` - Confirmação de envio
- `CONNECTION_UPDATE` - Status de conexão

### Endpoints Utilizados
- Gerenciamento de instâncias
- Verificação de WhatsApp
- Envio de mensagens (texto/mídia)
- Controle de presença ("digitando")

## 📱 Funcionalidades Especiais

### Verificação de WhatsApp Brasileira
- Suporte automático para números com/sem 9
- Formatação correta para DDI 55
- Tentativa em ambas as variações

### Sistema de Spintax
```
{Olá|Oi|E aí} {pessoal|galera|amigos}!
```
Gera variações aleatórias como:
- "Olá pessoal!"
- "Oi galera!"
- "E aí amigos!"

### Delays Inteligentes
- Delay entre mensagens (5-15s configurável)
- Delay de "digitando" (1-3s configurável)
- Randomização para parecer natural

## 🎨 Design

Interface minimalista seguindo princípios de:
- **Alto contraste** para legibilidade
- **Elementos limpos** sem gradientes desnecessários
- **Navegação intuitiva**
- **Responsividade** completa

## 📈 Próximos Passos

1. **Sistema de Audiências** - Importar/exportar contatos
2. **Campanhas Avançadas** - Spintax e scheduling
3. **Relatórios Detalhados** - Analytics completos
4. **Automações** - Fluxos condicionais

## 🤝 Contribuição

Este é um projeto personalizado para DanielzinGelado. Para sugestões ou melhorias, entre em contato.

## 📄 Licença

Projeto privado - Todos os direitos reservados.
# Deploy trigger
