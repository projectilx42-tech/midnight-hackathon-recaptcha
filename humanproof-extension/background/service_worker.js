// background/service_worker.js
// No ES module imports — inline everything so MV3 service worker loads cleanly

const BRIDGE_URL = "http://localhost:3747";

function generateSecretKey() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes).map(b => b.toString(16).padStart(2, "0")).join("");
}

function getTodayUTC() {
  return new Date().toISOString().slice(0, 10);
}

async function deriveNullifier(secretKey, domain) {
  const date = getTodayUTC();
  const message = `${domain}|${date}`;
  const keyBytes = hexToBytes(secretKey);
  const msgBytes = new TextEncoder().encode(message);
  const cryptoKey = await crypto.subtle.importKey(
    "raw", keyBytes, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", cryptoKey, msgBytes);
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, "0")).join("");
}

function hexToBytes(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

chrome.runtime.onInstalled.addListener(async () => {
  const result = await chrome.storage.local.get("secretKey");
  if (!result.secretKey) {
    const key = generateSecretKey();
    await chrome.storage.local.set({ secretKey: key, verified: false });
    console.log("[HumanProof] Secret key generated.");
  }
});

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === "VERIFY_HUMAN") {
    handleVerify(msg.domain).then(sendResponse).catch(err => {
      sendResponse({ ok: false, error: err.message });
    });
    return true;
  }
  if (msg.type === "GET_STATUS") {
    getStatus().then(sendResponse);
    return true;
  }
  if (msg.type === "RESET_IDENTITY") {
    resetIdentity().then(sendResponse);
    return true;
  }
  if (msg.type === "MARK_VERIFIED") {
    chrome.storage.local.set({ verified: true }).then(() => {
      sendResponse({ ok: true });
    });
    return true;
  }
});

async function handleVerify(domain) {
  const { secretKey, verified } = await chrome.storage.local.get(["secretKey", "verified"]);
  if (!verified) {
    return { ok: false, error: "NOT_VERIFIED", message: "ID not yet verified." };
  }
  const nullifier = await deriveNullifier(secretKey, domain);
  try {
    const res = await fetch(`${BRIDGE_URL}/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nullifier, domain }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return { ok: false, error: body.error || `HTTP ${res.status}` };
    }
    const data = await res.json();
    return { ok: true, nullifier, txHash: data.txHash };
  } catch {
    return {
      ok: false,
      error: "BRIDGE_OFFLINE",
      message: "Bridge offline — run: node mock-server.js",
    };
  }
}

async function getStatus() {
  const { verified, secretKey } = await chrome.storage.local.get(["verified", "secretKey"]);
  return { verified: !!verified, hasKey: !!secretKey };
}

async function resetIdentity() {
  const key = generateSecretKey();
  await chrome.storage.local.set({ secretKey: key, verified: false });
  return { ok: true };
}
