# 🔗 Links Rápidos - APIs e Webhooks

## 🎯 Links Essenciais

### 1. OpenAI API (Obrigatório)
- **Criar Conta:** https://platform.openai.com/signup
- **API Keys:** https://platform.openai.com/api-keys
- **Documentação:** https://platform.openai.com/docs
- **Preços:** https://openai.com/api/pricing/
- **Custo:** ~$0.01-0.05 por pedido

### 2. Evolution API (Recomendado para WhatsApp)
- **Site:** https://evolution-api.com/
- **Documentação:** https://doc.evolution-api.com/
- **Discord:** https://discord.gg/evolutionapi
- **GitHub:** https://github.com/EvolutionAPI/evolution-api
- **Vantagem:** Mais fácil que WhatsApp Business API oficial

### 3. WhatsApp Business API (Oficial)
- **Site:** https://business.whatsapp.com/products/cloud-api
- **Developers:** https://developers.facebook.com/
- **Documentação:** https://developers.facebook.com/docs/whatsapp
- **Guia Inicial:** https://developers.facebook.com/docs/whatsapp/cloud-api/get-started
- **Preços:** https://developers.facebook.com/docs/whatsapp/pricing

### 4. Twilio WhatsApp (Alternativa)
- **Site:** https://www.twilio.com/whatsapp
- **Documentação:** https://www.twilio.com/docs/whatsapp
- **Preços:** https://www.twilio.com/whatsapp/pricing
- **Vantagem:** Solução enterprise consolidada

## 🛠️ Ferramentas de Desenvolvimento

### Expor Servidor Localmente
- **ngrok:** https://ngrok.com/ (gratuito para testes)
- **LocalTunnel:** https://localtunnel.github.io/www/ (alternativa gratuita)

### Hospedagem (Produção)
- **Railway:** https://railway.app/ (recomendado)
- **Vercel:** https://vercel.com/ (ótimo para Next.js)
- **Render:** https://render.com/ (alternativa)

## 📚 Documentação do Projeto

- **Guia Completo APIs:** `docs/APIS_E_WEBHOOKS_GUIA.md`
- **Configuração da Mila:** `docs/MILA_SETUP.md`
- **Integração WhatsApp:** `docs/WHATSAPP_IA_INTEGRATION.md`

## 🚀 Comandos Rápidos

```bash
# Verificar configuração das APIs
npm run whatsapp:setup

# Iniciar servidor da Mila
npm run whatsapp:start

# Expor servidor local (com ngrok)
ngrok http 3001
```

## ⚙️ Variáveis de Ambiente Necessárias

```env
# Obrigatório
OPENAI_API_KEY=sk-proj-xxxxx

# Evolution API (recomendado)
EVOLUTION_API_URL=https://api.evolution-api.com
EVOLUTION_API_KEY=sua-key
EVOLUTION_INSTANCE_NAME=central-das-pizzas

# OU WhatsApp Business API
WHATSAPP_PHONE_NUMBER_ID=123456789
WHATSAPP_ACCESS_TOKEN=seu-token

# Webhook
WHATSAPP_WEBHOOK_TOKEN=seu-token-secreto
NEXTAUTH_URL=https://centraldaspizzas.com
```

## 📞 Suporte

- **OpenAI:** https://help.openai.com/
- **Evolution API:** Discord ou GitHub Issues
- **WhatsApp Business:** https://business.facebook.com/help

---

**Última atualização:** Novembro 2024

