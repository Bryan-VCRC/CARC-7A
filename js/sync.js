/* ============================================
   CARC-7A — Sync Layer
   WebSocket (cross-device) with BroadcastChannel fallback (same-browser)
   ============================================ */

(function () {
  "use strict";

  var ws = null;
  var bc = null;
  var messageHandler = null;
  var statusHandler = null;
  var role = null; // "admin" or "player"
  var reconnectTimer = null;
  var wsUrl = null;

  function setStatus(online) {
    if (statusHandler) statusHandler(online);
  }

  function connect() {
    if (ws && ws.readyState <= 1) return; // already open or connecting

    ws = new WebSocket(wsUrl);

    ws.onopen = function () {
      // Identify our role to the server
      ws.send(JSON.stringify({ _role: role }));

      // Admin requests current state from player on connect
      if (role === "admin") {
        ws.send(JSON.stringify({ type: "request-state" }));
      }
      setStatus(true);
    };

    ws.onmessage = function (e) {
      try {
        var data = JSON.parse(e.data);
        if (messageHandler) messageHandler(data);
      } catch (err) {}
    };

    ws.onclose = function () {
      setStatus(false);
      // Reconnect after a short delay
      clearTimeout(reconnectTimer);
      reconnectTimer = setTimeout(connect, 2000);
    };

    ws.onerror = function () {
      ws.close();
    };
  }

  function init(clientRole) {
    role = clientRole;

    // Build WebSocket URL from current page location
    var loc = window.location;
    var protocol = loc.protocol === "https:" ? "wss:" : "ws:";
    wsUrl = protocol + "//" + loc.host;

    // Try WebSocket first
    try {
      connect();
    } catch (e) {}

    // BroadcastChannel fallback for same-browser usage (file:// or no server)
    try {
      bc = new BroadcastChannel("carc7a_admin");
      bc.onmessage = function (e) {
        if (messageHandler) messageHandler(e.data);
      };
    } catch (e) {}
  }

  function send(msg) {
    // Send via WebSocket if connected
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(msg));
    }

    // Also send via BroadcastChannel for same-browser tabs
    if (bc) {
      try { bc.postMessage(msg); } catch (e) {}
    }
  }

  function onMessage(fn) {
    messageHandler = fn;
  }

  function onStatus(fn) {
    statusHandler = fn;
  }

  window.GameSync = {
    init: init,
    send: send,
    onMessage: onMessage,
    onStatus: onStatus,
  };
})();
