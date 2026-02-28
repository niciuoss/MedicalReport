@echo off
REM Script silencioso para inicializacao automatica do Windows.
REM Nao abre janela de console nem aguarda confirmacao.
REM Configure este script no Agendador de Tarefas do Windows.

cd /d "%~dp0"

REM Aguarda 30 segundos para o Docker Desktop terminar de iniciar
timeout /t 30 /nobreak >nul

REM Inicia os containers em segundo plano
docker-compose up -d >nul 2>&1
