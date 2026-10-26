# Guia Completo: APIs e Webhooks para WhatsApp

## Visão Geral

Este guia mostra exatamente onde obter e como configurar todas as APIs necessárias para a Mila funcionar via WhatsApp.

## APIs Necessárias

### 1. **OpenAI API** (Processamento de IA)
### 2. **Evolution API** ou **WhatsApp Business API** (WhatsApp)
### 3. **Webhook** (Seu servidor)

---

## 1⃣ OpenAI API - Processamento de Linguagem Natural

### Onde Obter

**Site Oficial:** https://platform.openai.com/

### Passo a Passo

1. **Criar Conta**
   - Acesse: https://platform.openai.com/signup
   - Faça login com Google, Microsoft ou email
   - Confirme seu email

2. **Adicionar Método de Pagamento**
   - Vá em: https://platform.openai.com/account/billing
   - Clique em "Add payment method"
   - Adicione cartão de crédito
   - **Importante:** Configure limite de gastos para evitar surpresas

3. **Criar API Key**
   - Acesse: https://platform.openai.com/api-keys
   - Clique em "Create new secret key"
   - Dê um nome (ex: "Mila WhatsApp")
   - **Copie a chave imediatamente** (ela só aparece uma vez!)
   - Cole no seu `.env`:
     ```env
     OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxx
     ```

4. **Escolher Modelo**
   - **Recomendado:** `gpt-4o-mini` (mais barato, ~$0.15 por 1M tokens)
   - **Alternativa:** `gpt-4` (mais preciso, ~$30 por 1M tokens)
   - **Custo estimado:** ~$0.01-0.05 por pedido processado

### Links Úteis
- Documentação: https://platform.openai.com/docs
- Preços: https://openai.com/api/pricing/
- Tutoriais: https://platform.openai.com/docs/guides

---

## 2⃣ Evolution API - WhatsApp (RECOMENDADO)

### Onde Obter

**Site Oficial:** https://evolution-api.com/

### Por que Evolution API?

- Mais fácil de configurar que WhatsApp Business API oficial
- Não precisa de aprovação do Meta
- Suporta múltiplas instâncias
- Webhooks nativos
- Documentação em português disponível

### Passo a Passo

#### Opção A: Usar Serviço Hospedado (Mais Fácil)

1. **Criar Conta**
   - Acesse: https://evolution-api.com/
   - Clique em "Sign Up" ou "Começar"
   - Crie sua conta

2. **Criar Instância**
   - No painel, clique em "Nova Instância"
   - Escaneie QR Code com WhatsApp
   - Aguarde conexão

3. **Obter Credenciais**
   - No painel, vá em "Configurações" → "API"
   - Copie:
     - **API Key**
     - **Instance Name**
     - **Base URL** (ex: `https://api.evolution-api.com`)

4. **Configurar no Projeto**
   ```env
   EVOLUTION_API_URL=https://api.evolution-api.com
   EVOLUTION_API_KEY=sua-api-key-aqui
   EVOLUTION_INSTANCE_NAME=nome-da-instancia
   ```

#### Opção B: Self-Hosted (Mais Controle)

1. **Instalar Docker**
   ```bash
   # Verificar se tem Docker
   docker --version
   ```

2. **Rodar Evolution API**
   ```bash
   docker run -d \
     --name evolution-api \
     -p 8080:8080 \
     -e AUTHENTICATION_API_KEY=sua-chave-secreta \
     -e CONFIG_SESSION_PHONE_CLIENT=Chrome \
     -e CONFIG_SESSION_PHONE_NAME=CentralDasPizzas \
     evolutionapi/evolution-api:latest
   ```

3. **Acessar Interface**
   - Abra: http://localhost:8080
   - Crie instância e escaneie QR Code

### Configurar Webhook

1. **No painel da Evolution API:**
   - Vá em "Webhooks"
   - Adicione webhook:
     ```
     URL: https://seu-servidor.com/webhook/whatsapp
     Eventos: message, message.upsert
     ```

2. **Ou via API:**
   ```bash
   curl -X POST "https://api.evolution-api.com/webhook/set" \
     -H "apikey: sua-api-key" \
     -H "instance: nome-instancia" \
     -d '{
       "url": "https://seu-servidor.com/webhook/whatsapp",
       "events": ["message", "message.upsert"]
     }'
   ```

### Links Úteis
- Documentação: https://doc.evolution-api.com/
- Discord: https://discord.gg/evolutionapi
- GitHub: https://github.com/EvolutionAPI/evolution-api

---

## 3⃣ WhatsApp Business API (Oficial do Meta)

### Onde Obter

**Site Oficial:** https://business.whatsapp.com/products/cloud-api

### Passo a Passo

1. **Criar Conta Business**
   - Acesse: https://business.facebook.com/
   - Crie uma conta Business
   - Vá em "WhatsApp" → "API"

2. **Criar App no Meta for Developers**
   - Acesse: https://developers.facebook.com/
   - Clique em "Meus Apps" → "Criar App"
   - Escolha "Business" como tipo
   - Adicione produto "WhatsApp"

3. **Configurar WhatsApp Business API**
   - Vá em "Configurações" → "Básico"
   - Adicione número de telefone comercial
   - Complete verificação (pode levar dias)

4. **Obter Credenciais**
   - **Phone Number ID**
   - **WhatsApp Business Account ID**
   - **Access Token** (temporário ou permanente)

5. **Configurar Webhook**
   - Vá em "Webhooks"
   - Configure URL: `https://seu-servidor.com/webhook/whatsapp`
   - Token de verificação: use `WHATSAPP_WEBHOOK_TOKEN` do `.env`
   - Subscreva eventos: `messages`

### Verificação do Webhook

O Meta envia um GET para verificar:
```
GET /webhook/whatsapp?hub.mode=subscribe&hub.verify_token=SEU_TOKEN&hub.challenge=DESAFIO
```

Seu servidor deve retornar o `hub.challenge`.

### Links Úteis
- Documentação: https://developers.facebook.com/docs/whatsapp
- Guia Inicial: https://developers.facebook.com/docs/whatsapp/cloud-api/get-started
- Preços: https://developers.facebook.com/docs/whatsapp/pricing

---

## 4⃣ Twilio WhatsApp API (Alternativa Enterprise)

### Onde Obter

**Site Oficial:** https://www.twilio.com/whatsapp

### Passo a Passo

1. **Criar Conta**
   - Acesse: https://www.twilio.com/try-twilio
   - Crie conta gratuita ($15.50 de crédito)

2. **Ativar WhatsApp Sandbox**
   - No console, vá em "Messaging" → "Try it out" → "Send a WhatsApp message"
   - Siga instruções para ativar sandbox
   - Para produção, solicite número verificado

3. **Obter Credenciais**
   - **Account SID**
   - **Auth Token**
   - **WhatsApp Number** (do sandbox ou verificado)

4. **Configurar Webhook**
   - No console, configure webhook URL
   - URL: `https://seu-servidor.com/webhook/whatsapp`

### Links Úteis
- Documentação: https://www.twilio.com/docs/whatsapp
- Preços: https://www.twilio.com/whatsapp/pricing

---

## Configuração do Webhook no Seu Servidor

### 1. Atualizar Handler

Edite `scripts/whatsapp-mila-handler.js`:

```javascript
// Para Evolution API
const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL;
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY;
const INSTANCE_NAME = process.env.EVOLUTION_INSTANCE_NAME;

async function sendWhatsAppMessage(phone, message) {
  const response = await axios.post(
    `${EVOLUTION_API_URL}/message/sendText/${INSTANCE_NAME}`,
    {
      number: phone,
      text: message
    },
    {
      headers: {
        'apikey': EVOLUTION_API_KEY
      }
    }
  );
  return response.data;
}
```

### 2. Configurar Variáveis de Ambiente

No `.env`:
```env
# OpenAI
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxx

# Evolution API
EVOLUTION_API_URL=https://api.evolution-api.com
EVOLUTION_API_KEY=sua-api-key
EVOLUTION_INSTANCE_NAME=central-das-pizzas

# Ou WhatsApp Business API
WHATSAPP_PHONE_NUMBER_ID=123456789
WHATSAPP_ACCESS_TOKEN=seu-token
WHATSAPP_BUSINESS_ACCOUNT_ID=123456789

# Webhook
WHATSAPP_WEBHOOK_TOKEN=seu-token-secreto-aqui
NEXTAUTH_URL=https://centraldaspizzas.com
```

### 3. Expor Servidor Publicamente

#### Opção A: ngrok (Desenvolvimento)
```bash
# Instalar ngrok
npm install -g ngrok

# Expor porta local
ngrok http 3001

# Copiar URL (ex: https://abc123.ngrok.io)
# Usar essa URL no webhook
```

#### Opção B: Railway (Produção)
1. Conecte repositório no Railway
2. Configure variáveis de ambiente
3. Railway fornece URL pública automaticamente

#### Opção C: Vercel (Produção)
1. Conecte repositório no Vercel
2. Configure variáveis de ambiente
3. Vercel fornece URL pública automaticamente

---

## Testar Configuração

### 1. Testar OpenAI
```bash
node -e "
const { OpenAI } = require('openai');
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
openai.chat.completions.create({
  model: 'gpt-4o-mini',
  messages: [{ role: 'user', content: 'Olá' }]
}).then(r => console.log('✅ OpenAI funcionando!', r.choices[0].message.content));
"
```

### 2. Testar Evolution API
```bash
curl -X GET "https://api.evolution-api.com/instance/fetchInstances" \
  -H "apikey: sua-api-key"
```

### 3. Testar Webhook
```bash
# Enviar mensagem de teste
curl -X POST "http://localhost:3001/webhook/whatsapp" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "5511999999999",
    "body": "Quero 2 pizzas margherita",
    "id": "test-123"
  }'
```

---

## Comparação de Opções

| Recurso | Evolution API | WhatsApp Business API | Twilio |
|---------|---------------|----------------------|--------|
| **Facilidade** | | | |
| **Custo** | $$ | $$ | $$$ |
| **Aprovação Necessária** | | | |
| **Webhooks** | | | |
| **Documentação PT** | | | |
| **Recomendado para** | Início rápido | Produção oficial | Enterprise |

---

## Recomendação Final

### Para Começar Rápido:
1. **OpenAI API** (obrigatório para IA)
2. **Evolution API** (mais fácil para WhatsApp)
3. **ngrok** (para testar localmente)

### Para Produção:
1. **OpenAI API**
2. **WhatsApp Business API** (oficial) ou **Evolution API** (se preferir)
3. **Railway** ou **Vercel** (hospedagem)

---

## Suporte

- **OpenAI:** https://help.openai.com/
- **Evolution API:** Discord ou GitHub
- **WhatsApp Business:** https://business.facebook.com/help

---

**Pronto para configurar!**

