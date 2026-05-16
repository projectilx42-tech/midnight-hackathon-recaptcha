// popup/popup.js

function show(id) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}

function hide(el) { el.classList.add("hidden"); }
function reveal(el) { el.classList.remove("hidden"); }

function truncate(hex, n = 10) {
  return hex ? `${hex.slice(0, n)}…${hex.slice(-4)}` : "";
}

// ── Init ─────────────────────────────────────────────────────────────────────

async function init() {
  show("screen-loading");

  let status;
  try {
    status = await chrome.runtime.sendMessage({ type: "GET_STATUS" });
  } catch (e) {
    // Service worker may have just woken up — retry once
    await new Promise(r => setTimeout(r, 300));
    status = await chrome.runtime.sendMessage({ type: "GET_STATUS" });
  }

  if (!status || !status.hasKey) {
    show("screen-setup");
    setupSetupScreen();
    return;
  }

  if (!status.verified) {
    show("screen-setup");
    setupSetupScreen();
    return;
  }

  show("screen-verified");
  await setupVerifyScreen();
}

// ── Setup screen ──────────────────────────────────────────────────────────────

function setupSetupScreen() {
  const btn = document.getElementById("btn-setup");
  btn.addEventListener("click", async () => {
    btn.disabled = true;
    btn.querySelector("span").textContent = "Setting up…";

    // Mark verified via service worker (not direct storage write)
    await chrome.runtime.sendMessage({ type: "MARK_VERIFIED" });

    show("screen-verified");
    await setupVerifyScreen();
  });
}

// ── Verify screen ─────────────────────────────────────────────────────────────

async function setupVerifyScreen() {
  let domain = "unknown";

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.url && !tab.url.startsWith("chrome://")) {
      domain = new URL(tab.url).hostname;
    }
  } catch (e) {
    domain = "localhost";
  }

  document.getElementById("current-domain").textContent = domain;

  // Remove any old listeners by replacing the button
  const oldBtn = document.getElementById("btn-verify");
  const newBtn = oldBtn.cloneNode(true);
  oldBtn.parentNode.replaceChild(newBtn, oldBtn);

  document.getElementById("btn-verify").addEventListener("click", () => runVerify(domain));
  document.getElementById("btn-reset").addEventListener("click", resetIdentity);
}

// ── Verify flow ───────────────────────────────────────────────────────────────

async function runVerify(domain) {
  const btn        = document.getElementById("btn-verify");
  const btnText    = document.getElementById("btn-verify-text");
  const btnIcon    = document.getElementById("btn-verify-icon");
  const btnSpinner = document.getElementById("btn-spinner");
  const boxSuccess = document.getElementById("result-success");
  const boxError   = document.getElementById("result-error");

  hide(boxSuccess);
  hide(boxError);

  btn.disabled = true;
  hide(btnIcon);
  btnText.textContent = "Verifying…";
  reveal(btnSpinner);

  const result = await chrome.runtime.sendMessage({ type: "VERIFY_HUMAN", domain });

  btn.disabled = false;
  hide(btnSpinner);
  reveal(btnIcon);
  btnText.textContent = "Verify on this site";

  if (result.ok) {
    document.getElementById("result-nullifier").textContent =
      result.nullifier ? `nullifier: ${truncate(result.nullifier)}` : "";
    reveal(boxSuccess);
  } else {
    let msg = result.message || result.error || "Unknown error";
    if (result.error === "BRIDGE_OFFLINE") msg = "Bridge offline — run: node mock-server.js";
    if (result.error === "NOT_VERIFIED")   msg = "Complete ID setup first.";
    document.getElementById("result-error-msg").textContent = msg;
    reveal(boxError);
  }
}

// ── Reset ─────────────────────────────────────────────────────────────────────

async function resetIdentity() {
  if (!confirm("Reset your HumanProof identity?")) return;
  await chrome.runtime.sendMessage({ type: "RESET_IDENTITY" });
  show("screen-setup");
  setupSetupScreen();
}

// ── Boot ──────────────────────────────────────────────────────────────────────
init().catch(err => {
  console.error("[HumanProof] Init failed:", err);
  show("screen-setup");
  setupSetupScreen();
});
