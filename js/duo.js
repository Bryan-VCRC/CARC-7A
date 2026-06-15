/* ============================================
   CARC-7A — Two Player (Co-op) Terminal
   Hotseat: editable names, HP + Stress, and a
   per-player inventory. Inventory mechanics
   (ammo fire/reload, consumable uses, item cards)
   are ported from the single-player terminal.
   ============================================ */

(function () {
  "use strict";

  // --- Vital defaults ---
  const VITALS = { hp: 6, hpMax: 6, stress: 0, stressMax: 6 };

  // --- Starting loadout (cloned per player) ---
  const STARTER_TEMPLATES = [
    {
      type: "weapon", name: "Revolver", icon: "icons/items/revolver.svg", quantity: 1,
      description: "Six rounds, no frills. Loud enough to hear through a bulkhead.",
      ammo: { current: 6, magCapacity: 6, spareMags: 2, magLabel: "Cylinder", spareLabel: "Speedloaders" },
      fireModes: ["semi"],
      stats: { "Damage": "1d10", "Range": "Medium", "Condition": "Worn" },
    },
    {
      type: "weapon", name: "Combat Knife", icon: "icons/items/knife.svg", quantity: 1,
      description: "Standard issue. Works on anything that gets too close.",
      stats: { "Damage": "1d10", "Range": "Adjacent", "Condition": "Sharp" },
    },
    {
      type: "tool", name: "Flashlight", icon: "icons/items/flashlight.svg", quantity: 1,
      description: "High-beam, long battery. The dark is everywhere out here.",
      consumable: { current: 12, max: 12, unit: "hours", perUse: 1, verb: "DRAIN", useLabel: "USE 1 HOUR", depletedMsg: "BATTERY DEAD" },
      stats: { "Beam": "High intensity", "Condition": "Functional" },
    },
    {
      type: "medical", name: "First Aid Kit", icon: "icons/items/firstaid.svg", quantity: 1,
      description: "Bandages, sealant foam, a basic stimshot. Buys time.",
      consumable: { current: 3, max: 3, unit: "uses", perUse: 1, verb: "APPLY", useLabel: "USE — HEAL 1d5", depletedMsg: "KIT EMPTY" },
      stats: { "Heals": "1d5 Health per use", "Contents": "Bandages, foam sealant, stimshot" },
    },
  ];

  const ICON_FOR_TYPE = {
    weapon: "icons/items/revolver.svg",
    tool: "icons/items/comms.svg",
    medical: "icons/items/firstaid.svg",
    armor: "icons/items/armor.svg",
    consumable: "icons/items/stim.svg",
    keyitem: "🔑",
    misc: "📦",
  };

  function clone(obj) { return JSON.parse(JSON.stringify(obj)); }

  function genId() {
    return "it-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  function starterKit() {
    return STARTER_TEMPLATES.map(function (t) {
      var item = clone(t);
      item.id = genId();
      return item;
    });
  }

  function makePlayer() {
    return { name: "", hp: VITALS.hp, hpMax: VITALS.hpMax, stress: VITALS.stress, stressMax: VITALS.stressMax, inventory: starterKit() };
  }

  // --- State ---
  const STATE = {
    active: 0,
    view: "vitals",
    players: [makePlayer(), makePlayer()],
  };

  function player() { return STATE.players[STATE.active]; }
  function inventory() { return player().inventory; }
  function displayName(idx) {
    var p = STATE.players[idx];
    var n = (p.name || "").trim();
    return n || ("PLAYER " + (idx + 1));
  }

  // --- Save / Load ---
  const SAVE_KEY = "carc7a_duo_save";

  function save() {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify({ version: 2, active: STATE.active, view: STATE.view, players: STATE.players }));
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
        if (typeof saved.name === "string") p.name = saved.name;
        ["hp", "hpMax", "stress", "stressMax"].forEach(function (k) {
          if (typeof saved[k] === "number") p[k] = saved[k];
        });
        if (Array.isArray(saved.inventory)) {
          p.inventory = saved.inventory.map(function (it) {
            if (!it.id) it.id = genId();
            return it;
          });
        }
      });
      if (data.active === 0 || data.active === 1) STATE.active = data.active;
      if (data.view === "vitals" || data.view === "gear") STATE.view = data.view;
    } catch (e) { /* ignore corrupt save */ }
  }

  // --- Helpers ---
  function renderIcon(icon, extraClass) {
    if (icon && icon.endsWith(".svg")) {
      const cls = extraClass ? ' class="' + extraClass + '"' : "";
      return '<img src="' + icon + '"' + cls + ' alt="" draggable="false">';
    }
    return icon || "";
  }

  function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text == null ? "" : text;
    return div.innerHTML;
  }

  // --- Boot Sequence ---
  const BOOT_LINES = [
    "MONARCH CORP. BIOS v4.2.1",
    "",
    "INITIALIZING CO-OP TERMINAL...",
    "  CREW SLOT 1 ............. LINKED",
    "  CREW SLOT 2 ............. LINKED",
    "  VITALS MONITOR .......... ONLINE",
    "  CARGO MANIFEST .......... LOADED",
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

    var p = player();
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
    var p = player();
    var state = hpState(p.hp, p.hpMax);
    var label = document.getElementById("monitor-label");
    if (label) { label.textContent = state.label; label.style.color = state.color; }
    var monitor = document.getElementById("health-monitor");
    if (monitor) monitor.style.borderColor = state.color;
  }

  // --- Vitals rendering ---
  function renderPips(containerId, current, max) {
    var el = document.getElementById(containerId);
    var html = "";
    for (var i = 0; i < max; i++) {
      html += '<div class="stat-pip' + (i < current ? " filled" : "") + '"></div>';
    }
    el.innerHTML = html;
  }

  function renderVitals() {
    var p = player();

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
  }

  function renderChrome() {
    // Player tab labels + active states
    document.getElementById("tab-name-0").textContent = displayName(0);
    document.getElementById("tab-name-1").textContent = displayName(1);
    document.querySelectorAll(".player-tabs .nav-tab").forEach(function (tab) {
      tab.classList.toggle("active", Number(tab.dataset.player) === STATE.active);
    });
    // View tab active states
    document.querySelectorAll(".sub-tabs .nav-tab").forEach(function (tab) {
      tab.classList.toggle("active", tab.dataset.view === STATE.view);
    });
    // Panels
    document.getElementById("panel-vitals").classList.toggle("active", STATE.view === "vitals");
    document.getElementById("panel-gear").classList.toggle("active", STATE.view === "gear");
    // Name input + gear owner
    document.getElementById("player-name-input").value = player().name || "";
    document.getElementById("gear-owner").textContent = displayName(STATE.active);
  }

  // --- Inventory: grid ---
  function renderInventory() {
    const grid = document.getElementById("inventory-grid");
    const items = inventory();

    if (items.length === 0) {
      grid.innerHTML =
        '<div class="empty-state" style="grid-column: 1/-1;">' +
        '<div class="empty-icon">📦</div>' +
        '<div class="empty-text">NO GEAR — TAP + ADD ITEM</div></div>';
      return;
    }

    grid.innerHTML = items.map(function (item) {
      return '' +
        '<div class="inv-card type-' + item.type + '" data-id="' + item.id + '">' +
        '<div class="inv-icon">' + renderIcon(item.icon) + '</div>' +
        '<div class="inv-name">' + escapeHtml(item.name) + '</div>' +
        (item.quantity > 1 ? '<div class="inv-qty">x' + item.quantity + '</div>' : '') +
        '</div>';
    }).join("");

    grid.querySelectorAll(".inv-card").forEach(function (card) {
      card.addEventListener("click", function () {
        SFX.select();
        const item = inventory().find(function (i) { return i.id === card.dataset.id; });
        if (item) showInventoryDetail(item);
      });
    });
  }

  function closeDetail() {
    document.getElementById("inventory-detail").classList.add("hidden");
    document.getElementById("inventory-grid").style.display = "";
    document.querySelector("#panel-gear .panel-header").style.display = "";
  }

  function showInventoryDetail(item) {
    const detail = document.getElementById("inventory-detail");
    const content = document.getElementById("inventory-detail-content");

    let statsHtml = "";
    if (item.stats && Object.keys(item.stats).length) {
      const rows = Object.entries(item.stats).map(function (kv) {
        return '<div class="stat-row"><span class="stat-label">' + escapeHtml(kv[0]) +
          '</span><span class="stat-value">' + escapeHtml(kv[1]) + '</span></div>';
      }).join("");
      statsHtml = '<div class="item-stats">' + rows + '</div>';
    }

    let ammoHtml = item.ammo ? buildAmmoPanel(item) : "";
    let consumableHtml = item.consumable ? buildConsumablePanel(item) : "";

    content.innerHTML = '' +
      '<div class="doc-header">' +
      '<div class="doc-title">' + renderIcon(item.icon, "detail-icon") + " " + escapeHtml(item.name) + '</div>' +
      '<div class="doc-meta"><span>TYPE: ' + item.type.toUpperCase() + '</span><span>QTY: ' + item.quantity + '</span></div>' +
      '</div>' +
      '<div class="doc-body">' + escapeHtml(item.description) + '</div>' +
      statsHtml + ammoHtml + consumableHtml +
      '<div class="discard-wrap"><button class="discard-btn" id="discard-item-btn">DISCARD ITEM</button></div>';

    if (item.ammo) wireAmmoActions(item, content);
    if (item.consumable) wireConsumableActions(item, content);

    var discardBtn = content.querySelector("#discard-item-btn");
    if (discardBtn) discardBtn.addEventListener("click", function () { discardItem(item); });

    document.getElementById("inventory-grid").style.display = "none";
    document.querySelector("#panel-gear .panel-header").style.display = "none";
    detail.classList.remove("hidden");
  }

  function discardItem(item) {
    const inv = inventory();
    const idx = inv.findIndex(function (i) { return i.id === item.id; });
    if (idx >= 0) inv.splice(idx, 1);
    SFX.back();
    if (navigator.vibrate) navigator.vibrate([15, 40, 15]);
    save();
    closeDetail();
    renderInventory();
  }

  // --- Inventory: weapons / ammo ---
  function buildAmmoPanel(item) {
    const a = item.ammo;
    const totalRemaining = a.current + a.spareMags * a.magCapacity;
    const emptyClass = a.current === 0 ? " ammo-empty" : "";
    const lowClass = a.current > 0 && a.current <= Math.ceil(a.magCapacity * 0.25) ? " ammo-low" : "";

    let fireButtons = "";
    if (item.fireModes && item.fireModes.includes("semi")) {
      fireButtons += '<button class="weapon-action-btn fire-semi-btn" data-action="semi">FIRE — SEMI</button>';
    }
    if (item.fireModes && item.fireModes.includes("burst")) {
      fireButtons += '<button class="weapon-action-btn fire-burst-btn" data-action="burst">FIRE — BURST (×3)</button>';
    }

    const reloadDisabled = a.spareMags <= 0 || a.current === a.magCapacity ? " disabled" : "";

    return '' +
      '<div class="ammo-panel">' +
      '<div class="ammo-header">AMMUNITION</div>' +
      '<div class="ammo-display"><div class="ammo-current' + emptyClass + lowClass + '">' +
      '<span class="ammo-count" id="ammo-count">' + a.current + '</span>' +
      '<span class="ammo-sep">/</span><span class="ammo-cap">' + a.magCapacity + '</span></div>' +
      '<div class="ammo-label">' + a.magLabel + '</div></div>' +
      '<div class="ammo-reserve"><span class="ammo-reserve-label">SPARE ' + a.spareLabel.toUpperCase() +
      '</span><span class="ammo-reserve-value" id="ammo-spare">' + a.spareMags + '</span></div>' +
      '<div class="ammo-reserve"><span class="ammo-reserve-label">TOTAL REMAINING</span>' +
      '<span class="ammo-reserve-value" id="ammo-total">' + totalRemaining + '</span></div>' +
      '<div class="weapon-actions">' + fireButtons +
      '<button class="weapon-action-btn reload-btn" data-action="reload"' + reloadDisabled + '>RELOAD ' + a.magLabel.toUpperCase() + '</button>' +
      '<button class="weapon-action-btn found-btn" data-action="found-mag">+ FOUND ' + a.spareLabel.toUpperCase().slice(0, -1) + '</button>' +
      '</div><div class="ammo-log" id="ammo-log"></div></div>';
  }

  function wireAmmoActions(item, container) {
    container.querySelectorAll(".weapon-action-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        const action = btn.dataset.action;
        if (action === "semi") fireWeapon(item, 1);
        else if (action === "burst") fireWeapon(item, 3);
        else if (action === "reload") reloadWeapon(item);
        else if (action === "found-mag") foundMag(item);
      });
    });
  }

  function fireWeapon(item, rounds) {
    const a = item.ammo;
    if (a.current <= 0) {
      SFX.empty();
      logAmmoEvent("EMPTY — NO ROUND IN CHAMBER");
      flashAmmoCount();
      return;
    }
    const spent = Math.min(rounds, a.current);
    a.current -= spent;
    if (spent === 1) { SFX.gunshot(); logAmmoEvent("FIRED 1 ROUND — " + a.current + " remaining"); }
    else { SFX.burst(spent); logAmmoEvent("BURST FIRE — " + spent + " ROUNDS SPENT — " + a.current + " remaining"); }
    updateAmmoDisplay(item);
    save();
    const vibePattern = Array.from({ length: spent }, function (_, i) { return i === 0 ? 30 : [40, 30]; }).flat();
    if (navigator.vibrate) navigator.vibrate(vibePattern);
  }

  function reloadWeapon(item) {
    const a = item.ammo;
    if (a.spareMags <= 0) { SFX.empty(); logAmmoEvent("NO SPARE " + a.spareLabel.toUpperCase()); return; }
    if (a.current === a.magCapacity) { logAmmoEvent(a.magLabel.toUpperCase() + " ALREADY FULL"); return; }
    SFX.reload();
    const oldRounds = a.current;
    a.spareMags--;
    a.current = a.magCapacity;
    if (oldRounds > 0) logAmmoEvent("SWAPPED " + a.magLabel.toUpperCase() + " — " + oldRounds + " ROUNDS DISCARDED");
    else logAmmoEvent(a.magLabel.toUpperCase() + " LOADED — " + a.magCapacity + " ROUNDS");
    updateAmmoDisplay(item);
    save();
    if (navigator.vibrate) navigator.vibrate([20, 80, 40]);
  }

  function foundMag(item) {
    item.ammo.spareMags++;
    SFX.use();
    save();
    showInventoryDetail(item);
    if (navigator.vibrate) navigator.vibrate([15, 50, 15]);
  }

  function updateAmmoDisplay(item) {
    const a = item.ammo;
    const totalRemaining = a.current + a.spareMags * a.magCapacity;
    const countEl = document.getElementById("ammo-count");
    const spareEl = document.getElementById("ammo-spare");
    const totalEl = document.getElementById("ammo-total");
    if (countEl) countEl.textContent = a.current;
    if (spareEl) spareEl.textContent = a.spareMags;
    if (totalEl) totalEl.textContent = totalRemaining;
    const display = countEl ? countEl.closest(".ammo-current") : null;
    if (display) {
      display.classList.toggle("ammo-empty", a.current === 0);
      display.classList.toggle("ammo-low", a.current > 0 && a.current <= Math.ceil(a.magCapacity * 0.25));
    }
    const reloadBtn = document.querySelector(".reload-btn");
    if (reloadBtn) reloadBtn.disabled = a.spareMags <= 0 || a.current === a.magCapacity;
    document.querySelectorAll(".fire-semi-btn, .fire-burst-btn").forEach(function (btn) {
      btn.classList.toggle("action-dry", a.current <= 0);
    });
  }

  function logAmmoEvent(msg) { logToEl("ammo-log", msg); }
  function logConsumableEvent(msg) { logToEl("consumable-log", msg); }

  function logToEl(id, msg) {
    const log = document.getElementById(id);
    if (!log) return;
    const line = document.createElement("div");
    line.className = "ammo-log-line";
    line.textContent = "> " + msg;
    log.appendChild(line);
    log.scrollTop = log.scrollHeight;
    while (log.children.length > 6) log.removeChild(log.firstChild);
  }

  function flashAmmoCount() {
    const el = document.getElementById("ammo-count");
    if (!el) return;
    el.classList.add("flash-warn");
    setTimeout(function () { el.classList.remove("flash-warn"); }, 400);
  }

  // --- Inventory: consumables ---
  function buildConsumablePanel(item) {
    const c = item.consumable;
    const emptyClass = c.current === 0 ? " ammo-empty" : "";
    const lowClass = c.current > 0 && c.current <= Math.ceil(c.max * 0.25) ? " ammo-low" : "";
    const disabled = c.current <= 0 ? " disabled" : "";

    let pipsHtml = "";
    for (let i = 0; i < c.max; i++) pipsHtml += '<div class="consumable-pip' + (i < c.current ? " filled" : "") + '"></div>';

    return '' +
      '<div class="ammo-panel">' +
      '<div class="ammo-header">' + c.verb + ' STATUS</div>' +
      '<div class="ammo-display"><div class="ammo-current' + emptyClass + lowClass + '">' +
      '<span class="ammo-count" id="consumable-count">' + c.current + '</span>' +
      '<span class="ammo-sep">/</span><span class="ammo-cap">' + c.max + '</span></div>' +
      '<div class="ammo-label">' + c.unit.toUpperCase() + '</div></div>' +
      '<div class="consumable-pips" id="consumable-pips">' + pipsHtml + '</div>' +
      '<div class="weapon-actions">' +
      '<button class="weapon-action-btn use-btn" data-action="use"' + disabled + '>' + c.useLabel + '</button>' +
      '<button class="weapon-action-btn found-btn" data-action="found-supply">+ FOUND ' + c.unit.toUpperCase() + '</button>' +
      '</div><div class="ammo-log" id="consumable-log"></div></div>';
  }

  function wireConsumableActions(item, container) {
    container.querySelectorAll("[data-action]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        if (btn.dataset.action === "use") useConsumable(item);
        else if (btn.dataset.action === "found-supply") foundSupply(item);
      });
    });
  }

  function useConsumable(item) {
    const c = item.consumable;
    if (c.current <= 0) {
      SFX.empty();
      logConsumableEvent(c.depletedMsg);
      const el = document.getElementById("consumable-count");
      if (el) { el.classList.add("flash-warn"); setTimeout(function () { el.classList.remove("flash-warn"); }, 400); }
      return;
    }
    c.current -= c.perUse;
    SFX.use();
    logConsumableEvent(c.verb + " — " + c.current + " " + c.unit + " remaining");
    updateConsumableDisplay(item);
    save();
    if (navigator.vibrate) navigator.vibrate([15, 50, 15]);
  }

  function foundSupply(item) {
    const c = item.consumable;
    c.current += 1;
    c.max += 1;
    SFX.use();
    logConsumableEvent("ACQUIRED " + c.unit.toUpperCase() + " (+1) — " + c.current + " total");
    showInventoryDetail(item);
    save();
    if (navigator.vibrate) navigator.vibrate([15, 50, 15]);
  }

  function updateConsumableDisplay(item) {
    const c = item.consumable;
    const countEl = document.getElementById("consumable-count");
    if (countEl) countEl.textContent = c.current;
    const display = countEl ? countEl.closest(".ammo-current") : null;
    if (display) {
      display.classList.toggle("ammo-empty", c.current === 0);
      display.classList.toggle("ammo-low", c.current > 0 && c.current <= Math.ceil(c.max * 0.25));
    }
    document.querySelectorAll("#consumable-pips .consumable-pip").forEach(function (pip, i) {
      pip.classList.toggle("filled", i < c.current);
    });
    const useBtn = document.querySelector(".use-btn");
    if (useBtn) { useBtn.disabled = c.current <= 0; useBtn.classList.toggle("action-dry", c.current <= 0); }
  }

  // --- Add item modal ---
  function initAddItem() {
    const modal = document.getElementById("item-modal");
    const backdrop = modal.querySelector(".form-modal-backdrop");
    const tracker = document.getElementById("f-tracker");
    const ammoFields = document.getElementById("f-ammo-fields");
    const usesFields = document.getElementById("f-uses-fields");

    function syncTracker() {
      ammoFields.classList.toggle("hidden", tracker.value !== "ammo");
      usesFields.classList.toggle("hidden", tracker.value !== "uses");
    }

    function openModal() {
      document.getElementById("f-name").value = "";
      document.getElementById("f-type").value = "misc";
      document.getElementById("f-qty").value = "1";
      document.getElementById("f-desc").value = "";
      tracker.value = "none";
      syncTracker();
      SFX.select();
      modal.classList.remove("hidden");
      setTimeout(function () { document.getElementById("f-name").focus(); }, 50);
    }

    function closeModal() { modal.classList.add("hidden"); }

    function addItem() {
      const type = document.getElementById("f-type").value;
      const name = (document.getElementById("f-name").value || "").trim() || "Unknown Item";
      const qty = Math.max(1, parseInt(document.getElementById("f-qty").value, 10) || 1);
      const desc = (document.getElementById("f-desc").value || "").trim() || "No description.";

      const item = {
        id: genId(), type: type, name: name, icon: ICON_FOR_TYPE[type] || "📦",
        quantity: qty, description: desc, stats: {},
      };

      if (tracker.value === "ammo") {
        const cap = Math.max(1, parseInt(document.getElementById("f-cap").value, 10) || 1);
        const spare = Math.max(0, parseInt(document.getElementById("f-spare").value, 10) || 0);
        item.ammo = { current: cap, magCapacity: cap, spareMags: spare, magLabel: "Magazine", spareLabel: "Magazines" };
        item.fireModes = ["semi"];
      } else if (tracker.value === "uses") {
        const m = Math.max(1, parseInt(document.getElementById("f-uses").value, 10) || 1);
        item.consumable = { current: m, max: m, unit: "uses", perUse: 1, verb: "USE", useLabel: "USE", depletedMsg: "DEPLETED" };
      }

      inventory().push(item);
      SFX.use();
      if (navigator.vibrate) navigator.vibrate([15, 40, 15]);
      save();
      closeModal();
      closeDetail();
      renderInventory();
    }

    document.getElementById("add-item-btn").addEventListener("click", openModal);
    document.getElementById("item-cancel").addEventListener("click", function () { SFX.back(); closeModal(); });
    backdrop.addEventListener("click", function () { SFX.back(); closeModal(); });
    document.getElementById("item-add").addEventListener("click", addItem);
    tracker.addEventListener("change", syncTracker);
  }

  // --- Interactions ---
  function adjust(stat, dir) {
    var p = player();
    var max = stat === "hp" ? p.hpMax : p.stressMax;
    var next = Math.max(0, Math.min(max, p[stat] + dir));
    if (next === p[stat]) { SFX.empty(); return; }
    p[stat] = next;
    if (dir < 0) SFX.select(); else SFX.use();
    if (navigator.vibrate) navigator.vibrate(12);
    renderVitals();
    save();
  }

  function switchPlayer(index) {
    if (index === STATE.active) return;
    STATE.active = index;
    SFX.tab();
    if (navigator.vibrate) navigator.vibrate(10);
    closeDetail();
    renderChrome();
    renderVitals();
    renderInventory();
    save();
  }

  function switchView(view) {
    if (view === STATE.view) return;
    STATE.view = view;
    SFX.tab();
    if (navigator.vibrate) navigator.vibrate(10);
    renderChrome();
    if (view === "gear") { closeDetail(); renderInventory(); }
    save();
  }

  function initToggles() {
    document.querySelectorAll(".player-tabs .nav-tab").forEach(function (tab) {
      tab.addEventListener("click", function () { switchPlayer(Number(tab.dataset.player)); });
    });
    document.querySelectorAll(".sub-tabs .nav-tab").forEach(function (tab) {
      tab.addEventListener("click", function () { switchView(tab.dataset.view); });
    });
  }

  function initNameInput() {
    const input = document.getElementById("player-name-input");
    input.addEventListener("input", function () {
      player().name = input.value;
      document.getElementById("tab-name-" + STATE.active).textContent = displayName(STATE.active);
      document.getElementById("gear-owner").textContent = displayName(STATE.active);
      save();
    });
  }

  function initResetButton() {
    var modal = document.getElementById("reset-modal");
    var backdrop = modal.querySelector(".reset-modal-backdrop");
    document.getElementById("reset-btn").addEventListener("click", function () { SFX.select(); modal.classList.remove("hidden"); });
    document.getElementById("reset-cancel").addEventListener("click", function () { SFX.back(); modal.classList.add("hidden"); });
    backdrop.addEventListener("click", function () { SFX.back(); modal.classList.add("hidden"); });
    document.getElementById("reset-confirm").addEventListener("click", function () {
      STATE.players = [makePlayer(), makePlayer()];
      STATE.active = 0;
      STATE.view = "vitals";
      SFX.bootDone();
      modal.classList.add("hidden");
      closeDetail();
      renderChrome();
      renderVitals();
      renderInventory();
      save();
    });
  }

  // --- Init ---
  function initApp() {
    load();
    startClock();
    initEcgMonitor();
    initToggles();
    initNameInput();
    initAddItem();
    initResetButton();
    document.getElementById("gear-back").addEventListener("click", function () { SFX.back(); closeDetail(); });
    renderChrome();
    renderVitals();
    renderInventory();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", runBootSequence);
  } else {
    runBootSequence();
  }
})();
