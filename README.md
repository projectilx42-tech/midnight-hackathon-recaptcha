# HumanProof

A reCAPTCHA replacement built on [Midnight Network](https://midnight.network/) using zero-knowledge proofs.

**MLH Midnight Hackathon 2026**

---

## What it does

Instead of solving image puzzles, users verify their identity once (e.g. via government ID — mocked in this demo). After that, any website can request a ZK proof that the visitor is a real human. The proof is a **nullifier** — a cryptographic value derived from the user's secret key, the domain, and today's date. It gets registered on-chain, so the same person can't verify twice on the same site in one day.

No name, ID number, or biometrics ever leave the user's device or appear on-chain.

## Architecture

```
Demo Site (localhost:8080)
    ↓  humanproof:challenge  (CustomEvent)
Browser Extension  (content script)
    ↓  POST /verify  { nullifier, domain }
Bridge Server  (Node.js + Express, localhost:3000)
    ↓  contract.callTx.verify(nullifierBytes)
Midnight Smart Contract  (standalone Docker network)
```

## Project structure

```
midnight-hackathon-recaptcha/
├── contract/                  # Compact smart contract (nullifier registry)
│   └── src/humanproof.compact
├── bridge-server/             # Node.js bridge between extension and Midnight
│   ├── src/server.ts          # Express API
│   ├── src/midnight.ts        # Midnight SDK integration
│   └── standalone.yml         # Docker stack (node + indexer + proof-server)
├── demo-site/                 # Static HTML demo page
│   └── index.html
├── humanproof-extension/      # Browser extension source (separate repo / zip)
└── start.ps1                  # One-click startup script (Windows)
```

---

## Prerequisites

- **Windows** with WSL2 (Ubuntu)
- **Node.js v22** via nvm in WSL (`source ~/.nvm/nvm.sh`)
- **Docker Desktop** (with WSL2 backend enabled)
- **Compact toolchain 0.31** in WSL:
  ```bash
  curl --proto '=https' --tlsv1.2 -LsSf https://github.com/midnightntwrk/compact/releases/latest/download/compact-installer.sh | sh
  source $HOME/.local/bin/env
  compact update 0.31.0
  ```
- **Chrome** (for the extension)

---

## Quick start

### Option A — one click (Windows Terminal required)

```powershell
.\start.ps1
```

Opens 3 tabs automatically in the right order. Wait ~60s for the bridge server to print `✓ Ready`.

### Option B — manual (3 WSL terminals)

**Terminal 1 — Docker stack:**
```bash
cd /home/matej/midnight-hackathon-recaptcha/bridge-server
docker compose -f standalone.yml up
```
Wait until you see `starting indexing` in the indexer logs before continuing.

**Terminal 2 — Bridge server:**
```bash
source ~/.nvm/nvm.sh
cd /home/matej/midnight-hackathon-recaptcha/bridge-server
npm start
```
Wait for: `✓ Ready. Accepting requests on POST http://localhost:3000/verify`

**Terminal 3 — Demo site:**
```bash
cd /home/matej/midnight-hackathon-recaptcha/demo-site
python3 -m http.server 8080
```

---

## Load the extension in Chrome

1. Go to `chrome://extensions`
2. Enable **Developer mode** (top right toggle)
3. Click **Load unpacked**
4. Select the `humanproof-extension` folder
5. Click the extension icon → **"Set up identity"**

Then open `http://localhost:8080` and click **Verify Humanity**.

---

## Building the smart contract

If you change `contract/src/humanproof.compact`, recompile and rebuild:

```bash
source ~/.nvm/nvm.sh
cd /home/matej/midnight-hackathon-recaptcha/contract
compact compile src/humanproof.compact src/managed/humanproof
npm run build
npm run test
```

---

## Known limitations

### Bridge server runs locally — only works for the demo presenter

The extension always connects to `http://localhost:3000`. This means:

- ✅ **Works:** You open any website (including one hosted on the internet) on your own machine — the extension finds your local bridge server and everything works.
- ❌ **Doesn't work:** Someone else opens your demo site on their machine — their extension looks for `localhost:3000` on *their* computer, where no bridge is running.

In a real product, the bridge server would be bundled as part of a local desktop app or browser extension (similar to how MetaMask embeds a wallet locally). Every user would run their own bridge.

### "Verify on this site" button in the extension popup is redundant

The popup has a manual "Verify on this site" button. This is unnecessary for normal use — when a website requests verification, the extension handles it automatically in the background via the `humanproof:challenge` CustomEvent. The button is only useful for manual testing without a demo page.

### Proof generation takes 30–60 seconds

ZK proof generation on the proof-server is slow. The extension has a 15-second timeout, so the bridge uses an **optimistic response** pattern: it validates the nullifier locally (in-memory set), returns success immediately, then submits the transaction to Midnight asynchronously in the background. This means the HTTP response comes back fast, but the on-chain confirmation happens later.

### Identity verification is mocked

Clicking "Set up identity" in the extension just sets a `verified: true` flag in local storage. In a real version, this step would involve scanning a government ID through a trusted third-party verification service before the flag is set.
