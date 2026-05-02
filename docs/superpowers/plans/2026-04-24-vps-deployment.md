# VPS Deployment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create deployment documentation, production config, and a GitHub Actions deploy workflow so BaseWeight can be deployed to a DigitalOcean droplet automatically on push to `master`.

**Architecture:** The app is built in GitHub Actions CI and deployed via rsync to a single Ubuntu droplet running Caddy (reverse proxy with auto-HTTPS) and systemd (process manager). Config uses the `config` npm package layering: `default.json` -> `production.json` -> `local-production.json` (secrets, gitignored).

**Tech Stack:** GitHub Actions, rsync via `easingthemes/ssh-deploy@v5`, Caddy, systemd, Node.js 24, `config` npm package

---

### Task 1: Add `local-production.json` to `.gitignore`

The `config` npm package automatically loads `config/local-production.json` when `NODE_ENV=production`. This file will hold secrets on the server and must never be committed.

**Files:**

- Modify: `.gitignore`

- [ ] **Step 1: Add gitignore entry**

Add `/config/local-production.json` immediately after the existing `/config/local.json` line in `.gitignore`:

```
/config/local.json
/config/local-production.json
```

- [ ] **Step 2: Commit**

```bash
git add .gitignore
git commit -m "chore: gitignore local-production.json for production secrets"
```

---

### Task 2: Create `.env.example`

This file documents environment variables that override or supplement the `config` package settings. It is a reference file — not read by the app at runtime.

**Files:**

- Create: `.env.example`

- [ ] **Step 1: Create `.env.example`**

```env
# BaseWeight Environment Variables
# Copy this file to .env and fill in values for your environment.
# These variables override or supplement settings in config/*.json files.

# Public-facing URL (used for SEO meta tags and Better Auth)
PUBLIC_URL=https://baseweight.pro

# Path to the SQLite database file (overrides config.databasePath)
DATABASE_PATH=./data/baseweight.db

# Log level: error, warn, info, debug (overrides config.logLevel)
LOG_LEVEL=info

# --- Test/dev only (never set in production) ---
# ENABLE_TEST_ENDPOINTS=true
# DISABLE_RATE_LIMITING=true
```

- [ ] **Step 2: Commit**

```bash
git add .env.example
git commit -m "docs: add .env.example documenting environment variables"
```

---

### Task 3: Create `config/production.json`

Production-safe defaults that override `config/default.json` when `NODE_ENV=production`. No secrets — those go in `local-production.json` on the server.

**Files:**

- Create: `config/production.json`

- [ ] **Step 1: Create `config/production.json`**

```json
{
    "environment": "production",
    "logLevel": "warn",
    "maxImageSizeMb": 10,
    "imageMaxWidthPx": 1200,
    "magicLinkExpiresIn": 300,
    "maxItemsPerUser": 1000
}
```

- [ ] **Step 2: Commit**

```bash
git add config/production.json
git commit -m "chore: add production config with safe defaults"
```

---

### Task 4: Create `.github/workflows/deploy.yml`

Automated deploy workflow: build in CI, rsync to the droplet, install production deps, restart the service.

**Files:**

- Create: `.github/workflows/deploy.yml`

**Context for implementer:**

- The existing CI workflow (`.github/workflows/ci.yml`) uses Node 24 and `actions/setup-node@v4` with npm cache. Match this.
- The workflow uses `easingthemes/ssh-deploy@v5` for rsync over SSH.
- Three repository secrets are required: `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_SSH_KEY`.
- The deploy only runs on push to `master` (not on PRs).
- The `SOURCE` field in ssh-deploy takes a space-separated list of files/directories.
- `SCRIPT_AFTER` runs on the remote server after rsync completes.

- [ ] **Step 1: Create `.github/workflows/deploy.yml`**

```yaml
name: Deploy

on:
    push:
        branches: [master]

jobs:
    deploy:
        name: Deploy to production
        runs-on: ubuntu-latest
        steps:
            - uses: actions/checkout@v4

            - name: Set up Node.js
              uses: actions/setup-node@v4
              with:
                  node-version: 24
                  cache: npm

            - name: Install dependencies
              run: npm ci

            - name: Build
              run: npm run build

            - name: Deploy to server
              uses: easingthemes/ssh-deploy@v5
              with:
                  SSH_PRIVATE_KEY: ${{ secrets.DEPLOY_SSH_KEY }}
                  REMOTE_HOST: ${{ secrets.DEPLOY_HOST }}
                  REMOTE_USER: ${{ secrets.DEPLOY_USER }}
                  SOURCE: '.output/ config/production.json package.json package-lock.json'
                  TARGET: /home/deploy/baseweight
                  SCRIPT_AFTER: |
                      cd /home/deploy/baseweight
                      npm ci --omit=dev
                      sudo systemctl restart baseweight
```

- [ ] **Step 2: Verify YAML syntax**

Run: `python3 -c "import yaml; yaml.safe_load(open('.github/workflows/deploy.yml'))"`
Expected: no output (valid YAML)

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/deploy.yml
git commit -m "ci: add GitHub Actions deploy workflow for VPS"
```

---

### Task 5: Create `docs/deployment.md`

Step-by-step guide for one-time server provisioning. This is the longest file — all prose, no code changes.

**Files:**

- Create: `docs/deployment.md`

- [ ] **Step 1: Create `docs/deployment.md`**

````markdown
# BaseWeight Deployment Guide

This guide covers one-time server provisioning for deploying BaseWeight to a DigitalOcean droplet. Once set up, deployments happen automatically via GitHub Actions on every push to `master`.

## Prerequisites

- A domain name pointed at your server (e.g., `baseweight.pro`)
- A DigitalOcean account (or any VPS provider running Ubuntu)
- Repository secrets configured in GitHub (see [GitHub Actions Setup](#github-actions-setup))

## 1. Droplet Provisioning

Create a droplet on DigitalOcean:

- **Image**: Ubuntu 24.04 LTS
- **Size**: Basic, Regular, $6/mo (1 vCPU, 1 GB RAM, 25 GB SSD)
- **Region**: Choose the region closest to your users

Set up a firewall (DigitalOcean Cloud Firewall or `ufw`):

```bash
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP (Caddy redirect)
sudo ufw allow 443/tcp  # HTTPS
sudo ufw enable
```
````

## 2. Create a Deploy User

Create a non-root user for running the app and receiving deploys:

```bash
adduser deploy
usermod -aG sudo deploy
```

Set up SSH key authentication for the deploy user:

```bash
su - deploy
mkdir -p ~/.ssh
chmod 700 ~/.ssh
# Paste your public key (the one matching DEPLOY_SSH_KEY) into authorized_keys
nano ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

Allow the deploy user to restart the BaseWeight service without a password prompt:

```bash
sudo visudo -f /etc/sudoers.d/baseweight
```

Add this line:

```
deploy ALL=(ALL) NOPASSWD: /usr/bin/systemctl restart baseweight
```

## 3. Install Node.js 24 LTS

Install Node.js via the NodeSource repository. Only the runtime is needed — the app is built in CI.

```bash
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt-get install -y nodejs
node --version  # should print v24.x.x
```

## 4. Install Caddy

Caddy is a web server that handles HTTPS automatically (provisions and renews TLS certificates via Let's Encrypt).

```bash
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https curl
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt install caddy
```

Edit the Caddyfile:

```bash
sudo nano /etc/caddy/Caddyfile
```

Replace its contents with:

```
baseweight.pro {
    reverse_proxy localhost:3000
}
```

Start and enable Caddy:

```bash
sudo systemctl enable caddy
sudo systemctl start caddy
```

Caddy will automatically obtain a TLS certificate for your domain. Make sure your DNS A record points to the droplet's IP address before starting Caddy.

## 5. Create App Directory

```bash
su - deploy
mkdir -p ~/baseweight/data/uploads
mkdir -p ~/baseweight/config
```

Directory structure after first deploy:

```
/home/deploy/baseweight/
    .output/                   # build artifact (deployed by CI)
    data/
        baseweight.db          # SQLite database (created on first run)
        uploads/               # user-uploaded images
    config/
        production.json        # production defaults (deployed by CI)
        local-production.json  # secrets (created manually, see below)
    node_modules/              # production dependencies (installed by CI)
    package.json               # (deployed by CI)
    package-lock.json          # (deployed by CI)
```

## 6. Create Secrets Config

Create the production secrets file on the server. This file is never committed to git.

```bash
nano ~/baseweight/config/local-production.json
```

```json
{
    "betterAuthSecret": "<generate-with-openssl-rand-hex-32>",
    "betterAuthBaseURL": "https://baseweight.pro",
    "betterAuthTrustedOrigins": ["https://baseweight.pro"],
    "mailgunAPIKey": "<your-mailgun-api-key>",
    "mailgunDomain": "mg.baseweight.pro",
    "mailgunBaseURL": "https://api.mailgun.net"
}
```

Generate `betterAuthSecret`:

```bash
openssl rand -hex 32
```

If you don't have Mailgun configured yet, omit the `mailgunAPIKey`, `mailgunDomain`, and `mailgunBaseURL` fields. Magic link URLs will be logged to the server console instead of emailed.

## 7. systemd Service

Create a systemd unit file so BaseWeight starts on boot and restarts on crash:

```bash
sudo nano /etc/systemd/system/baseweight.service
```

```ini
[Unit]
Description=BaseWeight
After=network.target

[Service]
User=deploy
WorkingDirectory=/home/deploy/baseweight
Environment=NODE_ENV=production
Environment=PUBLIC_URL=https://baseweight.pro
ExecStart=/usr/bin/node .output/server/index.mjs
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
```

Enable and start the service:

```bash
sudo systemctl daemon-reload
sudo systemctl enable baseweight
sudo systemctl start baseweight
```

Check status:

```bash
sudo systemctl status baseweight
sudo journalctl -u baseweight -f  # tail logs
```

## 8. GitHub Actions Setup

The deploy workflow (`.github/workflows/deploy.yml`) runs automatically on push to `master`. It needs three repository secrets.

Go to your GitHub repo -> Settings -> Secrets and variables -> Actions, and add:

| Secret           | Value                                                                                                       |
| ---------------- | ----------------------------------------------------------------------------------------------------------- |
| `DEPLOY_HOST`    | Your droplet's IP address or hostname                                                                       |
| `DEPLOY_USER`    | `deploy`                                                                                                    |
| `DEPLOY_SSH_KEY` | The **private** SSH key for the deploy user (the one whose public key is in `~deploy/.ssh/authorized_keys`) |

Generate a dedicated deploy key pair if you don't have one:

```bash
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/deploy_key -N ""
# Copy ~/.ssh/deploy_key (private) into the DEPLOY_SSH_KEY secret
# Copy ~/.ssh/deploy_key.pub into ~deploy/.ssh/authorized_keys on the server
```

## Updating the App

Deployments happen automatically when you push to `master`. The workflow:

1. Checks out the code
2. Runs `npm ci` and `npm run build`
3. Rsyncs `.output/`, `config/production.json`, `package.json`, and `package-lock.json` to the server
4. Runs `npm ci --omit=dev` on the server
5. Restarts the `baseweight` systemd service

To deploy manually (e.g., if GitHub Actions is down):

```bash
# On your local machine
npm run build
rsync -avz .output/ config/production.json package.json package-lock.json deploy@your-server:/home/deploy/baseweight/
ssh deploy@your-server "cd ~/baseweight && npm ci --omit=dev && sudo systemctl restart baseweight"
```

## Troubleshooting

**App won't start:**

```bash
sudo journalctl -u baseweight -n 50 --no-pager
```

**Caddy certificate issues:**

```bash
sudo journalctl -u caddy -n 50 --no-pager
# Make sure DNS A record points to the droplet IP
```

**Check if the app is listening:**

```bash
curl -s http://localhost:3000  # should return HTML
```

**Restart services:**

```bash
sudo systemctl restart baseweight
sudo systemctl restart caddy
```

````

- [ ] **Step 2: Commit**

```bash
git add docs/deployment.md
git commit -m "docs: add VPS deployment guide for DigitalOcean"
````

---

### Task 6: Final review and commit

- [ ] **Step 1: Verify all new files exist**

Run: `ls -la .env.example config/production.json docs/deployment.md .github/workflows/deploy.yml`
Expected: all four files listed

- [ ] **Step 2: Verify `.gitignore` includes `local-production.json`**

Run: `grep local-production .gitignore`
Expected: `/config/local-production.json`

- [ ] **Step 3: Verify no secrets in committed files**

Run: `grep -r "mailgunAPIKey\|betterAuthSecret" config/production.json .env.example .github/workflows/deploy.yml`
Expected: no matches (secrets only exist in documentation examples in `docs/deployment.md`, never as real values)
