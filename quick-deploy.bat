@echo off
echo 🚀 Deploy Rápido para Railway
echo.

echo 📝 Verificando alterações...
git status --porcelain > temp_status.txt
set /p changes=<temp_status.txt
del temp_status.txt

if "%changes%"=="" (
    echo ✅ Nenhuma alteração detectada
    pause
    exit /b 0
)

echo 📦 Alterações encontradas, fazendo deploy...
echo.

echo 💾 Adicionando arquivos...
git add .

echo 📝 Fazendo commit...
for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value') do set "dt=%%a"
set "YY=%dt:~2,2%" & set "YYYY=%dt:~0,4%" & set "MM=%dt:~4,2%" & set "DD=%dt:~6,2%"
set "HH=%dt:~8,2%" & set "Min=%dt:~10,2%" & set "Sec=%dt:~12,2%"
set "timestamp=%DD%/%MM%/%YYYY% %HH%:%Min%:%Sec%"

git commit -m "feat: Deploy automático - %timestamp%"

echo 🚀 Enviando para Railway...
git push origin main

echo.
echo ✅ Deploy concluído!
echo 🔄 O Railway será atualizado automaticamente
echo.
pause
