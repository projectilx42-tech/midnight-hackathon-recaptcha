// nullifier.js — shared nullifier generation logic
// nullifier = HMAC-SHA256(secretKey, domain + "|" + YYYY-MM-DD)
// This ties each token to one site, one day, one person.

/**
 * Derives a nullifier from the user's secret key, the target domain, and today's date.
 * The output is a 64-char hex string sent to the Midnight contract.
 *
 * @param {string} secretKey - hex string stored in chrome.storage.local
 * @param {string} domain    - e.g. "example.com"
 * @returns {Promise<string>} - hex nullifier
 */
export async function deriveNullifier(secretKey, domain) {
  const date = getTodayUTC();
  const message = `${domain}|${date}`;

  const keyBytes = hexToBytes(secretKey);
  const msgBytes = new TextEncoder().encode(message);

  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const sig = await crypto.subtle.sign("HMAC", cryptoKey, msgBytes);
  return bytesToHex(new Uint8Array(sig));
}

/**
 * Generates a cryptographically random 32-byte secret key.
 * Called once during first-time setup and stored locally.
 *
 * @returns {string} hex-encoded 32-byte key
 */
export function generateSecretKey() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return bytesToHex(bytes);
}

/**
 * Returns today's date in YYYY-MM-DD format (UTC).
 * Using UTC ensures the nullifier is consistent regardless of timezone.
 */
export function getTodayUTC() {
  return new Date().toISOString().slice(0, 10);
}

// ── helpers ────────────────────────────────────────────────────────────────

function hexToBytes(hex) {
  if (hex.length % 2 !== 0) throw new Error("Invalid hex string");
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

function bytesToHex(bytes) {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}
