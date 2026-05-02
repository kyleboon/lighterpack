# BaseWeight Deployment Guide

This guide covers one-time server provisioning for deploying BaseWeight to a DigitalOcean droplet. Once set up, deployments happen automatically via GitHub Actions when you publish a GitHub Release.

## Prerequisites

- A domain name pointed at your server (e.g., `baseweight.pro`)
- A DigitalOcean account (or any VPS provider running Ubuntu)
- Repository secrets configured in GitHub (see [GitHub Actions Setup](#8-github-actions-setup))

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
    "resendAPIKey": "<your-resend-api-key>"
}
```

Generate `betterAuthSecret`:

```bash
openssl rand -hex 32
```

If you don't have Resend configured yet, omit the `resendAPIKey` field. Magic link URLs will be logged to the server console instead of emailed.

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

The deploy workflow (`.github/workflows/deploy.yml`) runs automatically when a GitHub Release is published. It needs three repository secrets.

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

Deployments happen automatically when you publish a GitHub Release. To deploy:

```bash
gh release create v1.0.0 --title "v1.0.0" --notes "Description of changes"
```

Or create a release in the GitHub UI: Releases -> Draft a new release -> Publish.

The workflow:

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
