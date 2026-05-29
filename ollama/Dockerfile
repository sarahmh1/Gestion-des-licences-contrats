# Image Ollama pour la VM (assistant IA + import ESET).
# Basée sur l'image officielle ; au premier démarrage, télécharge le modèle défini par OLLAMA_MODEL.
FROM ollama/ollama:latest

ENV OLLAMA_HOST=0.0.0.0:11434
ENV OLLAMA_MODEL=mistral:latest

COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint-custom.sh
RUN chmod +x /usr/local/bin/docker-entrypoint-custom.sh

EXPOSE 11434

ENTRYPOINT ["/usr/local/bin/docker-entrypoint-custom.sh"]
