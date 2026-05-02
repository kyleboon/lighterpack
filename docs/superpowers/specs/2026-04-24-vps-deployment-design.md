# VPS Deployment Design

**Issue**: #4 — Create `.env.example` and deployment documentation
**Date**: 2026-04-24

## Overview

Set up everything needed to deploy BaseWeight to a DigitalOcean droplet: documentation for one-time server provisioning, configuration files for production, and a GitHub Actions workflow for automated deploys.

## Target Environment

- **Provider**: DigitalOcean (smallest droplet, ~$6/mo)
- **OS**: Ubuntu 24.04 LTS
- **Reverse proxy**: Caddy (automatic HTTPS, minimal config)
- **Process manager**: systemd (built-in, restarts on crash)
- **Runtime**: Node.js 22 LTS (runtime only, no build on server)
- **Database**: SQLite file on disk
- **Deploy method**: GitHub Actions builds the app, rsyncs the artifact to the droplet, restarts the service

## Files to Create

### 1. `.env.example`

Documents the environment variables that override or supplement the `config` package settings. This file is checked into the repo as a reference — it is not read by the app at runtime.

```env
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

### 2. `config/production.json`

Checked into the repo. Contains production-safe defaults — no secrets. Values here override `config/default.json` when `NODE_ENV=production`.

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

Secrets go in `config/local-production.json` on the server (gitignored). That file contains:

```json
{
    "betterAuthSecret": "<random-256-bit-hex>",
    "betterAuthBaseURL": "https://baseweight.pro",
    "betterAuthTrustedOrigins": ["https://baseweight.pro"],
    "resendAPIKey": "<your-resend-api-key>"
}
```

### 3. `docs/deployment.md`

Step-by-step guide for one-time server provisioning. Sections:

#### 3.1 Droplet Provisioning

- Create a $6/mo droplet (1 vCPU, 1 GB RAM, Ubuntu 24.04 LTS)
- Enable the DigitalOcean firewall: allow ports 22 (SSH), 80 (HTTP), 443 (HTTPS)

#### 3.2 Create a Deploy User

- Create a non-root user (e.g., `deploy`) with sudo access
- Add SSH public key for the deploy user
- This is the user GitHub Actions will SSH into

#### 3.3 Install Node.js 22 LTS

- Use the NodeSource apt repository
- Only the runtime is needed — the app is built in CI

#### 3.4 Install Caddy

- Install via official apt repository
- Caddyfile config:

```
baseweight.pro {
    reverse_proxy localhost:3000
}
```

- Caddy handles TLS certificate provisioning and renewal automatically

#### 3.5 Create App Directory

```
/home/deploy/baseweight/
    .output/           # deployed build artifact
    data/
        baseweight.db  # SQLite database
        uploads/       # user-uploaded images
    config/
        local-production.json  # secrets (created manually)
    node_modules/      # production dependencies
    package.json
    package-lock.json
```

#### 3.6 Create `config/local-production.json`

- Generate a `betterAuthSecret`: `openssl rand -hex 32`
- Set `betterAuthBaseURL` and `betterAuthTrustedOrigins` to the production domain
- Add Mailgun credentials (or omit to log magic links to console)

#### 3.7 systemd Unit File

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

- `sudo systemctl enable baseweight` to start on boot

#### 3.8 GitHub Actions Setup

- Add these repository secrets:
    - `DEPLOY_HOST` — droplet IP or hostname
    - `DEPLOY_USER` — deploy username (e.g., `deploy`)
    - `DEPLOY_SSH_KEY` — private SSH key for the deploy user
- The workflow (see below) triggers on push to `master`

### 4. `.github/workflows/deploy.yml`

GitHub Actions workflow for automated deployment:

```yaml
name: Deploy

on:
    push:
        branches: [master]

jobs:
    deploy:
        runs-on: ubuntu-latest
        steps:
            - uses: actions/checkout@v4

            - uses: actions/setup-node@v4
              with:
                  node-version: 22
                  cache: npm

            - run: npm ci
            - run: npm run build

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
                      npm ci --production
                      sudo systemctl restart baseweight
```

## Design Decisions

**Why Caddy over nginx**: Automatic HTTPS with zero config. For a single-site setup, nginx adds unnecessary complexity (certbot cron, manual renewal, separate TLS config). Caddy handles it in one line.

**Why rsync over Docker**: The app is a single Node.js process with a SQLite file. Docker adds image builds, volume mounts for the database and uploads, and registry management — all overhead with no benefit at this scale.

**Why `config` package over `.env`**: The app already uses `config` throughout. The layering (`default.json` → `production.json` → `local-production.json`) maps cleanly to checked-in defaults → checked-in production overrides → gitignored secrets. Migrating to env vars would touch every `config.get()` call for no functional gain.

**Why build in CI, not on server**: Keeps the droplet minimal (no build toolchain, less RAM pressure during deploys). The built `.output/` directory is self-contained.

## Out of Scope

- Database backup strategy (issue #3)
- Email provider replacement (issue #2)
- CI/CD for non-deploy tasks (linting, tests in CI)
- Docker/containerization
- Multi-server or load-balanced deployments
