# Déploiement automatisé (GitHub Actions + VM SOC)

Workflow : [`.github/workflows/ci-cd.yml`](../.github/workflows/ci-cd.yml)

## Pipeline CI/CD (bonnes pratiques)

```text
Pull Request  →  CI · tests uniquement (fail fast)
Push main     →  test → build → publish Hub → deploy VM
```

| Phase | Job GitHub | Rôle |
|-------|------------|------|
| Prepare | `Prepare · Image Tag` | Tag immuable `sha-xxxxxxx` |
| CI | `CI · Backend Tests` / `CI · Frontend Tests` | Maven + Karma (parallèle) |
| Build | `Build · Backend/Frontend Docker Image` | Images Docker (après tests) |
| Publish | `Publish · Docker Hub` | Push registry |
| Deploy | `Deploy · VM Production` | Runner self-hosted SOC |

## 1. Secrets GitHub

**Settings → Secrets and variables → Actions**

| Secret | Valeur |
|--------|--------|
| `DOCKERHUB_USERNAME` | `sarahmhadhbi` |
| `DOCKERHUB_TOKEN` | Token Docker Hub **Read & Write** |

## 2. Runner self-hosted sur la VM

VPN SOC → PuTTY → SSH sur la VM.

```bash
curl -I https://github.com
curl -I https://hub.docker.com
docker ps
sudo usermod -aG docker $USER   # puis reconnecter PuTTY
```

Installation :

```bash
cd /home/srv-app
mkdir -p actions-runner && cd actions-runner
# Télécharger depuis GitHub : Settings → Actions → Runners → New self-hosted runner
tar xzf ./actions-runner-linux-x64-*.tar.gz

./config.sh \
  --url https://github.com/sarahmh1/Gestion-des-licences-contrats \
  --token TOKEN_GITHUB \
  --name vm-soc-runner \
  --labels self-hosted,linux,vm-soc \
  --work _work \
  --unattended

sudo ./svc.sh install && sudo ./svc.sh start
# Si pas de sudo : nohup ./run.sh > runner.log 2>&1 &
```

## 3. Fichiers sur la VM (`/home/srv-app`)

| Fichier | Rôle |
|---------|------|
| `.env` | Mail SMTP, `APP_FRONTEND_BASE_URL=http://192.168.1.50:4200` |
| `docker-compose.yml` | Copié par le workflow |
| `docker-compose.prod.yml` | Idem |
| `uploads/` | Fichiers uploadés backend |

## 4. Déclenchement

- **PR** vers `main` : tests seulement
- **Push** sur `main` : pipeline complet + deploy
- **Actions → CI/CD Pipeline → Run workflow**

## 5. Vérification

- GitHub **Actions** → tous les jobs verts
- VM : `docker compose ps`
- Navigateur : `http://192.168.1.50:4200`

## 6. Secours manuel

```bash
cd /home/srv-app
export IMAGE_TAG=latest
docker compose -f docker-compose.yml -f docker-compose.prod.yml pull backend frontend
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --no-build
```
