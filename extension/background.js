// ─── Jatayu Proctor Guard — Background Service Worker ───
// Monitors tab switches and window focus changes during active exam sessions.

let activeSessionId = null;
let apiBase = "http://localhost:8080";
let authToken = null;

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === "SESSION_START") {
    activeSessionId = message.sessionId;
    authToken = message.token;
    if (message.apiBase) apiBase = message.apiBase;
    sendResponse({ status: "monitoring" });
  }

  if (message.type === "SESSION_END") {
    activeSessionId = null;
    authToken = null;
    sendResponse({ status: "stopped" });
  }

  return true;
});

// Detect tab switches
chrome.tabs.onActivated.addListener(() => {
  if (activeSessionId) {
    reportViolation("tab_switch");
  }
});

// Detect window focus changes
chrome.windows.onFocusChanged.addListener((windowId) => {
  if (activeSessionId && windowId === chrome.windows.WINDOW_ID_NONE) {
    reportViolation("window_blur");
  }
});

async function reportViolation(violationType) {
  if (!activeSessionId || !authToken) return;

  try {
    await fetch(`${apiBase}/api/sessions/${activeSessionId}/violation`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ type: violationType }),
    });
  } catch (e) {
    console.error("[Jatayu Guard] Failed to report violation:", e);
  }
}
