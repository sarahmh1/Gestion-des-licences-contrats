@echo off
REM DEPRECIE — push ~4 Go inutile. Utiliser ollama/ollama dans docker-compose.yml
echo Utilisez plutot:
echo   docker compose pull ollama
echo   docker compose up -d ollama
echo   scripts\ollama-pull-model.cmd
exit /b 0
