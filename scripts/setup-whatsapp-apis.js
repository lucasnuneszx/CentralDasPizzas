/**
 * Script de Configuração das APIs do WhatsApp
 * 
 * Este script ajuda a configurar e testar as APIs necessárias
 * para a Mila funcionar via WhatsApp.
 * 
 * Uso: node scripts/setup-whatsapp-apis.js
 */

require('dotenv').config();
const axios = require('axios');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function checkOpenAI() {
  console.log('\n🔍 Verificando OpenAI API...');
  
  if (!process.env.OPENAI_API_KEY) {
    console.log('❌ OPENAI_API_KEY não configurada no .env');
    console.log('\n📝 Como obter:');
    console.log('1. Acesse: https://platform.openai.com/api-keys');
    console.log('2. Crie uma nova API key');
    console.log('3. Adicione no .env: OPENAI_API_KEY=sk-proj-xxxxx');
    return false;
  }

  try {
    const { OpenAI } = require('openai');
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: 'Teste' }],
      max_tokens: 5
    });
    
    console.log('✅ OpenAI API funcionando!');
    console.log(`   Modelo testado: gpt-4o-mini`);
    return true;
  } catch (error) {
    console.log('❌ Erro ao testar OpenAI:', error.message);
    return false;
  }
}

async function checkEvolutionAPI() {
  console.log('\n🔍 Verificando Evolution API...');
  
  const apiUrl = process.env.EVOLUTION_API_URL;
  const apiKey = process.env.EVOLUTION_API_KEY;
  const instanceName = process.env.EVOLUTION_INSTANCE_NAME;

  if (!apiUrl || !apiKey || !instanceName) {
    console.log('❌ Evolution API não configurada completamente');
    console.log('\n📝 Configure no .env:');
    console.log('EVOLUTION_API_URL=https://api.evolution-api.com');
    console.log('EVOLUTION_API_KEY=sua-api-key');
    console.log('EVOLUTION_INSTANCE_NAME=nome-instancia');
    console.log('\n🌐 Onde obter: https://evolution-api.com/');
    return false;
  }

  try {
    // Testar conexão
    const response = await axios.get(`${apiUrl}/instance/fetchInstances`, {
      headers: { 'apikey': apiKey }
    });
    
    console.log('✅ Evolution API conectada!');
    console.log(`   Instâncias encontradas: ${response.data.length}`);
    
    // Verificar instância específica
    const instance = response.data.find(i => i.instance.instanceName === instanceName);
    if (instance) {
      console.log(`✅ Instância "${instanceName}" encontrada!`);
      console.log(`   Status: ${instance.instance.status}`);
    } else {
      console.log(`⚠️  Instância "${instanceName}" não encontrada`);
    }
    
    return true;
  } catch (error) {
    console.log('❌ Erro ao testar Evolution API:', error.message);
    return false;
  }
}

async function checkWhatsAppBusinessAPI() {
  console.log('\n🔍 Verificando WhatsApp Business API...');
  
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

  if (!phoneNumberId || !accessToken) {
    console.log('❌ WhatsApp Business API não configurada');
    console.log('\n📝 Configure no .env:');
    console.log('WHATSAPP_PHONE_NUMBER_ID=123456789');
    console.log('WHATSAPP_ACCESS_TOKEN=seu-token');
    console.log('\n🌐 Onde obter: https://developers.facebook.com/');
    return false;
  }

  try {
    const response = await axios.get(
      `https://graph.facebook.com/v18.0/${phoneNumberId}`,
      {
        params: { access_token: accessToken }
      }
    );
    
    console.log('✅ WhatsApp Business API conectada!');
    console.log(`   Phone Number ID: ${phoneNumberId}`);
    return true;
  } catch (error) {
    console.log('❌ Erro ao testar WhatsApp Business API:', error.message);
    return false;
  }
}

async function checkWebhook() {
  console.log('\n🔍 Verificando configuração de Webhook...');
  
  const webhookToken = process.env.WHATSAPP_WEBHOOK_TOKEN;
  const serverUrl = process.env.NEXTAUTH_URL;

  if (!webhookToken) {
    console.log('⚠️  WHATSAPP_WEBHOOK_TOKEN não configurado');
    console.log('   Configure no .env: WHATSAPP_WEBHOOK_TOKEN=seu-token-secreto');
  } else {
    console.log('✅ Webhook token configurado');
  }

  if (!serverUrl) {
    console.log('⚠️  NEXTAUTH_URL não configurado');
    console.log('   Configure no .env: NEXTAUTH_URL=https://centraldaspizzas.com');
  } else {
    console.log(`✅ URL do servidor: ${serverUrl}`);
    console.log(`   Webhook URL: ${serverUrl}/webhook/whatsapp`);
  }
}

async function testSendMessage() {
  console.log('\n📱 Teste de Envio de Mensagem');
  
  const useEvolution = process.env.EVOLUTION_API_URL && 
                       process.env.EVOLUTION_API_KEY && 
                       process.env.EVOLUTION_INSTANCE_NAME;
  
  if (!useEvolution) {
    console.log('⚠️  Evolution API não configurada. Pulando teste.');
    return;
  }

  const phone = await question('Digite um número para teste (ex: 5511999999999): ');
  const message = await question('Digite a mensagem de teste: ');

  try {
    const response = await axios.post(
      `${process.env.EVOLUTION_API_URL}/message/sendText/${process.env.EVOLUTION_INSTANCE_NAME}`,
      {
        number: phone,
        text: message
      },
      {
        headers: { 'apikey': process.env.EVOLUTION_API_KEY }
      }
    );

    console.log('✅ Mensagem enviada com sucesso!');
    console.log('   ID:', response.data.key?.id);
  } catch (error) {
    console.log('❌ Erro ao enviar mensagem:', error.response?.data || error.message);
  }
}

async function main() {
  console.log('🚀 Configuração das APIs para Mila - WhatsApp\n');
  console.log('='.repeat(50));

  const results = {
    openai: await checkOpenAI(),
    evolution: await checkEvolutionAPI(),
    whatsappBusiness: await checkWhatsAppBusinessAPI()
  };

  await checkWebhook();

  console.log('\n' + '='.repeat(50));
  console.log('\n📊 Resumo:');
  console.log(`   OpenAI: ${results.openai ? '✅' : '❌'}`);
  console.log(`   Evolution API: ${results.evolution ? '✅' : '❌'}`);
  console.log(`   WhatsApp Business: ${results.whatsappBusiness ? '✅' : '❌'}`);

  if (results.openai && (results.evolution || results.whatsappBusiness)) {
    console.log('\n🎉 Configuração completa! Mila está pronta para funcionar!');
    
    const test = await question('\nDeseja testar envio de mensagem? (s/n): ');
    if (test.toLowerCase() === 's') {
      await testSendMessage();
    }
  } else {
    console.log('\n⚠️  Algumas APIs não estão configuradas.');
    console.log('   Consulte: docs/APIS_E_WEBHOOKS_GUIA.md');
  }

  rl.close();
}

main().catch(console.error);

