@echo off
title Renovar Licenca - Sistema de Laudos
echo.
echo  =========================================
echo    Renovacao de Licenca - Laudos Medicos
echo  =========================================
echo.

REM Verifica se o container do banco esta rodando
docker ps --filter "name=laudos_db" --filter "status=running" -q >nul 2>&1
if %errorlevel% neq 0 (
    echo  [ERRO] O container do banco (laudos_db) nao esta rodando.
    echo  Execute primeiro: start.bat
    echo.
    pause
    exit /b 1
)

echo  Renovando licenca por mais 30 dias...
echo.

docker exec laudos_db psql -U laudos_user -d laudos_medicos -c "UPDATE \"LicenseConfigs\" SET \"LicenseKey\" = 1, \"ActivatedAt\" = NOW(), \"ExpiresAt\" = NOW() + INTERVAL '30 days' WHERE \"Id\" = 1;"

if %errorlevel% neq 0 (
    echo.
    echo  [ERRO] Falha ao renovar a licenca. Verifique se o sistema esta rodando.
    pause
    exit /b 1
)

echo.
echo  Licenca renovada com sucesso! Valida por mais 30 dias.
echo.

REM Exibe a data de expiracao atual
docker exec laudos_db psql -U laudos_user -d laudos_medicos -c "SELECT \"LicenseKey\", TO_CHAR(\"ExpiresAt\", 'DD/MM/YYYY') AS \"Expira em\" FROM \"LicenseConfigs\" WHERE \"Id\" = 1;"

echo.
pause
