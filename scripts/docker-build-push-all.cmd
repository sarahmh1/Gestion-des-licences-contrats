@echo off
REM Build + push backend + frontend uniquement (Ollama = image officielle, pas de push 3 Go).
REM Ollama sur PC/VM : docker compose pull ollama ^&^& docker compose up -d ollama ^&^& scripts\ollama-pull-model.cmd

setlocal
cd /d "%~dp0.."

set REGISTRY=sarahmhadhbi
set BACKEND_TAG=v11
set FRONTEND_TAG=v11

echo ========================================
echo 1/4 Build Backend (projet2024)
echo ========================================
docker compose build backend
if errorlevel 1 exit /b 1
docker tag gestion-licences-backend:local %REGISTRY%/gestion-licences-backend:%BACKEND_TAG%

echo ========================================
echo 2/4 Build Frontend (Angular)
echo ========================================
docker build -t %REGISTRY%/gestion-licences-frontend:%FRONTEND_TAG% ./light-bootstrap-dashboard-angular2-master
if errorlevel 1 exit /b 1

echo ========================================
echo 3/4 Push Backend
echo ========================================
docker push %REGISTRY%/gestion-licences-backend:%BACKEND_TAG%
if errorlevel 1 exit /b 1

echo ========================================
echo 4/4 Push Frontend
echo ========================================
docker push %REGISTRY%/gestion-licences-frontend:%FRONTEND_TAG%
if errorlevel 1 exit /b 1

echo.
echo OK:
echo   %REGISTRY%/gestion-licences-backend:%BACKEND_TAG%
echo   %REGISTRY%/gestion-licences-frontend:%FRONTEND_TAG%
echo.
echo Ollama (VM ou PC) — pas de push Hub:
echo   docker compose pull ollama
echo   docker compose up -d ollama
echo   scripts\ollama-pull-model.cmd
endlocal
