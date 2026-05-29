#!/bin/sh
set -e

MODEL="${OLLAMA_MODEL:-mistral:latest}"

echo "[ollama] Démarrage du serveur..."
ollama serve &
SERVE_PID=$!

echo "[ollama] Attente de l'API (max ~2 min)..."
i=0
while [ "$i" -lt 60 ]; do
  if ollama list >/dev/null 2>&1; then
    break
  fi
  i=$((i + 1))
  sleep 2
done

if ! ollama list >/dev/null 2>&1; then
  echo "[ollama] ERREUR: le serveur n'a pas démarré à temps."
  kill "$SERVE_PID" 2>/dev/null || true
  exit 1
fi

echo "[ollama] Vérification du modèle: ${MODEL}"
if ollama show "${MODEL}" >/dev/null 2>&1; then
  echo "[ollama] Modèle déjà présent."
else
  echo "[ollama] Téléchargement de ${MODEL} (peut prendre plusieurs minutes)..."
  ollama pull "${MODEL}"
fi

echo "[ollama] Prêt sur le port 11434."
wait "$SERVE_PID"
