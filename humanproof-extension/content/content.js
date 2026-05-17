// content/content.js
// Injected into every page. Listens for HumanProof challenge events
// dispatched by websites that want to verify the user is human.

(function () {
  // Websites dispatch a CustomEvent to trigger verification:
  //   document.dispatchEvent(new CustomEvent("humanproof:challenge", {
  //     detail: { requestId: "abc123" }
  //   }));
  //
  // HumanProof responds with:
  //   document.dispatchEvent(new CustomEvent("humanproof:response", {
  //     detail: { requestId: "abc123", ok: true, nullifier: "0x..." }
  //   }));

  document.addEventListener("humanproof:challenge", async (e) => {
    const { requestId } = e.detail || {};
    const domain = location.hostname;

    let result;
    try {
      result = await chrome.runtime.sendMessage({ type: "VERIFY_HUMAN", domain });
    } catch (err) {
      result = { ok: false, error: "EXTENSION_ERROR", message: err.message };
    }

    document.dispatchEvent(
      new CustomEvent("humanproof:response", {
        detail: { requestId, ...result },
      })
    );
  });

  // Expose a tiny helper so demo sites can do: window.HumanProof.verify()
  window.HumanProof = {
    verify: () => {
      return new Promise((resolve) => {
        const requestId = Math.random().toString(36).slice(2);

        const handler = (e) => {
          if (e.detail?.requestId === requestId) {
            document.removeEventListener("humanproof:response", handler);
            resolve(e.detail);
          }
        };

        document.addEventListener("humanproof:response", handler);
        document.dispatchEvent(
          new CustomEvent("humanproof:challenge", { detail: { requestId } })
        );

        // Timeout after 15s
        setTimeout(() => {
          document.removeEventListener("humanproof:response", handler);
          resolve({ ok: false, error: "TIMEOUT" });
        }, 15000);
      });
    },
  };
})();
