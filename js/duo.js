/* ============================================
   CARC-7A — Two Player (Co-op) Terminal
   Simplified hotseat: HP + Stress for 2 crew.
   Reuses the boot, ECG monitor and pip patterns
   from the single-player terminal.
   ============================================ */

(function () {
  "use strict";

  // --- State ---
  const DEFAULTS = { hp: 6, hpMax: 6, stress: 0, stressMax: 6 };

  const STATE = {
    active: 0,
    players: [makeDefault(), makeDefault()],
  };

  function makeDefault() {
    return { hp: DEFAULTS.hp, hpMax: DEFAULTS.hpMax, stress: DEFAULTS.stress, stressMax: DEFAULTS.stressMax };
  }

  function activePlayer() {
    return STATE.players[STATE.active];
  }

  // --- Save / Load ---
  const SAVE_KEY = "carc7a_duo_save";

  function save() {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify({ version: 1, active: STATE.active, players: STATE.players }));
    } catch (e) { /* storage unavailable — fail silently */ }
  }

  function load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw);
      if (!data || !Array.isArray(data.players)) return;
      data.players.slice(0, 2).forEach(function (saved, i) {
        const p = STATE.players[i];
        ["hp", "hpMax", "stress", "stressMax"].forEach(function (k) {
          if (typeof saved[k] === "number") p[k] = saved[k];
        });
      });
      if (data.active === 0 || data.active === 1) STATE.active = data.active;
    } catch (e) { /* ignore corrupt save */ }
  }

  // --- Boot Sequence ---
  const BOOT_LINES = [
    "MONARCH CORP. BIOS v4.2.1",
    "",
    "INITIALIZING CO-OP TERMINAL...",
    "  CREW SLOT 1 ............. LINKED",
    "  CREW SLOT 2 ............. LINKED",
    "  VITALS MONITOR .......... ONLINE",
    "",
    "TERMINAL READY.",
  ];

  function runBootSequence() {
    const bootScreen = document.getElementById("boot-screen");
    const bootLog = document.getElementById("boot-log");
    const app = document.getElementById("app");

    bootScreen.addEventListener("touchstart", function () { SFX.ensureContext(); }, { once: true });
    bootScreen.addEventListener("click", function () { SFX.ensureContext(); }, { once: true });

    let lineIndex = 0;

    function typeLine() {
      if (lineIndex >= BOOT_LINES.length) {
        SFX.bootDone();
        setTimeout(function () {
          bootScreen.classList.add("done");
          app.classList.remove("hidden");
          setTimeout(function () { bootScreen.remove(); }, 800);
          initApp();
        }, 450);
        return;
      }
      const line = BOOT_LINES[lineIndex];
      bootLog.textContent += line + "\n";
      bootLog.parentElement.scrollTop = bootLog.parentElement.scrollHeight;
      lineIndex++;
      if (line !== "") SFX.tick();
      const delay = line === "" ? 90 : 35 + Math.random() * 55;
      setTimeout(typeLine, delay);
    }

    typeLine();
  }

  // --- Clock ---
  function startClock() {
    const clockEl = document.getElementById("clock");
    function update() {
      const now = new Date();
      const h = String(now.getHours()).padStart(2, "0");
      const m = String(now.getMinutes()).padStart(2, "0");
      const s = String(now.getSeconds()).padStart(2, "0");
      clockEl.textContent = h + ":" + m + ":" + s;
    }
    update();
    setInterval(update, 1000);
  }

  // --- ECG Health Monitor (driven by HP) ---
  var ecgCanvas = null, ecgCtx = null, ecgX = 0, ecgLastTime = 0;

  function ecgBeat(t) {
    if (t < 0.1) return 0;
    if (t < 0.18) { var p = (t - 0.1) / 0.08; return -Math.sin(p * Math.PI) * 0.15; }
    if (t < 0.25) return 0;
    if (t < 0.28) { var q = (t - 0.25) / 0.03; return q * 0.1; }
    if (t < 0.32) { var r = (t - 0.28) / 0.04; return 0.1 - r * 1.1; }
    if (t < 0.36) { var s = (t - 0.32) / 0.04; return -1.0 + s * 1.15; }
    if (t < 0.40) { var u = (t - 0.36) / 0.04; return 0.15 - u * 0.15; }
    if (t < 0.55) { var tw = (t - 0.40) / 0.15; return -Math.sin(tw * Math.PI) * 0.2; }
    return 0;
  }

  function hpState(hp, hpMax) {
    if (hp <= 0) return { color: "#ff3344", glow: "rgba(255, 51, 68, 0.5)", label: "FLATLINE", speed: 0 };
    var frac = hp / hpMax;
    if (frac > 0.66) return { color: "#00ff9d", glow: "rgba(0, 255, 157, 0.4)", label: "STABLE", speed: 1.0 };
    if (frac > 0.33) return { color: "#ffcc00", glow: "rgba(255, 204, 0, 0.4)", label: "CAUTION", speed: 1.4 };
    return { color: "#ff6b35", glow: "rgba(255, 107, 53, 0.4)", label: "CRITICAL", speed: 1.9 };
  }

  function initEcgMonitor() {
    ecgCanvas = document.getElementById("ecg-canvas");
    if (!ecgCanvas) return;
    ecgCtx = ecgCanvas.getContext("2d");
    ecgCanvas.width = 240;
    ecgCanvas.height = 100;
    ecgX = 0;
    ecgLastTime = performance.now();
    ecgCtx.fillStyle = "rgba(0, 0, 0, 1)";
    ecgCtx.fillRect(0, 0, ecgCanvas.width, ecgCanvas.height);
    requestAnimationFrame(drawEcg);
  }

  function drawEcg(now) {
    if (!ecgCtx) return;
    var w = ecgCanvas.width, h = ecgCanvas.height;
    var dt = (now - ecgLastTime) / 1000;
    ecgLastTime = now;

    var p = activePlayer();
    var state = hpState(p.hp, p.hpMax);
    var flat = state.speed === 0;

    var speed = (flat ? 1.0 : state.speed) * 120;
    var advance = speed * dt;
    var midY = h * 0.5, amp = h * 0.35, cycleLen = w * 0.8;

    var steps = Math.ceil(advance);
    for (var s = 0; s < steps; s++) {
      var clearX = (ecgX + 8) % w;
      ecgCtx.fillStyle = "rgba(0, 0, 0, 1)";
      ecgCtx.fillRect(clearX, 0, 3, h);

      var yOff = flat ? 0 : ecgBeat((ecgX % cycleLen) / cycleLen);
      var y = midY + yOff * amp;

      ecgCtx.fillStyle = state.color;
      ecgCtx.fillRect(ecgX % w, y, 2, 2);
      ecgCtx.shadowColor = state.glow;
      ecgCtx.shadowBlur = 6;
      ecgCtx.fillRect(ecgX % w, y, 2, 2);
      ecgCtx.shadowBlur = 0;

      ecgX = (ecgX + 1) % w;
    }
    requestAnimationFrame(drawEcg);
  }

  function updateMonitorLabel() {
    var p = activePlayer();
    var state = hpState(p.hp, p.hpMax);
    var label = document.getElementById("monitor-label");
    if (label) { label.textContent = state.label; label.style.color = state.color; }
    var monitor = document.getElementById("health-monitor");
    if (monitor) monitor.style.borderColor = state.color;
  }

  // --- Rendering ---
  function renderPips(containerId, current, max) {
    var el = document.getElementById(containerId);
    var html = "";
    for (var i = 0; i < max; i++) {
      html += '<div class="stat-pip' + (i < current ? " filled" : "") + '"></div>';
    }
    el.innerHTML = html;
  }

  function render() {
    var p = activePlayer();
    var n = STATE.active + 1;

    document.getElementById("duo-player-name").textContent = "PLAYER " + n;

    document.getElementById("stat-hp").textContent = p.hp;
    document.getElementById("stat-hp-max").textContent = p.hpMax;
    document.getElementById("stat-stress").textContent = p.stress;
    document.getElementById("stat-stress-max").textContent = p.stressMax;

    renderPips("pips-hp", p.hp, p.hpMax);
    renderPips("pips-stress", p.stress, p.stressMax);

    var hpEl = document.getElementById("block-hp");
    hpEl.classList.toggle("critical", p.hp <= Math.ceil(p.hpMax * 0.25) && p.hp > 0);
    hpEl.classList.toggle("flatline", p.hp <= 0);

    var stsEl = document.getElementById("block-stress");
    stsEl.classList.toggle("critical", p.stress >= p.stressMax);

    updateMonitorLabel();

    // Sync toggle highlight
    document.querySelectorAll(".nav-tab").forEach(function (tab) {
      tab.classList.toggle("active", Number(tab.dataset.player) === STATE.active);
    });
  }

  // --- Interactions ---
  function adjust(stat, dir) {
    var p = activePlayer();
    var max = stat === "hp" ? p.hpMax : p.stressMax;
    var next = Math.max(0, Math.min(max, p[stat] + dir));
    if (next === p[stat]) {
      SFX.empty();
      return;
    }
    p[stat] = next;
    if (dir < 0) SFX.select(); else SFX.use();
    if (navigator.vibrate) navigator.vibrate(12);
    render();
    save();
  }

  function switchPlayer(index) {
    if (index === STATE.active) return;
    STATE.active = index;
    SFX.tab();
    if (navigator.vibrate) navigator.vibrate(10);
    render();
    save();
  }

  function initSteppers() {
    document.querySelectorAll(".stepper-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        adjust(btn.dataset.stat, Number(btn.dataset.dir));
      });
    });
  }

  function initToggle() {
    document.querySelectorAll(".nav-tab").forEach(function (tab) {
      tab.addEventListener("click", function () {
        switchPlayer(Number(tab.dataset.player));
      });
    });
  }

  function initResetButton() {
    var btn = document.getElementById("reset-btn");
    var modal = document.getElementById("reset-modal");
    var cancelBtn = document.getElementById("reset-cancel");
    var confirmBtn = document.getElementById("reset-confirm");
    var backdrop = modal.querySelector(".reset-modal-backdrop");

    btn.addEventListener("click", function () { SFX.select(); modal.classList.remove("hidden"); });
    cancelBtn.addEventListener("click", function () { SFX.back(); modal.classList.add("hidden"); });
    backdrop.addEventListener("click", function () { SFX.back(); modal.classList.add("hidden"); });

    confirmBtn.addEventListener("click", function () {
      STATE.players = [makeDefault(), makeDefault()];
      SFX.bootDone();
      modal.classList.add("hidden");
      render();
      save();
    });
  }

  // --- Init ---
  function initApp() {
    load();
    startClock();
    initEcgMonitor();
    initToggle();
    initSteppers();
    initResetButton();
    render();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", runBootSequence);
  } else {
    runBootSequence();
  }
})();
