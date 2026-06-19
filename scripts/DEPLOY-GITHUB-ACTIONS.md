# Déploiement automatisé (GitHub Actions + VM SOC)

## 1. Secrets GitHub

Dans le dépôt : **Settings → Secrets and variables → Actions → New repository secret**

| Nom | Valeur |
|-----|--------|
| `DOCKERHUB_USERNAME` | `sarahmhadhbi` |
| `DOCKERHUB_TOKEN` | Token Docker Hub (voir ci-dessous) |

### Erreur `access token has insufficient scopes`

Le secret doit être un **Access Token Docker Hub**, pas un token GitHub.

1. [hub.docker.com](https://hub.docker.com) → **Account Settings** → **Security** → **New Access Token**
2. Description : `github-actions`
3. Permissions : **Read, Write, Delete** (au minimum **Read & Write**)
4. Copier le token → mettre à jour le secret `DOCKERHUB_TOKEN` sur GitHub
5. Relancer le workflow (**Actions** → run en échec → **Re-run jobs**)

Le workflow sépare **build** (sans login) et **push** (login uniquement dans le job `push`).

## Tests automatisés (CI)

Le workflow [`.github/workflows/docker-build-push.yml`](../.github/workflows/docker-build-push.yml) exécute :

| Job | Outil | Détail |
|-----|--------|--------|
| `test-backend` | Maven + JUnit | `mvn test` — H2 en mémoire (profil `test`) |
| `test-frontend` | Karma + Jasmine | `npm run test:ci` — ChromeHeadless |

Les jobs **build** et **push** ne démarrent que si les tests passent.

- **Pull request** vers `main` : tests uniquement
- **Push** sur `main` : tests → build → push Docker Hub

## 2. Runner self-hosted sur la VM

Connexion : VPN SOC → PuTTY → SSH sur la VM.

```bash
curl -I https://github.com
curl -I https://hub.docker.com
docker ps
```

Sur GitHub : **Settings → Actions → Runners → New self-hosted runner** → Linux x64.

Sur la VM :

```bash
cd /home/srv-app
mkdir -p actions-runner && cd actions-runner
# Coller la commande curl de la page GitHub, puis :
tar xzf ./actions-runner-linux-x64-*.tar.gz

./config.sh \
  --url https://github.com/VOTRE_ORG/gestion-des-licences-et-contrats \
  --token TOKEN_AFFICHE_SUR_GITHUB \
  --name vm-soc-runner \
  --labels self-hosted,linux,vm-soc \
  --workfolder _work \
  --unattended

sudo ./svc.sh install
sudo ./svc.sh start
sudo ./svc.sh status
```

L’utilisateur du service doit être dans le groupe `docker` :

```bash
sudo usermod -aG docker $USER
```

## 3. Fichiers sur la VM (`/home/srv-app`)

| Fichier | Rôle |
|---------|------|
| `.env` | Mail SMTP, `APP_FRONTEND_BASE_URL` (copier depuis `.env.example`) |
| `docker-compose.yml` | Copié automatiquement par le workflow |
| `docker-compose.prod.yml` | Idem |
| `uploads/` | Fichiers uploadés backend (créé par le workflow si absent) |

**Ne pas** commiter `.env`.

Si vous utilisiez `./projet2024/uploads`, migrez une fois :

```bash
cp -a /home/srv-app/projet2024/uploads/. /home/srv-app/uploads/ 2>/dev/null || true
```

## 4. Déclenchement

**Actuellement** : workflow **Build and push Docker images** uniquement (pas de deploy VM).

- Push sur `main` ou `master` (chemins `projet2024/`, frontend, compose, workflow)
- Ou **Actions → Build and push Docker images → Run workflow**

Le job deploy VM (`runs-on: self-hosted`) sera réactivé plus tard dans un workflow séparé.

## 5. Vérification

- GitHub : onglet **Actions** → workflow vert
- VM : `docker compose ps`
- Navigateur : `http://192.168.1.50:4200`

## 6. Secours (sans runner)

Après un push qui a build les images sur Hub :

```bash
cd /home/srv-app
export IMAGE_TAG=latest
docker compose -f docker-compose.yml -f docker-compose.prod.yml pull
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --no-build
```
