// ─── Jatayu Proctor Guard — Content Script ───
// Injected into the exam page. Captures high-precision keystroke events
// and bridges them to the page via postMessage. Also detects DevTools.

(function () {
  "use strict";

  // ─── Keystroke capture with high-precision timestamps ───
  let lastKeyTime = 0;

  function captureKeystroke(e) {
    const now = performance.now();
    const delta = lastKeyTime ? now - lastKeyTime : 0;
    lastKeyTime = now;

    // Send to the page (the Next.js app listens for this)
    window.postMessage(
      {
        source: "jatayu-proctor-guard",
        type: "KEYSTROKE",
        payload: {
          key: e.key,
          code: e.code,
          event_type: e.type,
          timestamp: now,
          delta: delta,
          ctrl: e.ctrlKey,
          meta: e.metaKey,
          shift: e.shiftKey,
        },
      },
      "*"
    );

    // Flag copy-paste attempts
    if ((e.ctrlKey || e.metaKey) && (e.key === "v" || e.key === "c")) {
      window.postMessage(
        {
          source: "jatayu-proctor-guard",
          type: "CLIPBOARD_EVENT",
          payload: { action: e.key === "v" ? "paste" : "copy", timestamp: now },
        },
        "*"
      );
    }
  }

  document.addEventListener("keydown", captureKeystroke, true);
  document.addEventListener("keyup", captureKeystroke, true);

  // ─── DevTools detection ───
  const devToolsThreshold = 160;
  let devToolsOpen = false;

  setInterval(() => {
    const widthThreshold = window.outerWidth - window.innerWidth > devToolsThreshold;
    const heightThreshold = window.outerHeight - window.innerHeight > devToolsThreshold;

    if ((widthThreshold || heightThreshold) && !devToolsOpen) {
      devToolsOpen = true;
      window.postMessage(
        {
          source: "jatayu-proctor-guard",
          type: "DEVTOOLS_OPEN",
          payload: { timestamp: performance.now() },
        },
        "*"
      );
    } else if (!widthThreshold && !heightThreshold) {
      devToolsOpen = false;
    }
  }, 1000);

  // ─── Listen for session control from the page ───
  window.addEventListener("message", (event) => {
    if (event.data?.source !== "jatayu-proctor-app") return;

    if (event.data.type === "START_MONITORING") {
      chrome.runtime.sendMessage({
        type: "SESSION_START",
        sessionId: event.data.sessionId,
        token: event.data.token,
        apiBase: event.data.apiBase,
      });
    }

    if (event.data.type === "STOP_MONITORING") {
      chrome.runtime.sendMessage({ type: "SESSION_END" });
    }
  });

  console.log("[Jatayu Guard] Content script loaded.");
})();
