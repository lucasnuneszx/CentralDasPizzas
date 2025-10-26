const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

function autoDeploy() {
  try {
    console.log('🚀 Iniciando deploy automático...')
    
    // Verificar se há mudanças
    const gitStatus = execSync('git status --porcelain', { encoding: 'utf8' })
    
    if (!gitStatus.trim()) {
      console.log('✅ Nenhuma alteração detectada')
      return
    }

    console.log('📝 Alterações detectadas:')
    console.log(gitStatus)

    // Adicionar todos os arquivos
    console.log('📦 Adicionando arquivos...')
    execSync('git add .', { stdio: 'inherit' })

    // Fazer commit com timestamp
    const timestamp = new Date().toLocaleString('pt-BR')
    const commitMessage = `feat: Deploy automático - ${timestamp}`
    
    console.log('💾 Fazendo commit...')
    execSync(`git commit -m "${commitMessage}"`, { stdio: 'inherit' })

    // Push para o repositório
    console.log('🚀 Enviando para o repositório...')
    execSync('git push origin main', { stdio: 'inherit' })

    console.log('✅ Deploy automático concluído com sucesso!')
    console.log('🔄 O Railway será atualizado automaticamente')

  } catch (error) {
    console.error('❌ Erro no deploy automático:', error.message)
    process.exit(1)
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  autoDeploy()
}

module.exports = { autoDeploy }
