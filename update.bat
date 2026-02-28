@echo off
echo =========================================
echo   Atualizando Sistema de Laudos Medicos
echo =========================================
cd /d "%~dp0"
docker-compose down
docker-compose build --no-cache
docker-compose up -d
echo.
echo Sistema atualizado e iniciado!
pause