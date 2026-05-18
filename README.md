![Midnight](https://img.shields.io/badge/Built%20on-Midnight-6f42ff)
![ZK](https://img.shields.io/badge/Zero--Knowledge-Enabled-blue)
![Hackathon](https://img.shields.io/badge/MLH-Midnight%20Hackathon-purple)
![Status](https://img.shields.io/badge/Status-Prototype-success)

This project is built on the Midnight Network.

# HumanProof

HumanProof replaces CAPTCHA with zero-knowledge verification. Users verify once locally, then generate anonymous cryptographic proofs proving they are human — without exposing identity, biometrics, or personal data. Privacy-preserving proof-of-humanity built on Midnight Network.

Built for the AI internet.

---

## The Problem

Traditional CAPTCHA systems were designed for the pre-AI internet.

Modern AI systems increasingly bypass human verification systems, enabling:
- Spam
- Fake accounts
- Sybil attacks
- Automated abuse at scale

HumanProof introduces a privacy-preserving proof-of-humanity layer built for the AI era.

## Why Midnight?

HumanProof requires a verification layer that can confirm proof uniqueness without exposing user identity.

Traditional blockchains are transparent by default, making them unsuitable for privacy-sensitive identity systems. Storing identity data, verification history, or user metadata publicly would undermine the core goal of private proof-of-humanity.

Midnight enables HumanProof to:
- register anonymous nullifiers without revealing personal identity,
- prevent replay attacks through private on-chain uniqueness checks,
- separate verification from identity disclosure,
- support privacy-preserving human verification for AI-era applications.

In HumanProof, the browser extension generates proofs locally on-device, while Midnight acts as the decentralized trust layer that validates proof uniqueness without learning who the user is.

Only anonymous cryptographic nullifiers are submitted to the network — no government IDs, biometrics, names, or personal information ever appear on-chain.

## Features

- Privacy-first proof-of-humanity
- AI-resistant verification model
- Replay attack protection via on-chain nullifiers
- Fast local proof generation
- No biometrics stored
- Midnight-powered verification
- Browser extension integration

## Security Model

HumanProof never uploads:
- government IDs,
- biometrics,
- secret keys,
- raw identity data.

Only anonymous nullifiers are submitted to Midnight for replay-resistant verification.

---

# Setup Guide

One command gets the whole demo running.

## Prerequisites

- **Ubuntu 22.04+** (or any modern Linux distro)
- **Docker** with Docker Compose v2 plugin
- **Node.js 22+**
- **Python 3** (usually pre-installed on Ubuntu)
- **Google Chrome**

---

## Step 1 — Install Docker

```bash
# Add Docker's official GPG key and repository
sudo apt-get update
sudo apt-get install -y ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc

echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] \
  https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
```

Allow running Docker without `sudo`:
```bash
sudo usermod -aG docker $USER
newgrp docker
```

Verify:
```bash
docker run hello-world
```

---

## Step 2 — Install Node.js 22

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc
nvm install 22
nvm use 22
```

Verify:
```bash
node --version   # should say v22.x.x
```

---

## Step 3 — Clone and install

```bash
git clone https://github.com/projectilx42-tech/midnight-hackathon-recaptcha.git
cd midnight-hackathon-recaptcha
npm install
cd bridge-server && npm install && cd ..
cd human-proof-site && npm install && cd ..
```

---

## Step 4 — Start everything

```bash
./start.sh
```

This runs all services in one terminal with colored output:

| Label | Service | Port | Ready when |
|-------|---------|------|------------|
| `[DOCKER]` | Midnight blockchain + indexer + proof server | 9944, 8088, 6300 | Health checks pass |
| `[BRIDGE]` | Bridge server (connects extension to chain) | 3000 | `✓ Ready` in output |
| `[DEMO]` | Static demo page | 8080 | Immediately |
| `[NEXTJS]` | Next.js landing page | 3001 | `✓ Ready` in output |

The script waits for each service to be healthy before starting the next one.  
**Bridge server takes ~60 seconds after Docker is healthy** (ZK circuit setup).

Press **Ctrl+C** to stop everything cleanly.

---

## Step 5 — Install the Chrome extension

1. Open Chrome → `chrome://extensions`
2. Turn on **Developer mode** (top right toggle)
3. Click **Load unpacked**
4. Select the `humanproof-extension` folder inside the cloned repo
5. Click the HumanProof shield icon in toolbar → **Set up identity** → upload any photo (or skip) → **Continue**

---

## Step 6 — Test it

Open **http://localhost:8080** in Chrome.

You'll see the verify wall. Click **Verify** — the extension generates a ZK proof and sends it to the bridge server. After a moment you'll be let through.

Also works at **http://localhost:3001** (the landing page).

---

## Troubleshooting

**"docker: permission denied"**  
→ Run `sudo usermod -aG docker $USER`, then log out and back in (or run `newgrp docker`).

**"Cannot connect to Docker daemon"**  
→ Make sure Docker is running: `sudo systemctl start docker`

**"node: command not found" or wrong version**  
→ Source nvm: `source ~/.nvm/nvm.sh` then `nvm use 22`. The start script does this automatically.

**Bridge server fails immediately**  
→ Docker stack not ready yet. The script handles this — if you see it fail, the Docker containers may have an issue. Check `docker ps` to see container status.

**"Extension not detected" when clicking Verify**  
→ Make sure you loaded the extension (Step 5) and clicked "Set up identity" in the popup.

**"Already verified today on this domain"**  
→ Click the **Unverify** button in the top-right corner of the page, then try again.

**Port already in use**  
→ Kill the old process: `lsof -ti :3000 | xargs kill` (replace 3000 with the port number).

---

## URLs

| URL | What |
|-----|------|
| http://localhost:8080 | Demo site (static) |
| http://localhost:3001 | Landing page (Next.js) |
| http://localhost:3000/health | Bridge server health check |

---

## Alternative: Manual startup (without start.sh)

If you prefer separate terminals:

**Terminal 1 — Docker:**
```bash
cd bridge-server && docker compose -f standalone.yml up
```

**Terminal 2 — Bridge server** (wait for Docker to be healthy first):
```bash
cd bridge-server && npx tsx src/server.ts
```

**Terminal 3 — Demo site:**
```bash
cd demo-site && python3 -m http.server 8080
```

**Terminal 4 — Landing page:**
```bash
cd human-proof-site && npx next dev --port 3001
```

---

## Alternative: Running on Windows (WSL)

If you're on Windows, run via WSL2:

1. Install WSL2: `wsl --install` in PowerShell (as admin), restart
2. Install Docker Desktop → Settings → Resources → WSL Integration → enable Ubuntu
3. Install Node.js inside WSL (same as Step 2)
4. Clone and install inside WSL (same as Step 3)
5. Run `./start.sh` inside WSL terminal

Or use the PowerShell launcher (opens Windows Terminal tabs):
```powershell
cd \\wsl$\Ubuntu\home\<username>\midnight-hackathon-recaptcha
.\start.ps1
```
