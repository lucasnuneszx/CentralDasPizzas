/**
 * Handler completo para WhatsApp com a Mila
 * 
 * Este script implementa a lógica completa de atendimento da Mila,
 * incluindo apresentação, processamento de pedidos e confirmações.
 * 
 * Integração com Evolution API ou WhatsApp Business API
 */

const { 
  processWhatsAppOrder, 
  getMilaGreeting, 
  generateClarificationMessage,
  generateErrorMessage,
  AI_IDENTITY 
} = require('./whatsapp-ia-example');

// Simulação de armazenamento de conversas (em produção, usar banco de dados)
const conversations = new Map();

/**
 * Processa mensagem recebida do WhatsApp
 */
async function handleWhatsAppMessage(messageData) {
  const { 
    phone,           // Número do WhatsApp
    message,         // Texto da mensagem
    messageId,       // ID da mensagem
    timestamp,       // Timestamp
    isGroup = false  // Se é grupo
  } = messageData;

  // Ignorar mensagens de grupos
  if (isGroup) {
    return { ignore: true };
  }

  try {
    // Verificar se é primeira interação
    const conversation = conversations.get(phone) || {
      phone,
      firstMessage: true,
      customerName: null,
      messages: []
    };

    // Detectar se é saudação inicial do cliente
    const isGreeting = detectGreeting(message);
    
    // Se for primeira mensagem ou saudação, enviar apresentação da Mila
    if (conversation.firstMessage || isGreeting) {
      conversation.firstMessage = false;
      conversation.messages.push({
        type: 'customer',
        message,
        timestamp: new Date()
      });

      // Tentar extrair nome do cliente (se mencionado)
      const extractedName = extractName(message);
      if (extractedName) {
        conversation.customerName = extractedName;
      }

      conversations.set(phone, conversation);

      return {
        success: true,
        response: getMilaGreeting(conversation.customerName),
        type: 'greeting',
        needsResponse: true
      };
    }

    // Processar pedido
    conversation.messages.push({
      type: 'customer',
      message,
      timestamp: new Date()
    });

    console.log(`📱 Processando mensagem de ${phone}: ${message}`);

    // Processar pedido com IA
    const result = await processWhatsAppOrder(
      message,
      phone,
      conversation.customerName || 'Cliente'
    );

    // Salvar conversa
    conversations.set(phone, conversation);

    if (result.success) {
      // Pedido criado com sucesso
      return {
        success: true,
        response: result.confirmationMessage,
        type: 'order_confirmed',
        orderId: result.orderId,
        order: result.order,
        needsResponse: true
      };
    } else if (result.needsClarification) {
      // Precisa de esclarecimentos
      const clarification = generateClarificationMessage(result.message);
      return {
        success: false,
        response: clarification,
        type: 'needs_clarification',
        needsResponse: true
      };
    } else {
      // Erro ao processar
      const errorMsg = generateErrorMessage(result.message);
      return {
        success: false,
        response: errorMsg,
        type: 'error',
        needsResponse: true
      };
    }

  } catch (error) {
    console.error('❌ Erro ao processar mensagem:', error);
    return {
      success: false,
      response: generateErrorMessage('Erro interno. Por favor, tente novamente em alguns instantes.'),
      type: 'error',
      needsResponse: true
    };
  }
}

/**
 * Detecta se a mensagem é uma saudação
 */
function detectGreeting(message) {
  const greetings = [
    'oi', 'olá', 'ola', 'hey', 'e aí', 'eai',
    'bom dia', 'boa tarde', 'boa noite',
    'hello', 'hi', 'salve'
  ];
  
  const lowerMessage = message.toLowerCase().trim();
  return greetings.some(greeting => lowerMessage.startsWith(greeting));
}

/**
 * Tenta extrair nome do cliente da mensagem
 */
function extractName(message) {
  // Padrões comuns: "Sou o João", "Meu nome é Maria", etc.
  const patterns = [
    /(?:sou|meu nome é|eu sou|me chamo)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i,
    /(?:nome|chamo)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i
  ];

  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  return null;
}

/**
 * Envia mensagem via WhatsApp (integração com Evolution API ou similar)
 */
async function sendWhatsAppMessage(phone, message) {
  const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL;
  const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY;
  const INSTANCE_NAME = process.env.EVOLUTION_INSTANCE_NAME;
  
  const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;

  // Opção 1: Evolution API (Recomendado)
  if (EVOLUTION_API_URL && EVOLUTION_API_KEY && INSTANCE_NAME) {
    try {
      const axios = require('axios');
      const response = await axios.post(
        `${EVOLUTION_API_URL}/message/sendText/${INSTANCE_NAME}`,
        {
          number: phone,
          text: message
        },
        {
          headers: {
            'apikey': EVOLUTION_API_KEY,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log(`✅ Mensagem enviada via Evolution API para ${phone}`);
      return {
        success: true,
        messageId: response.data?.key?.id || `msg_${Date.now()}`,
        provider: 'evolution'
      };
    } catch (error) {
      console.error('❌ Erro ao enviar via Evolution API:', error.message);
      throw error;
    }
  }
  
  // Opção 2: WhatsApp Business API (Oficial)
  else if (WHATSAPP_PHONE_NUMBER_ID && WHATSAPP_ACCESS_TOKEN) {
    try {
      const axios = require('axios');
      const response = await axios.post(
        `https://graph.facebook.com/v18.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
        {
          messaging_product: 'whatsapp',
          to: phone,
          type: 'text',
          text: { body: message }
        },
        {
          headers: {
            'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log(`✅ Mensagem enviada via WhatsApp Business API para ${phone}`);
      return {
        success: true,
        messageId: response.data.messages[0]?.id || `msg_${Date.now()}`,
        provider: 'whatsapp-business'
      };
    } catch (error) {
      console.error('❌ Erro ao enviar via WhatsApp Business API:', error.message);
      throw error;
    }
  }
  
  // Modo de desenvolvimento (apenas log)
  else {
    console.log(`📤 [MODO DEV] Enviando para ${phone}:`);
    console.log(message);
    console.log('---');
    
    return {
      success: true,
      messageId: `msg_${Date.now()}`,
      provider: 'dev'
    };
  }
}

/**
 * Handler principal para webhook do WhatsApp
 */
async function handleWebhook(webhookData) {
  try {
    // Processar mensagem recebida
    const result = await handleWhatsAppMessage({
      phone: webhookData.from,
      message: webhookData.body || webhookData.text,
      messageId: webhookData.id,
      timestamp: webhookData.timestamp,
      isGroup: webhookData.isGroup || false
    });

    // Se precisa enviar resposta
    if (result.needsResponse && result.response) {
      await sendWhatsAppMessage(webhookData.from, result.response);
    }

    return result;

  } catch (error) {
    console.error('❌ Erro no webhook:', error);
    throw error;
  }
}

/**
 * Exemplo de uso com Express (para webhook)
 */
function setupWebhookServer() {
  const express = require('express');
  const app = express();
  
  app.use(express.json());

  // Endpoint para receber webhooks do WhatsApp
  app.post('/webhook/whatsapp', async (req, res) => {
    try {
      const result = await handleWebhook(req.body);
      res.json({ success: true, result });
    } catch (error) {
      console.error('Erro:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Endpoint de verificação (para WhatsApp Business API)
  app.get('/webhook/whatsapp', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === process.env.WHATSAPP_WEBHOOK_TOKEN) {
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  });

  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`🤖 Servidor da Mila rodando na porta ${PORT}`);
    console.log(`📱 Webhook: http://localhost:${PORT}/webhook/whatsapp`);
  });
}

// Executar servidor se rodado diretamente
if (require.main === module) {
  setupWebhookServer();
}

module.exports = {
  handleWhatsAppMessage,
  handleWebhook,
  sendWhatsAppMessage,
  getMilaGreeting,
  AI_IDENTITY
};

