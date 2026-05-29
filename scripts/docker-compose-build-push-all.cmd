@echo off
REM Rebuild + push Ollama + backend (frontend inchangé si vous gardez v10).
REM Adapter REGISTRY et les tags avant exécution.

setlocal
cd /d "%~dp0.."

set REGISTRY=sarahmhadhbi
set OLLAMA_TAG=v1
set BACKEND_TAG=local

echo === 1/4 Build Ollama ===
docker build -t %REGISTRY%/gestion-licences-ollama:%OLLAMA_TAG% -t %REGISTRY%/gestion-licences-ollama:latest ./ollama
if errorlevel 1 exit /b 1

echo === 2/4 Build Backend ===
docker compose build backend
if errorlevel 1 exit /b 1

echo === 3/4 Tag Backend (optionnel pour registry) ===
docker tag gestion-licences-backend:local %REGISTRY%/gestion-licences-backend:%BACKEND_TAG%

echo === 4/4 Push ===
docker push %REGISTRY%/gestion-licences-ollama:%OLLAMA_TAG%
docker push %REGISTRY%/gestion-licences-ollama:latest
docker push %REGISTRY%/gestion-licences-backend:%BACKEND_TAG%

echo.
echo Terminé. Sur la VM: docker compose pull ^&^& docker compose up -d
endlocal
