@echo off
title Sistema de Laudos Medicos
echo.
echo  =========================================
echo    Sistema de Laudos Medicos
echo  =========================================
echo.

REM Navega para a pasta do projeto (mesma pasta do .bat)
cd /d "%~dp0"

REM Verifica se o Docker esta rodando
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo  [ERRO] Docker nao esta em execucao.
    echo  Abra o Docker Desktop e tente novamente.
    echo.
    pause
    exit /b 1
)

echo  Iniciando containers...
docker-compose up -d

if %errorlevel% neq 0 (
    echo.
    echo  [ERRO] Falha ao iniciar os containers.
    echo  Verifique os logs com: docker-compose logs
    echo.
    pause
    exit /b 1
)

echo.
echo  =========================================
echo    Sistema iniciado com sucesso!
echo  =========================================
echo.
echo  Frontend : http://localhost:3001
echo  API      : http://localhost:5000
echo  Banco    : localhost:5433
echo.
echo  Para encerrar: docker-compose down
echo.

REM Aguarda 5 segundos e abre o navegador automaticamente
echo  Abrindo navegador em 5 segundos...
timeout /t 5 /nobreak >nul
start "" "http://localhost:3001"

pause
