// popup/popup.js

function show(id) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}

function hide(el) { el.classList.add("hidden"); }
function reveal(el) { el.classList.remove("hidden"); }

// ── Init ─────────────────────────────────────────────────────────────────────

async function init() {
  show("screen-loading");

  let status;
  try {
    status = await chrome.runtime.sendMessage({ type: "GET_STATUS" });
  } catch (e) {
    await new Promise(r => setTimeout(r, 300));
    status = await chrome.runtime.sendMessage({ type: "GET_STATUS" });
  }

  if (!status || !status.hasKey || !status.verified) {
    showSetupScreen();
    return;
  }

  await showVerifiedScreen();
}

// ── Setup screen ──────────────────────────────────────────────────────────────

function showSetupScreen() {
  show("screen-setup");
  const btn = document.getElementById("btn-setup");
  const newBtn = btn.cloneNode(true);
  btn.parentNode.replaceChild(newBtn, btn);
  newBtn.addEventListener("click", showIdUploadScreen, { once: true });
}

// ── ID Upload screen ──────────────────────────────────────────────────────────

function showIdUploadScreen() {
  show("screen-id-upload");

  const zone = document.getElementById("id-drop-zone");
  const input = document.getElementById("id-file-input");
  const label = document.getElementById("drop-label");
  const continueBtn = document.getElementById("btn-id-continue");

  // Replace elements to clear any prior listeners
  const newZone = zone.cloneNode(true);
  zone.parentNode.replaceChild(newZone, zone);
  const newInput = newZone.querySelector("#id-file-input");
  const newLabel = newZone.querySelector("#drop-label");
  const newContinue = document.getElementById("btn-id-continue").cloneNode(true);
  continueBtn.parentNode.replaceChild(newContinue, continueBtn);

  newZone.addEventListener("click", () => newInput.click());

  newZone.addEventListener("dragover", (e) => {
    e.preventDefault();
    newZone.classList.add("drag-over");
  });

  newZone.addEventListener("dragleave", () => newZone.classList.remove("drag-over"));

  newZone.addEventListener("drop", (e) => {
    e.preventDefault();
    newZone.classList.remove("drag-over");
    const file = e.dataTransfer.files[0];
    if (file) { newZone.classList.add("has-file"); newLabel.textContent = `✓ ${file.name}`; }
  });

  newInput.addEventListener("change", () => {
    if (newInput.files[0]) { newZone.classList.add("has-file"); newLabel.textContent = `✓ ${newInput.files[0].name}`; }
  });

  newContinue.addEventListener("click", async () => {
    newContinue.disabled = true;
    newContinue.querySelector("span").textContent = "Verifying…";
    await chrome.runtime.sendMessage({ type: "MARK_VERIFIED" });
    await showVerifiedScreen();
  }, { once: true });
}

// ── Verify screen ─────────────────────────────────────────────────────────────

async function showVerifiedScreen() {
  show("screen-verified");

  let domain = "unknown";
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.url && !tab.url.startsWith("chrome://")) {
      domain = new URL(tab.url).hostname;
    }
  } catch {
    domain = "localhost";
  }

  document.getElementById("current-domain").textContent = domain;

  const resetBtn = document.getElementById("btn-reset");
  const newResetBtn = resetBtn.cloneNode(true);
  resetBtn.parentNode.replaceChild(newResetBtn, resetBtn);
  newResetBtn.addEventListener("click", resetIdentity, { once: true });
}

// ── Reset ─────────────────────────────────────────────────────────────────────

async function resetIdentity() {
  if (!confirm("Reset your HumanProof identity?")) {
    // Re-attach listener since { once: true } consumed it
    document.getElementById("btn-reset").addEventListener("click", resetIdentity, { once: true });
    return;
  }
  await chrome.runtime.sendMessage({ type: "RESET_IDENTITY" });
  showSetupScreen();
}

// ── Boot ──────────────────────────────────────────────────────────────────────
init().catch(err => {
  console.error("[HumanProof] Init failed:", err);
  showSetupScreen();
});
