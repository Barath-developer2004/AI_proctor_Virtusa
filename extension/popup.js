/**
 * Jatayu Guardian Watchdog — Popup Script
 *
 * Queries the background service worker for current status
 * and updates the popup UI every second.
 */

(function () {
  "use strict";

  var wsStatusEl = document.getElementById("ws-status");
  var eventsSentEl = document.getElementById("events-sent");
  var queueSizeEl = document.getElementById("queue-size");
  var violationCountEl = document.getElementById("violation-count");

  function updateUI() {
    chrome.runtime.sendMessage({ type: "GET_STATUS" }, function (response) {
      if (chrome.runtime.lastError || !response) {
        wsStatusEl.textContent = "Error";
        wsStatusEl.className = "badge badge-disconnected";
        return;
      }

      // WebSocket status
      if (response.isConnected) {
        wsStatusEl.textContent = "Connected";
        wsStatusEl.className = "badge badge-connected";
      } else {
        wsStatusEl.textContent = "Disconnected";
        wsStatusEl.className = "badge badge-disconnected";
      }

      // Counters
      eventsSentEl.textContent = response.totalEventsSent || 0;
      queueSizeEl.textContent = response.queueSize || 0;

      // Violations
      var count = response.totalViolations || 0;
      violationCountEl.textContent = count;

      if (count === 0) {
        violationCountEl.className = "violations-count low";
      } else if (count <= 5) {
        violationCountEl.className = "violations-count medium";
      } else {
        violationCountEl.className = "violations-count high";
      }
    });
  }

  // Initial update + poll every second
  updateUI();
  setInterval(updateUI, 1000);
})();
