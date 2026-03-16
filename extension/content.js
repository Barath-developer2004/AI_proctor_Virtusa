/**
 * Jatayu Guardian Watchdog — Content Script
 *
 * Injected into the assessment page (localhost:3000).
 * Monitors DOM events for malpractice and ghost-typing,
 * then relays warnings to the background service worker
 * which streams them over WebSocket to the backend.
 */

(function () {
  "use strict";

  // ═══════════════════════════════════════════
  //  CONFIG
  // ═══════════════════════════════════════════
  const CADENCE_BUFFER_SIZE = 20;         // keystrokes before analyzing cadence
  const GHOST_TYPING_THRESHOLD_MS = 5;    // avg inter-key delay below this = robotic
  const GHOST_TYPING_STDDEV_THRESHOLD = 3;// std-dev below this = too uniform
  const PASTE_LENGTH_THRESHOLD = 50;      // chars — pastes above this trigger alert
  const FLUSH_INTERVAL_MS = 3000;         // send telemetry batch every 3 seconds

  // ═══════════════════════════════════════════
  //  STATE
  // ═══════════════════════════════════════════
  const pendingEvents = [];          // queued telemetry events
  const keystrokeTimes = [];         // raw performance.now() timestamps
  const cadenceDeltas = [];          // inter-keystroke delays in ms

  let isMonitoring = false;
  let candidateId = null;
  let sessionToken = null;

  // ═══════════════════════════════════════════
  //  INIT — Read candidate info from the page URL
  // ═══════════════════════════════════════════
  function init() {
    const params = new URLSearchParams(window.location.search);
    candidateId = params.get("candidateId") || "1";
    sessionToken = params.get("sessionToken") || "unknown";

    // Also check chrome.storage for persisted session
    if (typeof chrome !== "undefined" && chrome.storage) {
      chrome.storage.local.get(["candidateId", "sessionToken"], function (data) {
        if (data.candidateId) candidateId = data.candidateId;
        if (data.sessionToken) sessionToken = data.sessionToken;
      });
    }

    attachListeners();
    startFlushInterval();
    isMonitoring = true;

    console.log("[Guardian Watchdog] Monitoring active for candidate:", candidateId);
  }

  // ═══════════════════════════════════════════
  //  1. MALPRACTICE DETECTION
  // ═══════════════════════════════════════════

  /**
   * TAB_SWITCH — fires when the user switches to another tab.
   * Uses the Page Visibility API (document.visibilitychange).
   */
  function onVisibilityChange() {
    if (document.visibilityState === "hidden") {
      queueEvent("TAB_SWITCH", "HIGH", {
        message: "Candidate switched away from assessment tab",
        timestamp: Date.now(),
      });
    }
  }

  /**
   * FOCUS_LOST — fires when the browser window loses focus entirely.
   * Catches Alt-Tab, clicking outside the browser, etc.
   */
  function onWindowBlur() {
    queueEvent("FOCUS_LOST", "MEDIUM", {
      message: "Browser window lost focus",
      timestamp: Date.now(),
    });
  }

  /**
   * PASTE_DETECTED — fires when a paste event contains a large text block.
   * Captures the length (NOT the content, for privacy) to flag bulk copy-paste.
   */
  function onPaste(e) {
    var clipboardData = e.clipboardData || (typeof window !== "undefined" && window.clipboardData);
    if (!clipboardData) return;

    var pastedText = clipboardData.getData("text") || "";
    var len = pastedText.length;

    if (len > PASTE_LENGTH_THRESHOLD) {
      queueEvent("PASTE_DETECTED", len > 200 ? "CRITICAL" : "HIGH", {
        message: "Large paste detected (" + len + " chars)",
        pasteLength: len,
        timestamp: Date.now(),
      });
    }
  }

  // ═══════════════════════════════════════════
  //  2. GHOST-TYPING DETECTION
  // ═══════════════════════════════════════════

  /**
   * Records the exact timestamp of every keydown using performance.now()
   * for sub-millisecond precision. When the buffer fills, it computes
   * inter-keystroke cadence and checks for robotic patterns.
   */
  function onKeyDown() {
    var now = performance.now();
    keystrokeTimes.push(now);

    // Compute delta from previous keystroke
    if (keystrokeTimes.length >= 2) {
      var delta = now - keystrokeTimes[keystrokeTimes.length - 2];
      cadenceDeltas.push(delta);
    }

    // Analyze when buffer is full
    if (cadenceDeltas.length >= CADENCE_BUFFER_SIZE) {
      analyzeCadence();
    }
  }

  /**
   * Analyzes the cadence buffer for ghost-typing patterns:
   * - Extremely low average delay (< 5ms) = faster than human typing
   * - Extremely low standard deviation (< 3ms) = unnaturally uniform rhythm
   */
  function analyzeCadence() {
    var deltas = cadenceDeltas.slice(-CADENCE_BUFFER_SIZE);

    var sum = 0;
    for (var i = 0; i < deltas.length; i++) {
      sum += deltas[i];
    }
    var avg = sum / deltas.length;

    // Standard deviation
    var sqDiffSum = 0;
    for (var j = 0; j < deltas.length; j++) {
      var diff = deltas[j] - avg;
      sqDiffSum += diff * diff;
    }
    var stdDev = Math.sqrt(sqDiffSum / deltas.length);

    var isGhostTyping =
      avg < GHOST_TYPING_THRESHOLD_MS ||
      stdDev < GHOST_TYPING_STDDEV_THRESHOLD;

    if (isGhostTyping) {
      queueEvent("GHOST_TYPING", "CRITICAL", {
        message: "Robotic typing pattern detected (avg: " +
          avg.toFixed(2) + "ms, stdDev: " + stdDev.toFixed(2) + "ms)",
        cadenceArray: deltas.map(function (d) { return Math.round(d * 100) / 100; }),
        avgDelay: Math.round(avg * 100) / 100,
        stdDev: Math.round(stdDev * 100) / 100,
        timestamp: Date.now(),
      });
    }

    // Clear buffer after analysis
    cadenceDeltas.length = 0;
    keystrokeTimes.length = 0;
  }

  // ═══════════════════════════════════════════
  //  EVENT QUEUE & FLUSH
  // ═══════════════════════════════════════════

  function queueEvent(eventType, severity, details) {
    var payload = {
      candidateId: Number(candidateId),
      sessionToken: sessionToken,
      eventType: eventType,
      severity: severity,
      timestamp: Date.now(),
      pasteLength: details.pasteLength || null,
      cadenceArray: details.cadenceArray || null,
      message: details.message || "",
    };

    pendingEvents.push(payload);
    console.log("[Guardian Watchdog] Event queued:", eventType, severity);
  }

  /**
   * Every 3 seconds, flush all pending events to the background
   * service worker via chrome.runtime.sendMessage.
   */
  function flushEvents() {
    if (pendingEvents.length === 0) return;

    var batch = pendingEvents.splice(0, pendingEvents.length);

    if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage(
        { type: "TELEMETRY_BATCH", events: batch },
        function (response) {
          if (chrome.runtime.lastError) {
            console.warn("[Guardian Watchdog] Failed to send batch:", chrome.runtime.lastError.message);
            // Re-queue failed events
            for (var i = 0; i < batch.length; i++) {
              pendingEvents.push(batch[i]);
            }
          }
        }
      );
    } else {
      // Fallback: direct WebSocket (for testing outside extension context)
      sendDirectWebSocket(batch);
    }
  }

  /**
   * Fallback for testing: send directly to WebSocket if not in extension context.
   */
  var directWs = null;
  function sendDirectWebSocket(batch) {
    if (!directWs || directWs.readyState !== WebSocket.OPEN) {
      try {
        directWs = new WebSocket("ws://localhost:8081/ws/telemetry");
        directWs.onopen = function () {
          for (var i = 0; i < batch.length; i++) {
            directWs.send(JSON.stringify(batch[i]));
          }
        };
        directWs.onerror = function () {
          console.warn("[Guardian Watchdog] WebSocket fallback connection failed");
        };
      } catch (e) {
        console.warn("[Guardian Watchdog] WebSocket fallback error:", e);
      }
    } else {
      for (var i = 0; i < batch.length; i++) {
        directWs.send(JSON.stringify(batch[i]));
      }
    }
  }

  function startFlushInterval() {
    setInterval(flushEvents, FLUSH_INTERVAL_MS);
  }

  // ═══════════════════════════════════════════
  //  ATTACH ALL LISTENERS
  // ═══════════════════════════════════════════
  function attachListeners() {
    // Malpractice
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("blur", onWindowBlur);
    document.addEventListener("paste", onPaste, true); // capture phase

    // Ghost-typing
    document.addEventListener("keydown", onKeyDown, true); // capture phase
  }

  // ═══════════════════════════════════════════
  //  CLEANUP (if extension is unloaded)
  // ═══════════════════════════════════════════
  function cleanup() {
    document.removeEventListener("visibilitychange", onVisibilityChange);
    window.removeEventListener("blur", onWindowBlur);
    document.removeEventListener("paste", onPaste, true);
    document.removeEventListener("keydown", onKeyDown, true);
    isMonitoring = false;
  }

  // Listen for cleanup signal from background
  if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.onMessage) {
    chrome.runtime.onMessage.addListener(function (msg) {
      if (msg.type === "STOP_MONITORING") {
        cleanup();
      }
    });
  }

  // ═══════════════════════════════════════════
  //  START
  // ═══════════════════════════════════════════
  init();
})();
