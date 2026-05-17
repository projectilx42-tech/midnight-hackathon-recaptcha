![Midnight](https://img.shields.io/badge/Built%20on-Midnight-6f42ff)
![ZK](https://img.shields.io/badge/Zero--Knowledge-Enabled-blue)
![Hackathon](https://img.shields.io/badge/MLH-Midnight%20Hackathon-purple)
![Status](https://img.shields.io/badge/Status-Prototype-success)
# HumanProof — Setup Guide

HumanProof replaces CAPTCHA with zero-knowledge verification. Users verify once locally, then generate anonymous cryptographic proofs proving they are human — without exposing identity, biometrics, or personal data. This guide gets you from zero to a working demo. Privacy-preserving proof-of-humanity built on Midnight Network.

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

- 🔒 Privacy-first proof-of-humanity
- 🧠 AI-resistant verification model
- 🛡 Replay attack protection
- ⚡ Fast local proof generation
- 🕶 No biometrics stored
- 🌐 Midnight-powered verification
- 🧩 Browser extension integration
  
## Security Model

HumanProof never uploads:
- government IDs,
- biometrics,
- secret keys,
- raw identity data.

Only anonymous nullifiers are submitted to Midnight for replay-resistant verification.

## What you need (prerequisites)

- **Windows 10/11** with WSL2 enabled
- **Ubuntu** installed from the Microsoft Store
- **Docker Desktop** for Windows
- **Google Chrome**
- **Node.js** (installed inside WSL — instructions below)

If you're not sure whether you have something, the instructions below will tell you how to install it.

---

## Step 1 — Enable WSL2 and install Ubuntu

If you already have Ubuntu running in WSL, skip to Step 2.

1. Open **PowerShell as Administrator** and run:
   ```powershell
   wsl --install
   ```
2. Restart your computer when prompted.
3. After restart, **Ubuntu** will open automatically. Set a username and password.

---

## Step 2 — Install Docker Desktop

1. Download Docker Desktop from **https://www.docker.com/products/docker-desktop/**
2. Install it and start it.
3. During setup (or after) go to:
   **Settings → Resources → WSL Integration → turn on Ubuntu → Apply & Restart**

To verify it works, open Ubuntu and run:
```bash
docker ps
```
It should show an empty table (no error).

---

## Step 3 — Install Node.js inside WSL

Open **Ubuntu** and run these commands one by one:

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

## Step 4 — Clone the repository

In Ubuntu:
```bash
cd ~
git clone https://github.com/projectilx42-tech/midnight-hackathon-recaptcha.git
cd midnight-hackathon-recaptcha
```

---

## Step 5 — Install dependencies

```bash
npm install
cd bridge-server && npm install && cd ..
cd human-proof-site && npm install && cd ..
```

---

## Step 6 — Install Windows Terminal (optional but recommended)

The startup script opens tabs automatically. It needs **Windows Terminal** from the Microsoft Store:
**https://aka.ms/terminal**

---

## Step 7 — Start everything

Open **PowerShell** (not Ubuntu) and run:

```powershell
cd \\wsl$\Ubuntu\home\<your-username>\midnight-hackathon-recaptcha
.\start.ps1
```

Replace `<your-username>` with your Ubuntu username (the one you set in Step 1).

This opens 4 terminal tabs:
| Tab | What it does | Ready when you see |
|---|---|---|
| Docker Stack | Runs the Midnight blockchain | `starting indexing` in logs |
| Bridge Server | Connects extension to blockchain | `✓ Ready` |
| Demo Site | Static demo page on port 8080 | Immediately |
| Human Proof Site | Next.js landing page on port 3001 | `✓ Ready in Xms` |

**Wait for Bridge Server to print `✓ Ready` before testing — this takes about 60 seconds.**

---

## Step 8 — Install the Chrome extension

1. Open Chrome and go to `chrome://extensions`
2. Turn on **Developer mode** (toggle in the top right)
3. Click **Load unpacked**
4. Select this folder:
   ```
   \\wsl$\Ubuntu\home\<your-username>\midnight-hackathon-recaptcha\humanproof-extension
   ```
5. The HumanProof extension appears in your toolbar (shield icon)
6. Click the shield icon → **Set up identity** → upload any photo (or skip) → **Continue**

---

## Step 9 — Test it

Open **http://localhost:8080** in Chrome.

You should see the verify wall. Click **Verify** — the extension handles the rest. After a few seconds you'll be let through to the demo page.

Also works at **http://localhost:3001**.

---

## Troubleshooting

**"The system cannot find the file specified" when running start.ps1**
→ Make sure you're running from PowerShell (not Ubuntu), and the path matches your Ubuntu username.

**"docker: command not found" in Ubuntu**
→ Go to Docker Desktop → Settings → Resources → WSL Integration → enable Ubuntu → Apply & Restart.

**Bridge Server tab closes immediately**
→ Docker stack isn't ready yet. Wait until the Docker Stack tab shows `starting indexing`, then restart the Bridge Server tab manually:
```bash
cd ~/midnight-hackathon-recaptcha/bridge-server && source ~/.nvm/nvm.sh && npm start
```

**"Extension not detected" when clicking Verify**
→ Make sure you completed Step 8 and clicked "Set up identity" in the extension popup.

**"Already verified today on this domain"**
→ Click the **Unverify** button in the top-right corner of the page, then try again.

**Verify button spins for a long time**
→ Normal — ZK proof generation takes 30–60 seconds. Just wait.

---

## Running on Linux or Mac (no WSL)

The project works natively on Linux and Mac — you just can't use `start.ps1`. Open 4 terminal windows and run each manually:

**Terminal 1 — Docker stack:**
```bash
cd ~/midnight-hackathon-recaptcha/bridge-server
docker compose -f standalone.yml up
```
Wait until you see `starting indexing` before continuing.

**Terminal 2 — Bridge server:**
```bash
cd ~/midnight-hackathon-recaptcha/bridge-server
npm start
```

**Terminal 3 — Demo site:**
```bash
cd ~/midnight-hackathon-recaptcha/demo-site
python3 -m http.server 8080
```

**Terminal 4 — Next.js landing page:**
```bash
cd ~/midnight-hackathon-recaptcha/human-proof-site
npm run dev -- --port 3001
```

For the Chrome extension, in Step 8 navigate to:
```
/home/<your-username>/midnight-hackathon-recaptcha/humanproof-extension
```
(or on Mac: `/Users/<your-username>/midnight-hackathon-recaptcha/humanproof-extension`)

Everything else (Steps 3–9) is the same.

---

## URLs summary

| URL | What |
|---|---|
| http://localhost:8080 | Demo site |
| http://localhost:3001 | Landing page (Next.js) |
| http://localhost:3000/health | Bridge server health check |
