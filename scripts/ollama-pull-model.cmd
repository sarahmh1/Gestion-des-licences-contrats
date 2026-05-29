@echo off
REM Télécharge mistral dans le conteneur ollama (volume ollama_data).
REM Prérequis : docker compose up -d ollama

setlocal
cd /d "%~dp0.."

echo Attente du demarrage d'Ollama...
timeout /t 15 /nobreak >nul

docker exec ollama ollama pull mistral:latest
if errorlevel 1 (
  echo ERREUR: le conteneur ollama tourne-t-il ?  docker compose up -d ollama
  exit /b 1
)

docker exec ollama ollama list
echo.
echo OK — modele pret. Backend : ASSISTANT_OLLAMA_BASE_URL=http://host.docker.internal:11434
endlocal
