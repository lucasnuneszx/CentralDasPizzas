# Integração de IA para WhatsApp - Central Das Pizzas

## Visão Geral

Este documento explica como integrar uma Inteligência Artificial para automatizar pedidos via WhatsApp e conectá-la ao sistema Central Das Pizzas.

## É Totalmente Possível!

Sim, você pode integrar uma IA de WhatsApp para:
- Receber pedidos automaticamente via WhatsApp
- Processar mensagens de texto dos clientes
- Criar pedidos automaticamente no sistema
- Confirmar pedidos com os clientes
- Atualizar status dos pedidos

## Arquitetura da Solução

```
WhatsApp → IA (Processamento) → Webhook → Sistema Central Das Pizzas
```

### Fluxo Completo:

1. **Cliente envia mensagem no WhatsApp**
   - Exemplo: "Quero 2 pizzas margherita grande"

2. **IA processa a mensagem**
   - Identifica produtos, quantidades, tamanhos
   - Extrai informações do cliente (nome, telefone, endereço)
   - Valida disponibilidade e preços

3. **IA consulta o cardápio**
   - GET `/api/whatsapp/menu` - Retorna produtos disponíveis

4. **IA cria o pedido**
   - POST `/api/whatsapp/webhook` - Envia dados do pedido

5. **Sistema processa e confirma**
   - Cria pedido no banco de dados
   - Registra no caixa
   - Retorna confirmação para IA

6. **IA confirma com cliente**
   - Envia mensagem de confirmação no WhatsApp

## Opções de IA para WhatsApp

### 1. **Evolution API** (Recomendado)
- API completa para WhatsApp
- Suporte a webhooks
- Fácil integração
- Site: https://evolution-api.com

### 2. **WhatsApp Business API** (Oficial)
- Solução oficial do Meta
- Requer aprovação e processo mais complexo
- Site: https://business.whatsapp.com/products/cloud-api

### 3. **Twilio WhatsApp API**
- Solução enterprise
- Boa documentação
- Site: https://www.twilio.com/whatsapp

### 4. **OpenAI + Evolution API**
- IA mais avançada para processamento de linguagem natural
- Melhor compreensão de pedidos complexos
- Combine: OpenAI API + Evolution API

## Endpoints Disponíveis

### 1. Obter Cardápio
```http
GET /api/whatsapp/menu
```

**Resposta:**
```json
{
  "categories": [
    {
      "id": "cat-123",
      "name": "Pizzas",
      "items": [
        {
          "id": "combo-123",
          "name": "Pizza Margherita",
          "description": "Molho, mussarela e manjericão",
          "price": 29.90,
          "isPizza": true,
          "sizes": [
            {
              "id": "size-1",
              "name": "Grande",
              "slices": 8,
              "maxFlavors": 2,
              "basePrice": 29.90
            }
          ]
        }
      ]
    }
  ],
  "pizzaFlavors": [...],
  "extraItems": [...],
  "settings": {
    "deliveryFee": 5.00,
    "minOrderValue": 25.00
  }
}
```

### 2. Criar Pedido (Webhook)
```http
POST /api/whatsapp/webhook
Content-Type: application/json
```

**Body:**
```json
{
  "phone": "5511999999999",
  "customer": {
    "name": "João Silva",
    "phone": "5511999999999"
  },
  "items": [
    {
      "comboId": "combo-123",
      "quantity": 2,
      "price": 29.90,
      "observations": "Sem cebola"
    }
  ],
  "deliveryType": "DELIVERY",
  "paymentMethod": "PIX",
  "address": {
    "street": "Rua das Flores",
    "number": "123",
    "complement": "Apto 45",
    "neighborhood": "Centro",
    "city": "São Paulo",
    "state": "SP",
    "zipCode": "01234-567"
  },
  "notes": "Entregar após 19h",
  "total": 64.80
}
```

**Resposta:**
```json
{
  "success": true,
  "message": "Pedido criado com sucesso",
  "orderId": "order-123",
  "order": {
    "id": "order-123",
    "status": "PENDING",
    "total": 64.80,
    ...
  }
}
```

## A Mila - Atendente Virtual

A IA se identifica como **Mila**, atendente virtual da Central Das Pizzas.

### Apresentação da Mila

Quando um cliente inicia uma conversa, a Mila se apresenta assim:

```
Olá! Sou a Mila! 🍕

Atendente virtual da Central Das Pizzas e vou prosseguir e auxiliar com o seu pedido hoje! Vamos lá? 😊
```

### Personalidade da Mila

- Amigável e acolhedora
- Profissional e prestativa
- Sempre pronta para ajudar
- Usa emojis moderadamente (, , )
- Confirma pedidos antes de finalizar

## Exemplo de Implementação com IA

### Usando OpenAI + Evolution API

```javascript
// Exemplo de processamento de mensagem com OpenAI
const openai = require('openai');
const axios = require('axios');

async function processWhatsAppMessage(message, phone) {
  // 1. Buscar cardápio
  const menuResponse = await axios.get('https://seudominio.com/api/whatsapp/menu');
  const menu = menuResponse.data;

  // 2. Processar mensagem com OpenAI
  const openaiClient = new openai.OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });

  const prompt = `
Você é um assistente de uma pizzaria. Processe o pedido do cliente e retorne JSON.

Cardápio disponível:
${JSON.stringify(menu, null, 2)}

Mensagem do cliente: "${message}"

Retorne um JSON com:
{
  "items": [
    {
      "comboId": "id-do-combo",
      "quantity": 2,
      "price": 29.90,
      "observations": "observações"
    }
  ],
  "deliveryType": "DELIVERY" | "PICKUP",
  "paymentMethod": "PIX" | "CARD" | "CASH",
  "address": {...},
  "total": 64.80,
  "needsConfirmation": true
}
`;

  const completion = await openaiClient.chat.completions.create({
    model: "gpt-4",
    messages: [
      {
        role: "system",
        content: "Você é um assistente de pizzaria. Sempre retorne JSON válido."
      },
      {
        role: "user",
        content: prompt
      }
    ],
    response_format: { type: "json_object" }
  });

  const orderData = JSON.parse(completion.choices[0].message.content);

  // 3. Criar pedido no sistema
  const orderResponse = await axios.post(
    'https://seudominio.com/api/whatsapp/webhook',
    {
      phone: phone,
      customer: {
        name: await extractCustomerName(phone), // Buscar do banco ou IA
        phone: phone
      },
      ...orderData
    }
  );

  // 4. Confirmar com cliente via WhatsApp
  if (orderResponse.data.success) {
    await sendWhatsAppMessage(
      phone,
      `✅ Pedido confirmado! Número: #${orderResponse.data.orderId.slice(-6)}\n` +
      `Total: R$ ${orderData.total.toFixed(2)}\n` +
      `Tempo estimado: 35-70 minutos`
    );
  }

  return orderResponse.data;
}
```

## Configuração de Segurança

### 1. Adicionar Token de Verificação

No arquivo `.env`:
```env
WHATSAPP_WEBHOOK_TOKEN=seu-token-secreto-aqui
```

### 2. Validar Requisições

O webhook valida:
- Dados obrigatórios
- Existência dos combos
- Formato dos dados
- Token de verificação (GET)

## Exemplo de Conversas com a Mila

### Conversa 1: Primeira Interação
```
Cliente: "Oi"
Mila: "Olá! Sou a Mila! 🍕

Atendente virtual da Central Das Pizzas e vou prosseguir e auxiliar com o seu pedido hoje! Vamos lá? 😊"

Cliente: "Quero 2 pizzas margherita grande"
Mila: "✅ Pedido Confirmado pela Mila! 🍕

📦 Número do Pedido: #ABC123
💰 Total: R$ 64.80

Itens:
• 2x Pizza Margherita Grande - R$ 64.80

🚚 Entrega em 35-70 minutos

Obrigado pela preferência! Qualquer dúvida, estou aqui para ajudar! 😊

— Mila, sua atendente virtual"
```

### Conversa 2: Pedido Complexo
```
Cliente: "Olá"
Mila: "Olá! Sou a Mila! 🍕

Atendente virtual da Central Das Pizzas e vou prosseguir e auxiliar com o seu pedido hoje! Vamos lá? 😊"

Cliente: "Quero 1 pizza grande meio margherita meio calabresa, 
1 coca 2L e 1 batata frita. Entrega na Rua das Flores, 123, 
Centro, São Paulo. Pagamento no PIX"

Mila: "✅ Pedido Confirmado pela Mila! 🍕

📦 Número do Pedido: #DEF456
💰 Total: R$ 79.90

Itens:
• 1x Pizza Grande (Meio Margherita / Meio Calabresa) - R$ 34.90
• 1x Coca-Cola 2L - R$ 10.00
• 1x Batata Frita - R$ 15.00
• Taxa de entrega: R$ 5.00

🚚 Entrega em 35-70 minutos

Obrigado pela preferência! Qualquer dúvida, estou aqui para ajudar! 😊

— Mila, sua atendente virtual"
```

### Conversa 3: Pedido com Observações
```
Cliente: "2 pizzas margherita, uma sem cebola e outra bem 
passada. Retirar no balcão"

Mila: "✅ Pedido Confirmado pela Mila! 🍕

📦 Número do Pedido: #GHI789
💰 Total: R$ 59.80

Itens:
• 1x Pizza Margherita (Sem cebola) - R$ 29.90
• 1x Pizza Margherita (Bem passada) - R$ 29.90

🏪 Retirada no balcão

Obrigado pela preferência! Qualquer dúvida, estou aqui para ajudar! 😊

— Mila, sua atendente virtual"
```

### Conversa 4: Precisa de Esclarecimento
```
Cliente: "Quero uma pizza"

Mila: "Olá! Sou a Mila 😊

Para finalizar seu pedido, preciso de algumas informações:

- Qual sabor de pizza você deseja?
- Qual tamanho? (Pequena, Média, Grande ou Família)
- Entrega ou retirada?

Pode me ajudar com isso? Assim consigo processar seu pedido rapidinho! 🍕"
```

## Passos para Implementar

1. **Escolher plataforma de IA**
   - Recomendado: Evolution API + OpenAI

2. **Configurar Evolution API**
   - Criar conta
   - Conectar WhatsApp Business
   - Configurar webhook

3. **Implementar processador de mensagens**
   - Usar OpenAI para processar linguagem natural
   - Extrair dados do pedido
   - Validar com cardápio

4. **Integrar com sistema**
   - Chamar `/api/whatsapp/menu` para obter cardápio
   - Chamar `/api/whatsapp/webhook` para criar pedido
   - Enviar confirmação via WhatsApp

5. **Testar**
   - Enviar mensagens de teste
   - Verificar criação de pedidos
   - Validar confirmações

## Melhorias Futuras

- [ ] Suporte a múltiplos idiomas
- [ ] Integração com pagamento via WhatsApp
- [ ] Notificações de status do pedido
- [ ] Histórico de pedidos por cliente
- [ ] Recomendações personalizadas
- [ ] Suporte a cupons e promoções

## Suporte

Para dúvidas sobre a integração, consulte:
- Documentação da Evolution API
- Documentação da OpenAI API
- Código dos endpoints em `/app/api/whatsapp/`

---

**Desenvolvido para Central Das Pizzas**

