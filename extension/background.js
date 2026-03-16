/**
 * Jatayu Guardian Watchdog — Background Service Worker
 *
 * Manifest V3 service worker that:
 * 1. Maintains a persistent WebSocket connection to the Java backend
 * 2. Receives telemetry batches from the content script
 * 3. Streams them to ws://localhost:8081/ws/telemetry
 * 4. Uses chrome.alarms to keep itself alive
 */

// ═══════════════════════════════════════════
//  CONFIG
// ═══════════════════════════════════════════
const WS_URL = "ws://localhost:8081/ws/telemetry";
const RECONNECT_DELAY_MS = 3000;
const KEEPALIVE_ALARM = "guardian-keepalive";

// ═══════════════════════════════════════════
//  STATE
// ═══════════════════════════════════════════
let ws = null;
let isConnected = false;
let reconnectTimer = null;
let eventQueue = [];           // buffer events when WS is disconnected
let totalEventsSent = 0;
let totalViolations = 0;

// ═══════════════════════════════════════════
//  WEBSOCKET CONNECTION
// ═══════════════════════════════════════════

function connectWebSocket() {
  if (ws && (ws.readyState === WebSocket.CONNECTING || ws.readyState === WebSocket.OPEN)) {
    return; // already connected or connecting
  }

  try {
    ws = new WebSocket(WS_URL);

    ws.onopen = function () {
      isConnected = true;
      console.log("[Guardian BG] WebSocket connected to backend");
      updateBadge("ON", "#2ed573");

      // Flush any queued events
      flushQueue();
    };

    ws.onmessage = function (event) {
      // Backend acknowledgement
      console.log("[Guardian BG] Server ACK:", event.data);
    };

    ws.onclose = function (event) {
      isConnected = false;
      ws = null;
      console.log("[Guardian BG] WebSocket closed:", event.code, event.reason);
      updateBadge("OFF", "#ff4757");
      scheduleReconnect();
    };

    ws.onerror = function (error) {
      console.error("[Guardian BG] WebSocket error:", error);
      isConnected = false;
      updateBadge("ERR", "#ff4757");
    };
  } catch (e) {
    console.error("[Guardian BG] Failed to create WebSocket:", e);
    isConnected = false;
    scheduleReconnect();
  }
}

function scheduleReconnect() {
  if (reconnectTimer) return;
  reconnectTimer = setTimeout(function () {
    reconnectTimer = null;
    connectWebSocket();
  }, RECONNECT_DELAY_MS);
}

// ═══════════════════════════════════════════
//  SEND TELEMETRY
// ═══════════════════════════════════════════

function sendEvent(payload) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(payload));
    totalEventsSent++;
    return true;
  } else {
    // Queue for later
    eventQueue.push(payload);
    return false;
  }
}

function flushQueue() {
  while (eventQueue.length > 0 && ws && ws.readyState === WebSocket.OPEN) {
    var event = eventQueue.shift();
    ws.send(JSON.stringify(event));
    totalEventsSent++;
  }
}

// ═══════════════════════════════════════════
//  MESSAGE HANDLER (from content script)
// ═══════════════════════════════════════════

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  if (message.type === "TELEMETRY_BATCH") {
    var events = message.events || [];
    var sent = 0;

    for (var i = 0; i < events.length; i++) {
      if (sendEvent(events[i])) {
        sent++;
      }
      totalViolations++;
    }

    // Persist violation count
    chrome.storage.local.set({ totalViolations: totalViolations });

    sendResponse({
      status: "ok",
      sent: sent,
      queued: eventQueue.length,
    });

    return true; // keep channel open for async sendResponse
  }

  if (message.type === "GET_STATUS") {
    sendResponse({
      isConnected: isConnected,
      totalEventsSent: totalEventsSent,
      totalViolations: totalViolations,
      queueSize: eventQueue.length,
    });
    return true;
  }

  if (message.type === "SET_CANDIDATE") {
    chrome.storage.local.set({
      candidateId: message.candidateId,
      sessionToken: message.sessionToken,
    });
    sendResponse({ status: "ok" });
    return true;
  }
});

// ═══════════════════════════════════════════
//  BADGE INDICATOR
// ═══════════════════════════════════════════

function updateBadge(text, color) {
  try {
    chrome.action.setBadgeText({ text: text });
    chrome.action.setBadgeBackgroundColor({ color: color });
  } catch (e) {
    // Badge API may not be available in all contexts
  }
}

// ═══════════════════════════════════════════
//  KEEP-ALIVE (Manifest V3 service workers can be killed)
// ═══════════════════════════════════════════

chrome.alarms.create(KEEPALIVE_ALARM, { periodInMinutes: 0.4 }); // ~24 seconds

chrome.alarms.onAlarm.addListener(function (alarm) {
  if (alarm.name === KEEPALIVE_ALARM) {
    // Ensure WebSocket stays connected
    if (!isConnected) {
      connectWebSocket();
    }
  }
});

// ═══════════════════════════════════════════
//  STARTUP
// ═══════════════════════════════════════════

// Load persisted state
chrome.storage.local.get(["totalViolations"], function (data) {
  if (data.totalViolations) {
    totalViolations = data.totalViolations;
  }
});

// Connect on startup
connectWebSocket();

console.log("[Guardian BG] Watchdog service worker initialized");
