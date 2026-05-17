# HumanProof — Browser Extension (Person 2)

Zero-knowledge human verification. Manifest v3 Chrome extension.

---

## File structure

```
humanproof-extension/
├── manifest.json              — Manifest v3, host_permissions for localhost:3747
├── nullifier.js               — Crypto: HMAC-SHA256(secretKey, domain|date)
├── background/
│   └── service_worker.js      — Key generation, message router, fetch to bridge
├── content/
│   └── content.js             — Injected into pages; exposes window.HumanProof.verify()
└── popup/
    ├── popup.html             — Three screens: setup / verified / loading
    ├── popup.css              — Dark ZK aesthetic
    └── popup.js               — Screen logic, domain detection, verify UX

humanproof-mockserver/
└── mock-server.js             — Fake Midnight bridge (no deps, plain Node.js)
```

---

## Quick start

### 1. Run the mock server

```bash
cd humanproof-mockserver
node mock-server.js
# → Listening on http://localhost:3747
```

Requires Node.js ≥ 18 (uses native `http`, no npm install needed).

### 2. Load the extension

1. Open `chrome://extensions`
2. Enable **Developer mode** (top right)
3. Click **Load unpacked**
4. Select the `humanproof-extension/` folder

### 3. Test it

- Click the extension icon → you'll see the setup screen
- Click **"Set up identity"** (mocks the ID scan for now)
- You're now on the verified screen — click **"Verify on this site"**
- Watch the mock server logs: `✅ Verified human on ...`

---

## Handoff notes for Person 1 (Midnight bridge)

The extension POSTs to `http://localhost:3747/verify` with:

```json
{
  "nullifier": "<64-char hex string>",
  "domain":    "example.com"
}
```

Expected response on success:

```json
{
  "ok": true,
  "txHash": "0x..."
}
```

Expected response on replay attack (nullifier already used):

```json
{
  "error": "NULLIFIER_ALREADY_USED"
}
```

HTTP status codes: `200` success, `409` replay, `400` bad input.

**The nullifier derivation:**
```
nullifier = HMAC-SHA256(secretKey, "${domain}|${YYYY-MM-DD}")
```
where `secretKey` is a random 32-byte hex string generated once on extension install.

Person 1's Compact contract must accept this exact nullifier format.

---

## What's mocked (to replace for production)

| Item | Current | Real |
|------|---------|------|
| ID scan | `chrome.storage.set({ verified: true })` on button click | NFC/camera ID verification + ZK proof generation |
| Bridge | `mock-server.js` in-memory | Person 1's `server.js` → Midnight SDK |
| Icons | Missing (add PNGs) | 16×16, 48×48, 128×128 |

---

## Key decisions

- **Nullifier scope**: `domain + date` → one proof per site per day. If daily is too strict, change `getTodayUTC()` in `nullifier.js` to return a week/month.
- **Port 3747**: arbitrary, not well-known. Change in `manifest.json` (`host_permissions`) and `service_worker.js` (`BRIDGE_URL`) together.
- **No npm**: extension is vanilla JS, no bundler. `nullifier.js` uses ES module imports — works natively in MV3 service workers.
