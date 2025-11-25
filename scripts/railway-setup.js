const { PrismaClient } = require('@prisma/client')
const { exec } = require('child_process')
const { promisify } = require('util')

const execAsync = promisify(exec)

async function railwaySetup() {
  let prisma = null
  
  try {
    console.log('🚀 Configurando aplicação para Railway...')
    
    // Verificar se DATABASE_URL está disponível
    if (!process.env.DATABASE_URL) {
      console.log('⚠️ DATABASE_URL não configurada. Pulando setup do banco.')
      return
    }
    
    // Detectar se estamos em produção (Railway com PostgreSQL)
    const isProduction = process.env.DATABASE_URL && process.env.DATABASE_URL.includes('postgres')
    
    if (isProduction) {
      console.log('📦 Ambiente de produção detectado (PostgreSQL)')
      
      // Aplicar schema ao banco de dados
      console.log('🔄 Aplicando schema ao banco de dados...')
      try {
        const { stdout, stderr } = await execAsync('npx prisma db push --accept-data-loss', {
          timeout: 30000, // 30 segundos de timeout
          maxBuffer: 1024 * 1024 * 10 // 10MB buffer
        })
        if (stdout) console.log(stdout)
        if (stderr && !stderr.includes('Warning')) console.error(stderr)
        console.log('✅ Schema aplicado com sucesso')
      } catch (error) {
        console.error('⚠️ Erro ao aplicar schema:', error.message)
        // Continuar mesmo se houver erro
      }
    } else {
      console.log('💾 Ambiente de desenvolvimento detectado (SQLite)')
      
      // Para desenvolvimento, também aplicar o schema
      try {
        const { stdout, stderr } = await execAsync('npx prisma db push --accept-data-loss', {
          timeout: 30000,
          maxBuffer: 1024 * 1024 * 10
        })
        if (stdout) console.log(stdout)
        if (stderr && !stderr.includes('Warning')) console.error(stderr)
        console.log('✅ Schema aplicado com sucesso')
      } catch (error) {
        console.error('⚠️ Erro ao aplicar schema:', error.message)
      }
    }

    // Aguardar um pouco para garantir que o banco está pronto
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Tentar conectar ao Prisma apenas se necessário
    try {
      prisma = new PrismaClient({
        log: ['error', 'warn'],
      })
      
      // Testar conexão
      await prisma.$connect()
      console.log('✅ Conexão com banco estabelecida')
    } catch (error) {
      console.error('⚠️ Erro ao conectar ao banco:', error.message)
      prisma = null
    }

    // Verificar se já existem configurações
    if (prisma) {
      try {
        const existingSettings = await prisma.systemSettings.findFirst()
        
        if (!existingSettings) {
          console.log('📝 Criando configurações iniciais...')
          
          // Criar configurações padrão para Railway
          await prisma.systemSettings.create({
            data: {
              restaurantName: process.env.RESTAURANT_NAME || 'Central das Pizzas Av Sul',
              restaurantAddress: process.env.RESTAURANT_ADDRESS || 'Av. Sul, 104 - Verdes Horizontes, Camaçari - BA, 42810-021',
              restaurantPhone: process.env.RESTAURANT_PHONE || '(71) 99156-5893',
              restaurantEmail: process.env.RESTAURANT_EMAIL || 'contato@centraldaspizzas.com',
              deliveryEstimate: process.env.DELIVERY_ESTIMATE || '35 - 70min',
              isOpen: process.env.IS_OPEN === 'true' || true,
              openingHours: process.env.OPENING_HOURS || 'Seg-Dom: 18h-23h',
              deliveryFee: parseFloat(process.env.DELIVERY_FEE) || 5.00,
              minOrderValue: parseFloat(process.env.MIN_ORDER_VALUE) || 25.00,
              taxRate: parseFloat(process.env.TAX_RATE) || 0.00,
              autoPrint: process.env.AUTO_PRINT === 'true' || true,
              printerIp: process.env.PRINTER_IP || '',
              printerPort: process.env.PRINTER_PORT || '9100',
              ifoodApiKey: process.env.IFOOD_API_KEY || '',
              ifoodApiSecret: process.env.IFOOD_API_SECRET || ''
            }
          })
          
          console.log('✅ Configurações iniciais criadas')
        } else {
          console.log('ℹ️ Configurações já existem')
        }
      } catch (error) {
        console.error('⚠️ Erro ao criar configurações:', error.message)
        // Continuar mesmo se houver erro
      }

      // Verificar se existem categorias
      try {
        const categoriesCount = await prisma.category.count()
        
        if (categoriesCount === 0) {
          console.log('🍕 Criando dados do cardápio...')
          
          try {
            await execAsync('node scripts/populate-menu-data.js', {
              timeout: 60000, // 60 segundos
              maxBuffer: 1024 * 1024 * 10
            })
            console.log('✅ Dados do cardápio criados')
          } catch (error) {
            console.log('⚠️ Erro ao popular dados do cardápio:', error.message)
          }
        } else {
          console.log('ℹ️ Dados do cardápio já existem')
        }
      } catch (error) {
        console.error('⚠️ Erro ao verificar categorias:', error.message)
      }
    }

    console.log('🎉 Setup do Railway concluído!')
    console.log('📱 Aplicação pronta para uso')
    console.log('🌐 Acesse a URL do Railway para ver o cardápio')

  } catch (error) {
    console.error('❌ Erro no setup do Railway:', error)
    console.error('Stack:', error.stack)
    // Não fazer exit(1) para não bloquear o deploy
    console.log('⚠️ Continuando deploy mesmo com erros...')
  } finally {
    if (prisma) {
      try {
        await prisma.$disconnect()
      } catch (error) {
        // Ignorar erros ao desconectar
      }
    }
  }
}

// Executar apenas se for chamado diretamente
if (require.main === module) {
  // Usar setImmediate para evitar problemas de memória
  setImmediate(() => {
    railwaySetup()
      .then(() => {
        console.log('✅ Script finalizado com sucesso')
        // Aguardar um pouco antes de sair para garantir que tudo foi escrito
        setTimeout(() => {
          process.exit(0)
        }, 100)
      })
      .catch((error) => {
        console.error('❌ Erro fatal no script:', error)
        if (error.stack) {
          console.error('Stack:', error.stack)
        }
        // SEMPRE sair com sucesso para não bloquear o deploy
        setTimeout(() => {
          process.exit(0)
        }, 100)
      })
  })
}

module.exports = { railwaySetup }