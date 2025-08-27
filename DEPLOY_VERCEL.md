# 🚀 Deploy na Vercel - DanielzinGelado WhatsApp

## Pré-requisitos

1. **Conta na Vercel**: [vercel.com](https://vercel.com)
2. **Projeto no GitHub**: Faça push do seu código para um repositório GitHub

## Passo a Passo

### 1. Preparar o Projeto

```bash
# Fazer commit de todas as alterações
git add .
git commit -m "Preparar para deploy na Vercel"
git push origin main
```

### 2. Deploy na Vercel

1. **Acesse [vercel.com](https://vercel.com)** e faça login
2. **Clique em "New Project"**
3. **Conecte seu repositório GitHub**
4. **Configure o projeto:**
   - Framework Preset: **Next.js**
   - Root Directory: **/** (raiz)
   - Build Command: `npm run build`
   - Output Directory: `.next`

### 3. Configurar Variáveis de Ambiente

Na página do projeto na Vercel, vá em **Settings > Environment Variables** e adicione:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://gwegatclgakbjdpkjrve.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd3ZWdhdGNsZ2FrYmpkcGtqcnZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMTk2NjUsImV4cCI6MjA3MTg5NTY2NX0.m9V9tMC4ouTWHXH3sraDf66vdSvVfAKJv4gojYvh1lc
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd3ZWdhdGNsZ2FrYmpkcGtqcnZlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjMxOTY2NSwiZXhwIjoyMDcxODk1NjY1fQ.Tl_sJDjQJMZRkzbWhXc5jljRvCab18a4ttAxeBjxCUM

# Evolution API
EVOLUTION_API_URL=https://evolution.v2.waspy.pro
EVOLUTION_API_KEY=c266d32c741da97e8308221f65e1f015
NEXT_PUBLIC_EVOLUTION_API_URL=https://evolution.v2.waspy.pro
NEXT_PUBLIC_EVOLUTION_API_KEY=c266d32c741da97e8308221f65e1f015

# Proxy Configuration
NEXT_PUBLIC_PROXY_HOST=p.webshare.io
NEXT_PUBLIC_PROXY_PORT=80
NEXT_PUBLIC_PROXY_USERNAME=nytyprkr-rotate
NEXT_PUBLIC_PROXY_PASSWORD=t61vqb1kx3qg

# Webhook
WEBHOOK_SECRET=2bb80d537b1da3e38bd30361aa855686bde0eacd7162fef6a25fe97bf527a25b

# App URL (IMPORTANTE: Substituir pela URL da Vercel)
NEXT_PUBLIC_APP_URL=https://seu-projeto.vercel.app
```

### 4. Atualizar URL do App

Após o deploy, você receberá uma URL como `https://danielzin-gelado-whatsapp.vercel.app`

**IMPORTANTE**: Volte nas variáveis de ambiente e atualize:
```env
NEXT_PUBLIC_APP_URL=https://danielzin-gelado-whatsapp.vercel.app
```

### 5. Configurar Webhook na Evolution API

Com a URL da Vercel, o webhook será automaticamente configurado como:
```
https://danielzin-gelado-whatsapp.vercel.app/api/webhook/evolution
```

## Comandos Úteis

### Deploy Local para Teste
```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy local
vercel --prod
```

### Verificar Logs
```bash
# Ver logs da aplicação
vercel logs https://seu-projeto.vercel.app
```

### Redeploy
```bash
# Fazer redeploy após mudanças
git push origin main
# A Vercel fará redeploy automaticamente
```

## Troubleshooting

### ❌ Erro de Build
- Verifique se todas as dependências estão no `package.json`
- Execute `npm run build` localmente para testar

### ❌ Erro de Variáveis de Ambiente
- Certifique-se de que todas as variáveis estão configuradas na Vercel
- Variáveis que começam com `NEXT_PUBLIC_` são acessíveis no cliente

### ❌ Webhook não funciona
- Verifique se `NEXT_PUBLIC_APP_URL` está correto
- Teste o endpoint: `https://seu-projeto.vercel.app/api/webhook/evolution`

### ❌ Erro de CORS
- A Evolution API deve aceitar requisições da sua URL da Vercel
- Verifique as configurações de CORS na Evolution API

## Monitoramento

### Logs da Aplicação
- **Vercel Dashboard**: Veja logs em tempo real
- **Console do Navegador**: Para erros do cliente
- **API Logs**: Para erros do servidor

### Performance
- A Vercel oferece métricas de performance automáticas
- Edge Functions para melhor performance global

## Domínio Personalizado (Opcional)

1. **Compre um domínio** (ex: `danielzingelado.com`)
2. **Na Vercel**: Settings > Domains
3. **Adicione o domínio** e configure DNS
4. **Atualize** `NEXT_PUBLIC_APP_URL` para o novo domínio

## Backup e Segurança

### Variáveis Sensíveis
- **NUNCA** commite arquivos `.env` no Git
- Use apenas variáveis de ambiente da Vercel
- Mantenha backups das suas chaves

### Banco de Dados
- O Supabase já tem backup automático
- Faça exports regulares das suas audiências

---

## 🎉 Pronto!

Seu sistema estará rodando em produção na Vercel com:
- ✅ HTTPS automático
- ✅ CDN global
- ✅ Deploy automático via Git
- ✅ Webhook funcionando
- ✅ Escalabilidade automática

**URL do seu sistema**: `https://seu-projeto.vercel.app`
