# Ollama + import ESET sur la VM

## Pourquoi ça marche sur le PC mais pas sur la VM ?

| | PC (souvent) | VM |
|---|--------------|-----|
| CPU / RAM | Plus élevés | Souvent limités |
| Ollama | `127.0.0.1:11434` ou Docker Desktop rapide | Conteneur `ollama`, 1ère inférence lente |
| Délai backend | 3 min parfois suffisant | Mistral peut dépasser 3 min → message *Connexion ou délai dépassé* |

L’URL `http://ollama:11434` est **correcte** si backend et Ollama sont dans le même `docker compose`. L’erreur signifie surtout : **timeout** ou Ollama pas prêt / modèle absent.

## Checklist VM

```bash
cd /home/srv-app   # répertoire du docker-compose.yml

docker compose ps
docker exec ollama ollama list          # doit contenir mistral:latest
docker exec spring-backend wget -qO- http://ollama:11434/api/tags   # test depuis le backend
```

Si `mistral:latest` manque :

```bash
docker compose up -d ollama
sleep 20
docker exec ollama ollama pull mistral:latest
```

## Variables d’environnement (service `backend` sur la VM)

À ajouter dans **votre** `docker-compose.yml` (image Hub `gestion-licences-backend:v11`) :

```yaml
environment:
  ASSISTANT_OLLAMA_ENABLED: "true"
  ASSISTANT_OLLAMA_BASE_URL: "http://ollama:11434"
  ASSISTANT_OLLAMA_MODEL: "mistral:latest"
  ASSISTANT_OLLAMA_CONNECT_TIMEOUT_MS: "30000"
  ASSISTANT_OLLAMA_READ_TIMEOUT_MS: "1200000"
  ESET_IMPORT_OLLAMA_READ_TIMEOUT_MS: "1200000"
  ESET_IMPORT_OLLAMA_MAX_PROMPT_CHARS: "12000"
  SERVER_TOMCAT_CONNECTION_TIMEOUT: "1200000"
```

Puis :

```bash
docker compose up -d
docker compose restart backend
```

## Accélérer sur VM faible (optionnel)

Modèle plus léger (après `docker exec ollama ollama pull …`) :

```yaml
ASSISTANT_OLLAMA_MODEL: "llama3.2:3b"
```

## Rebuild backend si vous poussez une nouvelle image

Le JAR embarque `eset.import.ollama.read-timeout-ms=600000` (10 min) par défaut depuis le repo actuel.
