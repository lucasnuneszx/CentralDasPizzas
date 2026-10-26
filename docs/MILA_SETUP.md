# Configuração da Mila - Atendente Virtual

## Visão Geral

A **Mila** é a atendente virtual da Central Das Pizzas que automatiza pedidos via WhatsApp usando Inteligência Artificial.

## Identidade da Mila

### Apresentação Padrão
```
Olá, sou a Mila! Atendente virtual da Central Das Pizzas e vou prosseguir e auxiliar com o seu pedido hoje! Vamos lá? 😊
```

### Personalidade
- Amigável e acolhedora
- Profissional e prestativa
- Sempre pronta para ajudar
- Usa emojis moderadamente (, , )
- Confirma pedidos antes de finalizar
- Assina mensagens como "— Mila, sua atendente virtual"

## Arquivos Criados

### 1. Script Principal
- **`scripts/whatsapp-order-processor.js`**
  - Processa mensagens com OpenAI
  - Cria pedidos no sistema
  - Gera mensagens de confirmação da Mila

### 2. Handler Completo
- **`scripts/whatsapp-mila-handler.js`**
  - Gerencia conversas completas
  - Detecta primeira interação
  - Envia apresentação automática
  - Processa pedidos e esclarecimentos

### 3. Endpoints da API
- **`app/api/whatsapp/webhook/route.ts`**
  - Recebe pedidos processados pela Mila
  - Valida e cria pedidos no sistema

- **`app/api/whatsapp/menu/route.ts`**
  - Fornece cardápio para a Mila consultar

## Como Usar

### 1. Configurar Variáveis de Ambiente

No arquivo `.env`:
```env
OPENAI_API_KEY=sua-chave-openai-aqui
NEXTAUTH_URL=https://centraldaspizzas.com
# Para desenvolvimento local: http://localhost:3002
WHATSAPP_WEBHOOK_TOKEN=seu-token-secreto
```

### 2. Instalar Dependências

```bash
npm install axios openai express
```

### 3. Executar Handler da Mila

```bash
node scripts/whatsapp-mila-handler.js
```

O servidor ficará rodando na porta 3001 (ou a definida em `PORT`).

### 4. Configurar Webhook do WhatsApp

Configure seu serviço de WhatsApp (Evolution API, WhatsApp Business API, etc.) para enviar mensagens para:

```
POST http://seu-servidor:3001/webhook/whatsapp
```

## Fluxo de Conversa

### Primeira Interação
1. Cliente envia: "Oi"
2. Mila responde: Apresentação padrão
3. Cliente envia pedido
4. Mila processa e confirma

### Pedido Completo
1. Cliente: "Quero 2 pizzas margherita grande"
2. Mila: Processa → Cria pedido → Confirma com número e detalhes

### Pedido Incompleto
1. Cliente: "Quero uma pizza"
2. Mila: Solicita informações faltantes (sabor, tamanho, entrega/retirada)

## Exemplo de Mensagens

### Apresentação
```
Olá! Sou a Mila! 🍕

Atendente virtual da Central Das Pizzas e vou prosseguir e auxiliar com o seu pedido hoje! Vamos lá? 😊
```

### Confirmação de Pedido
```
✅ Pedido Confirmado pela Mila! 🍕

📦 Número do Pedido: #ABC123
💰 Total: R$ 64.80

Itens:
• 2x Pizza Margherita Grande - R$ 64.80

🚚 Entrega em 35-70 minutos

Obrigado pela preferência! Qualquer dúvida, estou aqui para ajudar! 😊

— Mila, sua atendente virtual
```

### Esclarecimento Necessário
```
Olá! Sou a Mila 😊

Para finalizar seu pedido, preciso de algumas informações:

- Qual sabor de pizza você deseja?
- Qual tamanho? (Pequena, Média, Grande ou Família)
- Entrega ou retirada?

Pode me ajudar com isso? Assim consigo processar seu pedido rapidinho! 🍕
```

## Personalização

### Alterar Mensagem de Apresentação

Edite a função `getMilaGreeting()` em `scripts/whatsapp-order-processor.js`:

```javascript
function getMilaGreeting(customerName) {
  const name = customerName ? `, ${customerName}` : '';
  return `Olá${name}! Sou a *Mila*! 🍕\n\nAtendente virtual da *Central Das Pizzas* e vou prosseguir e auxiliar com o seu pedido hoje! Vamos lá? 😊`;
}
```

### Alterar Personalidade

Edite o objeto `AI_IDENTITY` em `scripts/whatsapp-order-processor.js`:

```javascript
const AI_IDENTITY = {
  name: 'Mila',
  role: 'Atendente virtual da Central Das Pizzas',
  greeting: 'Sua mensagem personalizada aqui',
  personality: 'amigável, prestativa, profissional e sempre pronta para ajudar'
};
```

## Integração com Evolution API

Exemplo de configuração com Evolution API:

```javascript
const EVOLUTION_API_URL = 'https://sua-evolution-api.com';
const INSTANCE_NAME = 'central-das-pizzas';

async function sendWhatsAppMessage(phone, message) {
  const response = await axios.post(
    `${EVOLUTION_API_URL}/message/sendText/${INSTANCE_NAME}`,
    {
      number: phone,
      text: message
    }
  );
  return response.data;
}
```

## Melhorias Futuras

- [ ] Suporte a múltiplos idiomas
- [ ] Integração com pagamento via WhatsApp
- [ ] Notificações de status do pedido
- [ ] Histórico de conversas
- [ ] Recomendações personalizadas baseadas em pedidos anteriores
- [ ] Suporte a cupons e promoções
- [ ] Integração com sistema de avaliações

## Suporte

Para dúvidas sobre a configuração da Mila:
- Consulte `docs/WHATSAPP_IA_INTEGRATION.md`
- Verifique os logs do servidor
- Teste com mensagens simples primeiro

---

**Desenvolvido para Central Das Pizzas**

