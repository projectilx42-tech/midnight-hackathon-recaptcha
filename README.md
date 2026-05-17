# HumanProof — Setup Guide

ZK-powered human verification built on Midnight Network. This guide gets you from zero to a working demo.

---

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

## URLs summary

| URL | What |
|---|---|
| http://localhost:8080 | Demo site |
| http://localhost:3001 | Landing page (Next.js) |
| http://localhost:3000/health | Bridge server health check |
