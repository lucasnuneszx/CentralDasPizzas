/**
 * Exemplo de integração de IA com WhatsApp para Central Das Pizzas
 * 
 * Este script demonstra como uma IA pode processar mensagens do WhatsApp
 * e criar pedidos automaticamente no sistema.
 * 
 * Requisitos:
 * - npm install axios openai
 * - Configurar OPENAI_API_KEY no .env
 * - Configurar URL do sistema no .env
 */

const axios = require('axios');
const { OpenAI } = require('openai');

// Configurações
const SYSTEM_URL = process.env.NEXTAUTH_URL || 'http://localhost:3002';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Identidade da IA
const AI_IDENTITY = {
  name: 'Mila',
  role: 'Atendente virtual da Central Das Pizzas',
  greeting: 'Olá, sou a Mila! Atendente virtual da Central Das Pizzas e vou prosseguir e auxiliar com o seu pedido hoje! Vamos lá?',
  personality: 'amigável, prestativa, profissional e sempre pronta para ajudar'
};

// Inicializar OpenAI
const openai = new OpenAI({
  apiKey: OPENAI_API_KEY
});

/**
 * Processa uma mensagem do WhatsApp e cria um pedido
 */
async function processWhatsAppOrder(message, customerPhone, customerName) {
  try {
    console.log('📱 Processando mensagem do WhatsApp...');
    console.log('Cliente:', customerName, customerPhone);
    console.log('Mensagem:', message);

    // 1. Buscar cardápio do sistema
    console.log('📋 Buscando cardápio...');
    const menuResponse = await axios.get(`${SYSTEM_URL}/api/whatsapp/menu`);
    const menu = menuResponse.data;
    console.log('✅ Cardápio carregado');

    // 2. Processar mensagem com IA
    console.log('🤖 Processando com IA...');
    const orderData = await processMessageWithAI(message, menu, customerName);
    
    if (!orderData || orderData.error) {
      return {
        success: false,
        message: orderData?.error || 'Não foi possível processar o pedido',
        needsClarification: true
      };
    }

    // 3. Validar dados antes de criar pedido
    if (!orderData.items || orderData.items.length === 0) {
      return {
        success: false,
        message: 'Não foi possível identificar itens no pedido',
        needsClarification: true
      };
    }

    // 4. Criar pedido no sistema
    console.log('💾 Criando pedido no sistema...');
    const orderPayload = {
      phone: customerPhone,
      customer: {
        name: customerName || 'Cliente WhatsApp',
        phone: customerPhone
      },
      items: orderData.items,
      deliveryType: orderData.deliveryType || 'DELIVERY',
      paymentMethod: orderData.paymentMethod || 'PIX',
      address: orderData.address,
      notes: orderData.notes || '',
      total: orderData.total
    };

    const orderResponse = await axios.post(
      `${SYSTEM_URL}/api/whatsapp/webhook`,
      orderPayload
    );

    if (orderResponse.data.success) {
      console.log('✅ Pedido criado:', orderResponse.data.orderId);
      return {
        success: true,
        orderId: orderResponse.data.orderId,
        order: orderResponse.data.order,
        confirmationMessage: generateConfirmationMessage(orderResponse.data.order)
      };
    } else {
      throw new Error('Erro ao criar pedido');
    }

  } catch (error) {
    console.error('❌ Erro ao processar pedido:', error.message);
    return {
      success: false,
      message: 'Erro ao processar pedido. Tente novamente.',
      error: error.message
    };
  }
}

/**
 * Gera mensagem de apresentação da Mila
 */
function getMilaGreeting(customerName) {
  const name = customerName ? `, ${customerName}` : '';
  return `Olá${name}! Sou a *Mila*! 🍕\n\nAtendente virtual da *Central Das Pizzas* e vou prosseguir e auxiliar com o seu pedido hoje! Vamos lá? 😊`;
  
  // Versão alternativa sem nome (se preferir):
  // return `Olá, sou a Mila! Atendente virtual da Central Das Pizzas e vou prosseguir e auxiliar com o seu pedido hoje! Vamos lá? 😊`;
}

/**
 * Processa mensagem com OpenAI
 */
async function processMessageWithAI(message, menu, customerName) {
  try {
    const prompt = `Você é a Mila, atendente virtual da pizzaria Central Das Pizzas.

SUA IDENTIDADE:
- Nome: Mila
- Apresentação padrão: "Olá! Sou a Mila! 🍕 Atendente virtual da Central Das Pizzas e vou prosseguir e auxiliar com o seu pedido hoje! Vamos lá? 😊"
- Personalidade: Amigável, prestativa, profissional e sempre pronta para ajudar
- Sempre se identifique como Mila quando necessário
- Seja calorosa e acolhedora, mas mantenha profissionalismo
- Use emojis moderadamente (🍕, 😊, ✅)
- Sempre confirme os pedidos antes de finalizar
- Nas confirmações, sempre assine como "— Mila, sua atendente virtual"

CARDÁPIO DISPONÍVEL:
${JSON.stringify(menu, null, 2)}

MENSAGEM DO CLIENTE: "${message}"

Sua tarefa é:
1. Identificar os produtos pedidos (com IDs do cardápio)
2. Identificar quantidades
3. Identificar tamanhos (se for pizza)
4. Identificar sabores (se for pizza)
5. Identificar tipo de entrega (DELIVERY ou PICKUP)
6. Identificar método de pagamento (PIX, CARD, CASH)
7. Extrair endereço completo (se DELIVERY)
8. Calcular o total
9. Extrair observações

IMPORTANTE:
- Use apenas IDs de produtos que existem no cardápio
- Se não encontrar um produto, retorne error: "PRODUCT_NOT_FOUND"
- Se faltar informação essencial, retorne needsClarification: true
- Para pizzas, use o comboId do produto e adicione informações no campo observations
- O total deve ser calculado corretamente incluindo taxa de entrega se DELIVERY

Retorne APENAS um JSON válido no formato:
{
  "items": [
    {
      "comboId": "id-do-combo",
      "quantity": 2,
      "price": 29.90,
      "observations": "Sem cebola"
    }
  ],
  "deliveryType": "DELIVERY" | "PICKUP",
  "paymentMethod": "PIX" | "CARD" | "CASH",
  "address": {
    "street": "Rua...",
    "number": "123",
    "complement": "",
    "neighborhood": "Bairro",
    "city": "Cidade",
    "state": "SP",
    "zipCode": "12345-678"
  },
  "notes": "Observações do pedido",
  "total": 64.80,
  "needsClarification": false,
  "error": null
}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini", // ou "gpt-4" para melhor precisão
      messages: [
        {
          role: "system",
          content: `Você é a Mila, atendente virtual da Central Das Pizzas. Você é ${AI_IDENTITY.personality}. Sempre retorne JSON válido e preciso. Use apenas produtos do cardápio fornecido. Quando precisar se comunicar com o cliente, use uma linguagem amigável e profissional, sempre se identificando como Mila.`
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3 // Menor temperatura para mais precisão
    });

    const result = JSON.parse(completion.choices[0].message.content);
    return result;

  } catch (error) {
    console.error('Erro ao processar com IA:', error);
    return {
      error: 'Erro ao processar mensagem com IA',
      needsClarification: true
    };
  }
}

/**
 * Gera mensagem de confirmação para o cliente
 */
function generateConfirmationMessage(order) {
  const orderNumber = order.id.slice(-6).toUpperCase();
  const items = order.items.map(item => 
    `• ${item.quantity}x ${item.combo.name} - R$ ${(item.price * item.quantity).toFixed(2)}`
  ).join('\n');

  return `✅ *Pedido Confirmado pela Mila!* 🍕

📦 *Número do Pedido:* #${orderNumber}
💰 *Total:* R$ ${order.total.toFixed(2)}

*Itens:*
${items}

${order.deliveryType === 'DELIVERY' ? '🚚 Entrega em 35-70 minutos' : '🏪 Retirada no balcão'}

Obrigado pela preferência! Qualquer dúvida, estou aqui para ajudar! 😊

_— Mila, sua atendente virtual_`;
}

/**
 * Gera resposta amigável da Mila quando precisa de esclarecimentos
 */
function generateClarificationMessage(missingInfo) {
  return `Olá! Sou a *Mila* 😊\n\nPara finalizar seu pedido, preciso de algumas informações:\n\n${missingInfo}\n\nPode me ajudar com isso? Assim consigo processar seu pedido rapidinho! 🍕`;
}

/**
 * Gera mensagem de erro amigável da Mila
 */
function generateErrorMessage(error) {
  return `Oi! Sou a *Mila* 🍕\n\nDesculpe, mas encontrei um problema ao processar seu pedido:\n\n${error}\n\nPode tentar novamente? Estou aqui para ajudar! 😊`;
}

/**
 * Exemplo de uso
 */
async function exemplo() {
  // Exemplo 1: Pedido simples
  const resultado1 = await processWhatsAppOrder(
    "Quero 2 pizzas margherita grande",
    "5511999999999",
    "João Silva"
  );
  console.log('\n📋 Resultado:', JSON.stringify(resultado1, null, 2));

  // Exemplo 2: Pedido complexo
  const resultado2 = await processWhatsAppOrder(
    "Quero 1 pizza grande meio margherita meio calabresa, 1 coca 2L e 1 batata frita. Entrega na Rua das Flores, 123, Centro, São Paulo, SP, CEP 01234-567. Pagamento no PIX",
    "5511888888888",
    "Maria Santos"
  );
  console.log('\n📋 Resultado:', JSON.stringify(resultado2, null, 2));
}

// Executar exemplo se rodado diretamente
if (require.main === module) {
  if (!OPENAI_API_KEY) {
    console.error('❌ OPENAI_API_KEY não configurada no .env');
    process.exit(1);
  }
  
  exemplo().catch(console.error);
}

/**
 * Processa primeira mensagem do cliente (apresentação)
 */
async function handleFirstMessage(customerPhone, customerName) {
  // Verificar se é primeira interação
  // Se for, enviar mensagem de apresentação da Mila
  return {
    message: getMilaGreeting(customerName),
    isGreeting: true
  };
}

module.exports = {
  processWhatsAppOrder,
  generateConfirmationMessage,
  generateClarificationMessage,
  generateErrorMessage,
  getMilaGreeting,
  handleFirstMessage,
  AI_IDENTITY
};

