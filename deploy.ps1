# Script de Deploy Automático para Railway
# Execute: .\deploy.ps1

Write-Host "Iniciando deploy automático..." -ForegroundColor Green

# Verificar se há mudanças
$gitStatus = git status --porcelain
if ([string]::IsNullOrWhiteSpace($gitStatus)) {
    Write-Host "Nenhuma alteração detectada" -ForegroundColor Yellow
    exit 0
}

Write-Host "Alterações detectadas:" -ForegroundColor Cyan
Write-Host $gitStatus

# Adicionar todos os arquivos
Write-Host "Adicionando arquivos..." -ForegroundColor Blue
git add .

# Fazer commit com timestamp
$timestamp = Get-Date -Format "dd/MM/yyyy HH:mm:ss"
$commitMessage = "feat: Deploy automático - $timestamp"

Write-Host "Fazendo commit..." -ForegroundColor Blue
git commit -m $commitMessage

# Push para o repositório
Write-Host "Enviando para o repositório..." -ForegroundColor Blue
git push origin main

Write-Host "Deploy automático concluído com sucesso!" -ForegroundColor Green
Write-Host "O Railway será atualizado automaticamente" -ForegroundColor Cyan
