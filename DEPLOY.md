# 🚀 Deploy do Sistema DanielzinGelado

## 📋 Pré-requisitos

1. **Conta na Vercel** (gratuita)
2. **Supabase configurado** com as tabelas criadas
3. **Evolution API** rodando em servidor externo

## 🔧 Deploy na Vercel

### 1. Instalar Vercel CLI
```bash
npm install -g vercel
```

### 2. Fazer Login
```bash
vercel login
```

### 3. Deploy do Projeto
```bash
# Na pasta do projeto
vercel --prod
```

### 4. Configurar Variáveis de Ambiente

Na dashboard da Vercel, vá em **Settings > Environment Variables** e adicione:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://gwegatclgakbjdpkjrve.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd3ZWdhdGNsZ2FrYmpkcGtqcnZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMTk2NjUsImV4cCI6MjA3MTg5NTY2NX0.m9V9tMC4ouTWHXH3sraDf66vdSvVfAKJv4gojYvh1lc
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd3ZWdhdGNsZ2FrYmpkcGtqcnZlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjMxOTY2NSwiZXhwIjoyMDcxODk1NjY1fQ.Tl_sJDjQJMZRkzbWhXc5jljRvCab18a4ttAxeBjxCUM

# Evolution API
EVOLUTION_API_URL=https://evolution.v2.waspy.pro
EVOLUTION_API_KEY=c266d32c741da97e8308221f65e1f015

# Webhook
WEBHOOK_SECRET=2bb80d537b1da3e38bd30361aa855686bde0eacd7162fef6a25fe97bf527a25b

# App URL (será sua URL da Vercel)
NEXT_PUBLIC_APP_URL=https://seu-projeto.vercel.app
```

### 5. Redeploy
```bash
vercel --prod
```

## 🌐 Alternativas de Deploy

### **Railway** (Recomendado para APIs)
```bash
# Instalar Railway CLI
npm install -g @railway/cli

# Login e deploy
railway login
railway init
railway up
```

### **Render**
1. Conecte seu repositório GitHub
2. Configure as variáveis de ambiente
3. Deploy automático

### **Ngrok** (Apenas para desenvolvimento)
```bash
# Instalar ngrok
npm install -g ngrok

# Rodar o projeto local
npm run dev

# Em outro terminal, expor
ngrok http 3000

# Copiar a URL HTTPS gerada
# Exemplo: https://abc123.ngrok.io
```

## ✅ Verificação Pós-Deploy

1. **Acesse sua URL** e verifique se o dashboard carrega
2. **Teste uma instância** - o webhook deve ser configurado automaticamente
3. **Verifique os logs** da Vercel para confirmar que não há erros

## 🔧 Configuração Automática do Webhook

O sistema agora detecta automaticamente a URL correta:

- ✅ **Produção**: Usa a URL da Vercel/Railway/Render
- ✅ **Desenvolvimento**: Pode usar ngrok
- ✅ **Fallback**: Detecta pela requisição HTTP

## 📝 Comandos Úteis

```bash
# Ver logs da Vercel
vercel logs

# Ver deployments
vercel ls

# Remover projeto
vercel remove
```

## 🚨 Importante

- **Nunca commite** arquivos `.env` com secrets
- **Use** variáveis de ambiente na plataforma de deploy
- **Teste** o webhook após cada deploy
- **Monitore** os logs para erros

## 🎯 URL Final

Após o deploy, sua URL será algo como:
- **Vercel**: `https://danielzin-gelado.vercel.app`
- **Railway**: `https://danielzin-gelado.up.railway.app`
- **Render**: `https://danielzin-gelado.onrender.com`

O webhook será configurado automaticamente como:
`https://sua-url.com/api/webhook/evolution`
