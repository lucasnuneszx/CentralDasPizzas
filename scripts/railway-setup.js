const { PrismaClient } = require('@prisma/client')
const { exec } = require('child_process')

const prisma = new PrismaClient()

async function railwaySetup() {
  try {
    console.log('🚀 Configurando aplicação para Railway...')
    
    // Detectar se estamos em produção (Railway)
    const isProduction = process.env.DATABASE_URL && process.env.DATABASE_URL.includes('postgres')
    
    if (isProduction) {
      console.log('📦 Ambiente de produção detectado (PostgreSQL)')
      console.log('🔄 Aplicando migração do banco de dados...')
      
      // Aplicar migrations
      await exec('npx prisma migrate deploy', (error, stdout, stderr) => {
        if (error) {
          console.error('❌ Erro ao aplicar migrations:', error)
        } else {
          console.log('✅ Migrations aplicadas com sucesso')
        }
      })
    } else {
      console.log('💾 Ambiente de desenvolvimento detectado (SQLite)')
    }

    // Verificar se já existem configurações
    const existingSettings = await prisma.systemSettings.findFirst()
    
    if (!existingSettings) {
      console.log('📝 Criando configurações iniciais...')
      
      // Criar configurações padrão para Railway
      await prisma.systemSettings.create({
        data: {
          restaurantName: process.env.RESTAURANT_NAME || 'Central Das Pizzas Avenida Sul',
          restaurantAddress: process.env.RESTAURANT_ADDRESS || 'Avenida Sul, Centro',
          restaurantPhone: process.env.RESTAURANT_PHONE || '(11) 99999-9999',
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

    // Verificar se existem categorias
    const categoriesCount = await prisma.category.count()
    
    if (categoriesCount === 0) {
      console.log('🍕 Criando dados do cardápio...')
      
      // Executar script de população de dados
      const { exec } = require('child_process')
      const { promisify } = require('util')
      const execAsync = promisify(exec)
      
      try {
        await execAsync('node scripts/populate-menu-data.js')
        console.log('✅ Dados do cardápio criados')
      } catch (error) {
        console.log('⚠️ Erro ao popular dados do cardápio:', error.message)
      }
    } else {
      console.log('ℹ️ Dados do cardápio já existem')
    }

    console.log('🎉 Setup do Railway concluído!')
    console.log('📱 Aplicação pronta para uso')
    console.log('🌐 Acesse a URL do Railway para ver o cardápio')

  } catch (error) {
    console.error('❌ Erro no setup do Railway:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Executar apenas se for chamado diretamente
if (require.main === module) {
  railwaySetup()
}

module.exports = { railwaySetup }