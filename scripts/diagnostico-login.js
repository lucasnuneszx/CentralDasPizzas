const axios = require('axios');
require('dotenv').config();

const RAILWAY_URL = 'https://centraldaspizzass.up.railway.app';

async function diagnosticar() {
  console.log('DIAGNÓSTICO DE LOGIN\n');
  console.log('='.repeat(50));

  // 1. Verificar se a API está respondendo
  console.log('\n1⃣ Verificando se a API está online...');
  try {
    const healthResponse = await axios.get(`${RAILWAY_URL}/api/health`);
    console.log('API está online:', healthResponse.status);
  } catch (error) {
    console.log('API não está respondendo:', error.message);
    return;
  }

  // 2. Verificar se os usuários existem
  console.log('\n2⃣ Verificando se os usuários foram criados...');
  try {
    const createUsersResponse = await axios.get(`${RAILWAY_URL}/api/setup/create-users`);
    console.log('Resposta da criação de usuários:');
    console.log(JSON.stringify(createUsersResponse.data, null, 2));
    
    if (createUsersResponse.data.created && createUsersResponse.data.created.length > 0) {
      console.log(`${createUsersResponse.data.created.length} usuário(s) criado(s)`);
    }
    if (createUsersResponse.data.existing && createUsersResponse.data.existing.length > 0) {
      console.log(`${createUsersResponse.data.existing.length} usuário(s) já existente(s)`);
    }
  } catch (error) {
    console.log('Erro ao verificar/criar usuários:', error.response?.data || error.message);
  }

  // 3. Tentar fazer login (novo sistema)
  console.log('\n3⃣ Testando login (novo sistema)...');
  try {
    const loginResponse = await axios.post(
      `${RAILWAY_URL}/api/login`,
      {
        email: 'admin@centraldaspizzas.com',
        password: '123456'
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
        validateStatus: (status) => status < 500
      }
    );
    
    console.log('Status do login:', loginResponse.status);
    console.log('Resposta:', JSON.stringify(loginResponse.data, null, 2));
    
    if (loginResponse.status === 200 && loginResponse.data.success) {
      console.log('Login funcionou!');
    } else {
      console.log('Login falhou com status:', loginResponse.status);
    }
  } catch (error) {
    console.log('Erro ao tentar login:', error.response?.status, error.response?.data || error.message);
  }

  // 4. Verificar variáveis de ambiente necessárias
  console.log('\n4⃣ Variáveis de ambiente necessárias no Railway:');
  console.log('   - NEXTAUTH_URL=https://centraldaspizzass.up.railway.app');
  console.log('   - NEXTAUTH_SECRET=<gerado-com-openssl-rand-base64-32>');
  console.log('   - DATABASE_URL=<sua-url-postgresql>');
  
  console.log('\n' + '='.repeat(50));
  console.log('\nPRÓXIMOS PASSOS:');
  console.log('1. Acesse: https://centraldaspizzass.up.railway.app/api/setup/create-users');
  console.log('2. Verifique as variáveis de ambiente no Railway');
  console.log('3. Faça redeploy se necessário');
  console.log('4. Tente fazer login novamente\n');
}

diagnosticar().catch(console.error);

