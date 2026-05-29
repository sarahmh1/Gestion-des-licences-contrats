#!/bin/sh
# Sur la VM Linux : bash scripts/ollama-pull-model.sh
set -e
cd "$(dirname "$0")/.."

echo "Démarrage Ollama..."
docker compose up -d ollama

echo "Attente API Ollama..."
for i in $(seq 1 30); do
  if docker exec ollama ollama list >/dev/null 2>&1; then
    break
  fi
  sleep 2
done

echo "Téléchargement mistral:latest..."
docker exec ollama ollama pull mistral:latest
docker exec ollama ollama list
echo "OK."
