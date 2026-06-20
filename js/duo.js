/* ============================================
   CARC-7A — Two Player (Co-op) Terminal
   Split-screen: both crew shown side by side. HP + Stress are
   GM-driven (read-only here, updated over the sync layer). Each
   player keeps a per-player inventory with the solo item engine
   (ammo fire/reload, consumable uses). Items are added by the GM.
   ============================================ */

(function () {
  "use strict";

  // --- Vital defaults ---
  const VITALS = { hp: 6, hpMax: 6, stress: 0, stressMax: 6 };


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

  // Mothership-style stats (2d10+30) and saves (2d10+20), entered from
  // physical rolls during setup.
  const STAT_KEYS = [["strength", "Strength"], ["speed", "Speed"], ["intellect", "Intellect"], ["combat", "Combat"]];
  const SAVE_KEYS = [["sanity", "Sanity"], ["fear", "Fear"], ["body", "Body"]];

  function makePlayer() {
    var loadout = { weapon: "revolver", armor: "light" };
    return {
      name: "", portrait: null, loadout: loadout,
      stats: { strength: null, speed: null, intellect: null, combat: null },
      saves: { sanity: null, fear: null, body: null },
      hp: VITALS.hp, hpMax: VITALS.hpMax, stress: VITALS.stress, stressMax: VITALS.stressMax,
      inventory: window.buildLoadout(loadout),
    };
  }

  // Portrait list (URLs), loaded from the server's /api/portraits endpoint.
  var PORTRAITS = [];

  // --- Active story pack ---
  // Which story pack is active. Chosen via ?story=<id>; falls back to t4-84.
  var REQUESTED_STORY = (function () {
    try { return new URLSearchParams(window.location.search).get("story"); }
    catch (e) { return null; }
  })();
  var STORY_ID = (window.STORIES && REQUESTED_STORY && window.STORIES[REQUESTED_STORY]) ? REQUESTED_STORY : "t4-84";
  function activeStory() {
    return (window.STORIES && (window.STORIES[STORY_ID] || window.STORIES["t4-84"])) || {};
  }
  // Resolve a pack's bare image filename to its on-disk path.
  function storyImg(name) {
    return name ? ("data/stories/" + STORY_ID + "/" + name) : "";
  }

  // --- State ---
  const STATE = {
    storyId: STORY_ID,
    view: ["vitals", "vitals"], // per-player sub-view
    openItem: [null, null],     // id of the item whose detail is open, per column
    notes: [],                  // field notes recovered (revealed by the GM)
    allHereDone: false,         // the "WE ARE ALL HERE" set-piece has played once
    started: false,             // crew setup completed -> skip the intro on reload
    players: [makePlayer(), makePlayer()],
  };

  function displayName(idx) {
    var p = STATE.players[idx];
    var n = (p.name || "").trim();
    return n || ("PLAYER " + (idx + 1));
  }

  // --- Save / Load ---
  const SAVE_KEY = "carc7a_duo_save";

  function save() {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify({ version: 4, view: STATE.view, notes: STATE.notes, allHereDone: STATE.allHereDone, started: STATE.started, players: STATE.players }));
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
        if (typeof saved.portrait === "string") p.portrait = saved.portrait;
        if (saved.loadout && typeof saved.loadout === "object") p.loadout = saved.loadout;
        if (saved.stats) STAT_KEYS.forEach(function (s) { if (typeof saved.stats[s[0]] === "number") p.stats[s[0]] = saved.stats[s[0]]; });
        if (saved.saves) SAVE_KEYS.forEach(function (s) { if (typeof saved.saves[s[0]] === "number") p.saves[s[0]] = saved.saves[s[0]]; });
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
      if (Array.isArray(data.notes)) STATE.notes = data.notes;
      if (typeof data.allHereDone === "boolean") STATE.allHereDone = data.allHereDone;
      // Only trust "started" (skip-intro) from the current save format, so
      // pre-equipment saves re-run setup and rebuild a clean loadout.
      if (typeof data.started === "boolean" && data.version === 4) STATE.started = data.started;
      // Per-player view (older saves stored a single string)
      if (Array.isArray(data.view)) {
        data.view.slice(0, 2).forEach(function (v, i) {
          if (v === "vitals" || v === "gear") STATE.view[i] = v;
        });
      }
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

  function itemPic(item) {
    return (item && item.photo) ? item.photo : null;
  }

  // Map loadout slot+val to catalog keys for setup choice previews.
  var CHOICE_CATALOG_KEY = {
    weapon: { chainsword: "chainsword", revolver: "revolver" },
    armor: { light: "light_armor", leather: "leather_jacket" },
  };

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
    "  WARDEN UPLINK ........... STANDBY",
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
          setTimeout(function () { bootScreen.remove(); }, 800);
          initApp();    // builds the game (kept hidden)
          // Returning to a set-up crew skips straight in; a fresh start gets the intro.
          if (STATE.started) beginGame();
          else startIntro();
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

  // --- Column markup (generated per player) ---
  function statBlock(stat, idx) {
    var label = stat === "hp" ? "HP" : "STRESS";
    return '' +
      '<div class="duo-stat stat-' + stat + '" id="block-' + stat + '-' + idx + '">' +
      '<div class="duo-stat-header">' +
      '<span class="stat-name">' + label + '</span>' +
      '<span class="stat-numbers"><span id="stat-' + stat + '-' + idx + '">0</span>' +
      '<span class="stat-sep">/</span><span id="stat-' + stat + '-max-' + idx + '">0</span></span>' +
      '</div>' +
      '<div class="stat-pips" id="pips-' + stat + '-' + idx + '"></div>' +
      '</div>';
  }

  function profileCell(idx, key, label) {
    return '<div class="ps-row"><span class="ps-key">' + label + '</span>' +
      '<span class="ps-val" id="prof-' + key + '-' + idx + '">&mdash;</span></div>';
  }

  function profileBlock(idx) {
    var stats = STAT_KEYS.map(function (s) { return profileCell(idx, s[0], s[1]); }).join("");
    var saves = SAVE_KEYS.map(function (s) { return profileCell(idx, s[0], s[1]); }).join("");
    return '' +
      '<div class="profile-stats">' +
      '<div class="ps-group"><div class="ps-title">STATS</div><div class="ps-grid ps-stats">' + stats + '</div></div>' +
      '<div class="ps-group"><div class="ps-title">SAVES</div><div class="ps-grid ps-saves">' + saves + '</div></div>' +
      '</div>';
  }

  function renderProfile(idx) {
    var p = STATE.players[idx];
    STAT_KEYS.forEach(function (s) {
      var el = document.getElementById("prof-" + s[0] + "-" + idx);
      if (el) el.textContent = (p.stats && p.stats[s[0]] != null) ? p.stats[s[0]] : "—";
    });
    SAVE_KEYS.forEach(function (s) {
      var el = document.getElementById("prof-" + s[0] + "-" + idx);
      if (el) el.textContent = (p.saves && p.saves[s[0]] != null) ? p.saves[s[0]] : "—";
    });
  }

  function columnHTML(idx) {
    return '' +
      '<section class="player-col" data-player="' + idx + '">' +
      '<div class="col-head">' +
      '<div class="col-identity">' +
      '<button class="col-portrait" id="col-portrait-' + idx + '" aria-label="Choose portrait">' +
      '<img class="portrait-img" id="portrait-img-' + idx + '" alt="" draggable="false" hidden>' +
      '<span class="portrait-ph" id="portrait-ph-' + idx + '">TAP<br>TO SET</span>' +
      '</button>' +
      '<button class="duo-name-btn" id="name-btn-' + idx + '">PLAYER ' + (idx + 1) + '</button>' +
      '</div>' +
      '<div class="health-monitor" id="health-monitor-' + idx + '">' +
      '<canvas id="ecg-canvas-' + idx + '" width="120" height="50"></canvas>' +
      '<div class="monitor-label" id="monitor-label-' + idx + '">STABLE</div>' +
      '</div>' +
      '</div>' +
      '<nav class="nav-tabs sub-tabs col-tabs">' +
      '<button class="nav-tab active" data-view="vitals" data-player="' + idx + '"><span>VITALS</span></button>' +
      '<button class="nav-tab" data-view="gear" data-player="' + idx + '"><span>GEAR</span></button>' +
      '</nav>' +
      '<div class="col-body">' +
      '<section class="panel col-vitals active" id="panel-vitals-' + idx + '">' +
      statBlock("hp", idx) + statBlock("stress", idx) + profileBlock(idx) +
      '</section>' +
      '<section class="panel col-gear" id="panel-gear-' + idx + '">' +
      '<div class="col-gear-head"><span class="gear-title"><span class="flicker">&#9646;</span> GEAR</span></div>' +
      '<div class="inventory-grid" id="inventory-grid-' + idx + '"></div>' +
      '<div class="detail-view hidden" id="inventory-detail-' + idx + '">' +
      '<button class="back-btn" data-back="' + idx + '">&#9664; BACK TO GEAR</button>' +
      '<div class="detail-content" id="inventory-detail-content-' + idx + '"></div>' +
      '</div>' +
      '</section>' +
      '</div>' +
      '<div class="col-downed hidden" id="col-downed-' + idx + '">' +
      '<div class="downed-text">CREW MEMBER</div>' +
      '<div class="downed-big">PASSED OUT</div>' +
      '<div class="downed-sub">AWAITING REVIVE</div>' +
      '</div>' +
      '</section>';
  }

  function buildColumns() {
    document.getElementById("duo-split").innerHTML = columnHTML(0) + columnHTML(1);
  }

  // --- ECG Health Monitor (one per player, driven by HP) ---
  var monitors = [];

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
    if (hp <= 0) return { color: "#ff3344", glow: "rgba(255, 51, 68, 0.5)", label: "PASSED OUT", speed: 0 };
    var frac = hp / hpMax;
    if (frac > 0.66) return { color: "#00ff9d", glow: "rgba(0, 255, 157, 0.4)", label: "STABLE", speed: 1.0 };
    if (frac > 0.33) return { color: "#ffcc00", glow: "rgba(255, 204, 0, 0.4)", label: "CAUTION", speed: 1.4 };
    return { color: "#ff6b35", glow: "rgba(255, 107, 53, 0.4)", label: "CRITICAL", speed: 1.9 };
  }

  var ECG_CYCLE = 175; // logical px per heartbeat (fixed, so width doesn't change rate)

  function sizeEcgCanvas(m) {
    var dpr = window.devicePixelRatio || 1;
    var w = m.canvas.clientWidth || 240;
    var h = m.canvas.clientHeight || 90;
    m.canvas.width = Math.round(w * dpr);
    m.canvas.height = Math.round(h * dpr);
    m.ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // draw in CSS pixels → crisp
    m.w = w; m.h = h; m.x = 0; m.prevY = null;
    m.ctx.fillStyle = "#000";
    m.ctx.fillRect(0, 0, w, h);
  }

  function initEcgMonitors() {
    monitors = [0, 1].map(function (idx) {
      var canvas = document.getElementById("ecg-canvas-" + idx);
      if (!canvas) return null;
      var m = { canvas: canvas, ctx: canvas.getContext("2d"), x: 0, prevY: null, last: performance.now() };
      sizeEcgCanvas(m);
      return m;
    });
    window.addEventListener("resize", function () { monitors.forEach(function (m) { if (m) sizeEcgCanvas(m); }); });
    requestAnimationFrame(drawEcg);
  }

  // Heartbeats per second: calm + healthy is slow/smooth; low HP OR high
  // stress speeds it up.
  function ecgBps(p) {
    if (p.hp <= 0) return 0; // flatline
    var hpFrac = p.hpMax ? p.hp / p.hpMax : 1;
    var stressFrac = p.stressMax ? p.stress / p.stressMax : 0;
    var danger = Math.max(1 - hpFrac, stressFrac); // 0 calm .. 1 critical
    return 0.75 + danger * 1.75; // ~45 bpm calm .. ~150 bpm frantic
  }

  function drawEcg(now) {
    monitors.forEach(function (m, idx) {
      if (!m || !m.w) return;
      var ctx = m.ctx, w = m.w, h = m.h;
      var dt = (now - m.last) / 1000;
      m.last = now;
      if (dt > 0.1) dt = 0.1; // clamp jumps (e.g. returning to a backgrounded tab)

      var p = STATE.players[idx];
      var state = hpState(p.hp, p.hpMax);
      var flat = p.hp <= 0;
      var bps = ecgBps(p);
      var pxPerSec = flat ? 55 : bps * ECG_CYCLE;

      var midY = h * 0.5, amp = h * 0.4;
      var steps = Math.max(1, Math.round(pxPerSec * dt));

      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      for (var s = 0; s < steps; s++) {
        var prevPx = m.x % w;
        var prevY = m.prevY;
        m.x += 1;
        var px = m.x % w;

        var y = midY + (flat ? 0 : ecgBeat((m.x % ECG_CYCLE) / ECG_CYCLE)) * amp;

        // erase a small leading gap so the sweep head reads clearly
        ctx.fillStyle = "#000";
        ctx.fillRect(px, 0, 6, h);

        if (prevY != null && px > prevPx) { // don't connect across the wrap seam
          ctx.strokeStyle = state.color;
          ctx.shadowColor = state.glow;
          ctx.shadowBlur = 6;
          ctx.beginPath();
          ctx.moveTo(prevPx, prevY);
          ctx.lineTo(px, y);
          ctx.stroke();
          ctx.shadowBlur = 0;
        }
        m.prevY = y;
      }
    });
    requestAnimationFrame(drawEcg);
  }

  function updateMonitorLabel(idx) {
    var p = STATE.players[idx];
    var state = hpState(p.hp, p.hpMax);
    var label = document.getElementById("monitor-label-" + idx);
    if (label) { label.textContent = state.label; label.style.color = state.color; }
    var monitor = document.getElementById("health-monitor-" + idx);
    if (monitor) monitor.style.borderColor = state.color;
  }

  // --- Vitals rendering ---
  function renderPips(containerId, current, max) {
    var el = document.getElementById(containerId);
    if (!el) return;
    var html = "";
    for (var i = 0; i < max; i++) {
      html += '<div class="stat-pip' + (i < current ? " filled" : "") + '"></div>';
    }
    el.innerHTML = html;
  }

  function renderVitals(idx) {
    var p = STATE.players[idx];

    document.getElementById("stat-hp-" + idx).textContent = p.hp;
    document.getElementById("stat-hp-max-" + idx).textContent = p.hpMax;
    document.getElementById("stat-stress-" + idx).textContent = p.stress;
    document.getElementById("stat-stress-max-" + idx).textContent = p.stressMax;

    renderPips("pips-hp-" + idx, p.hp, p.hpMax);
    renderPips("pips-stress-" + idx, p.stress, p.stressMax);

    var hpEl = document.getElementById("block-hp-" + idx);
    hpEl.classList.toggle("critical", p.hp <= Math.ceil(p.hpMax * 0.25) && p.hp > 0);
    hpEl.classList.toggle("flatline", p.hp <= 0);

    var stsEl = document.getElementById("block-stress-" + idx);
    stsEl.classList.toggle("critical", p.stress >= p.stressMax);

    var downed = document.getElementById("col-downed-" + idx);
    if (downed) downed.classList.toggle("hidden", p.hp > 0);

    updateMonitorLabel(idx);
    renderProfile(idx);
    updateHeartbeat();
  }

  // Quiet heartbeat loop while any crew member is hanging on at 1 HP.
  function updateHeartbeat() {
    var critical = STATE.players.some(function (p) { return p.hp === 1; });
    if (SFX.heartbeat) SFX.heartbeat(critical);
  }

  function renderColumnChrome(idx) {
    // Sub-view tab active states
    var col = document.querySelector('.player-col[data-player="' + idx + '"]');
    if (!col) return;
    col.querySelectorAll(".col-tabs .nav-tab").forEach(function (tab) {
      tab.classList.toggle("active", tab.dataset.view === STATE.view[idx]);
    });
    document.getElementById("panel-vitals-" + idx).classList.toggle("active", STATE.view[idx] === "vitals");
    document.getElementById("panel-gear-" + idx).classList.toggle("active", STATE.view[idx] === "gear");
    renderIdentity(idx);
  }

  function renderIdentity(idx) {
    var p = STATE.players[idx];
    var nameBtn = document.getElementById("name-btn-" + idx);
    if (nameBtn) nameBtn.textContent = displayName(idx);
    var img = document.getElementById("portrait-img-" + idx);
    var ph = document.getElementById("portrait-ph-" + idx);
    if (img && ph) {
      if (p.portrait) { img.src = p.portrait; img.hidden = false; ph.hidden = true; }
      else { img.hidden = true; img.removeAttribute("src"); ph.hidden = false; }
    }
    // Mirror onto the intro setup card, if present.
    var sName = document.getElementById("setup-name-" + idx);
    if (sName) sName.textContent = displayName(idx);
    var sImg = document.getElementById("setup-img-" + idx);
    var sPh = document.getElementById("setup-ph-" + idx);
    if (sImg && sPh) {
      if (p.portrait) { sImg.src = p.portrait; sImg.hidden = false; sPh.hidden = true; }
      else { sImg.hidden = true; sImg.removeAttribute("src"); sPh.hidden = false; }
    }
  }

  // --- Inventory: grid (scoped to a player's column) ---
  function detailEl(idx) { return document.getElementById("inventory-detail-" + idx); }
  function gridEl(idx) { return document.getElementById("inventory-grid-" + idx); }

  function renderInventory(idx) {
    const grid = gridEl(idx);
    const items = STATE.players[idx].inventory;

    if (items.length === 0) {
      grid.innerHTML =
        '<div class="empty-state" style="grid-column: 1/-1;">' +
        '<div class="empty-icon">📦</div>' +
        '<div class="empty-text">NO GEAR ASSIGNED</div></div>';
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
        const item = STATE.players[idx].inventory.find(function (i) { return i.id === card.dataset.id; });
        if (item) showInventoryDetail(idx, item);
      });
    });
  }

  function closeDetail(idx) {
    STATE.openItem[idx] = null;
    detailEl(idx).classList.add("hidden");
    gridEl(idx).style.display = "";
    var head = document.querySelector("#panel-gear-" + idx + " .col-gear-head");
    if (head) head.style.display = "";
  }

  function showInventoryDetail(idx, item) {
    STATE.openItem[idx] = item.id;
    const detail = detailEl(idx);
    const content = document.getElementById("inventory-detail-content-" + idx);

    let statsHtml = "";
    if (item.stats && Object.keys(item.stats).length) {
      const rows = Object.entries(item.stats).map(function (kv) {
        return '<div class="stat-row"><span class="stat-label">' + escapeHtml(kv[0]) +
          '</span><span class="stat-value">' + escapeHtml(kv[1]) + '</span></div>';
      }).join("");
      statsHtml = '<div class="item-stats">' + rows + '</div>';
    }

    let ammoHtml = item.ammo ? buildAmmoPanel(item) : "";
    let consumableHtml = item.consumable ? buildConsumablePanel(item, idx) : "";
    var pic = itemPic(item);
    var picHtml = pic ? '<img class="item-pic" src="' + pic + '" alt="" draggable="false">' : "";

    // Simple one-shot sound action (e.g. chainsword) — no ammo/uses tracking.
    var soundHtml = (item.sfx && !item.ammo && !item.consumable)
      ? '<div class="weapon-actions"><button class="weapon-action-btn sfx-btn">' + escapeHtml(item.sfxLabel || "USE") + '</button></div>'
      : "";

    content.innerHTML = '' +
      picHtml +
      '<div class="doc-header">' +
      '<div class="doc-title">' + renderIcon(item.icon, "detail-icon") + " " + escapeHtml(item.name) + '</div>' +
      '<div class="doc-meta"><span>TYPE: ' + item.type.toUpperCase() + '</span><span>QTY: ' + item.quantity + '</span></div>' +
      '</div>' +
      '<div class="doc-body">' + escapeHtml(item.description) + '</div>' +
      statsHtml + ammoHtml + consumableHtml + soundHtml;

    if (item.ammo) wireAmmoActions(idx, item, content);
    if (item.consumable) wireConsumableActions(idx, item, content);
    if (soundHtml) {
      content.querySelector(".sfx-btn").addEventListener("click", function () {
        if (SFX.sample) SFX.sample(item.sfx, 0.9);
        if (navigator.vibrate) navigator.vibrate([30, 40, 60]);
      });
    }

    gridEl(idx).style.display = "none";
    var head = document.querySelector("#panel-gear-" + idx + " .col-gear-head");
    if (head) head.style.display = "none";
    detail.classList.remove("hidden");
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
      '<span class="ammo-count">' + a.current + '</span>' +
      '<span class="ammo-sep">/</span><span class="ammo-cap">' + a.magCapacity + '</span></div>' +
      '<div class="ammo-label">' + a.magLabel + '</div></div>' +
      '<div class="ammo-reserve"><span class="ammo-reserve-label">SPARE ' + a.spareLabel.toUpperCase() +
      '</span><span class="ammo-reserve-value ammo-spare">' + a.spareMags + '</span></div>' +
      '<div class="ammo-reserve"><span class="ammo-reserve-label">TOTAL REMAINING</span>' +
      '<span class="ammo-reserve-value ammo-total">' + totalRemaining + '</span></div>' +
      '<div class="weapon-actions">' + fireButtons +
      '<button class="weapon-action-btn reload-btn" data-action="reload"' + reloadDisabled + '>RELOAD ' + a.magLabel.toUpperCase() + '</button>' +
      '<button class="weapon-action-btn found-btn" data-action="found-mag">+ FOUND ' + a.spareLabel.toUpperCase().slice(0, -1) + '</button>' +
      '</div><div class="ammo-log"></div></div>';
  }

  function wireAmmoActions(idx, item, container) {
    container.querySelectorAll(".weapon-action-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        const action = btn.dataset.action;
        if (action === "semi") fireWeapon(idx, item, 1, container);
        else if (action === "burst") fireWeapon(idx, item, 3, container);
        else if (action === "reload") reloadWeapon(idx, item, container);
        else if (action === "found-mag") foundMag(idx, item);
      });
    });
  }

  function fireWeapon(idx, item, rounds, container) {
    const a = item.ammo;
    if (a.current <= 0) {
      SFX.empty();
      logToEl(container, "ammo-log", "EMPTY — NO ROUND IN CHAMBER");
      flashAmmoCount(container);
      return;
    }
    const spent = Math.min(rounds, a.current);
    a.current -= spent;
    var magFed = /mag/i.test(a.magLabel || "");
    if (spent === 1) {
      if (magFed && SFX.shotRifle) SFX.shotRifle(); else SFX.gunshot();
      logToEl(container, "ammo-log", "FIRED 1 ROUND — " + a.current + " remaining");
    } else {
      SFX.burst(spent);
      logToEl(container, "ammo-log", "BURST FIRE — " + spent + " ROUNDS SPENT — " + a.current + " remaining");
    }
    updateAmmoDisplay(item, container);
    save();
    const vibePattern = Array.from({ length: spent }, function (_, i) { return i === 0 ? 30 : [40, 30]; }).flat();
    if (navigator.vibrate) navigator.vibrate(vibePattern);
  }

  function reloadWeapon(idx, item, container) {
    const a = item.ammo;
    if (a.spareMags <= 0) { SFX.empty(); logToEl(container, "ammo-log", "NO SPARE " + a.spareLabel.toUpperCase()); return; }
    if (a.current === a.magCapacity) { logToEl(container, "ammo-log", a.magLabel.toUpperCase() + " ALREADY FULL"); return; }
    // Mag-fed weapons (e.g. carbine) reload with the rifle sound; revolver-style
    // cylinders keep the revolver reload.
    if (/mag/i.test(a.magLabel || "") && SFX.reloadRifle) SFX.reloadRifle();
    else SFX.reload();
    const oldRounds = a.current;
    a.spareMags--;
    a.current = a.magCapacity;
    if (oldRounds > 0) logToEl(container, "ammo-log", "SWAPPED " + a.magLabel.toUpperCase() + " — " + oldRounds + " ROUNDS DISCARDED");
    else logToEl(container, "ammo-log", a.magLabel.toUpperCase() + " LOADED — " + a.magCapacity + " ROUNDS");
    updateAmmoDisplay(item, container);
    save();
    if (navigator.vibrate) navigator.vibrate([20, 80, 40]);
  }

  function foundMag(idx, item) {
    item.ammo.spareMags++;
    SFX.use();
    save();
    showInventoryDetail(idx, item);
    if (navigator.vibrate) navigator.vibrate([15, 50, 15]);
  }

  function updateAmmoDisplay(item, container) {
    const a = item.ammo;
    const totalRemaining = a.current + a.spareMags * a.magCapacity;
    const countEl = container.querySelector(".ammo-count");
    const spareEl = container.querySelector(".ammo-spare");
    const totalEl = container.querySelector(".ammo-total");
    if (countEl) countEl.textContent = a.current;
    if (spareEl) spareEl.textContent = a.spareMags;
    if (totalEl) totalEl.textContent = totalRemaining;
    const display = countEl ? countEl.closest(".ammo-current") : null;
    if (display) {
      display.classList.toggle("ammo-empty", a.current === 0);
      display.classList.toggle("ammo-low", a.current > 0 && a.current <= Math.ceil(a.magCapacity * 0.25));
    }
    const reloadBtn = container.querySelector(".reload-btn");
    if (reloadBtn) reloadBtn.disabled = a.spareMags <= 0 || a.current === a.magCapacity;
    container.querySelectorAll(".fire-semi-btn, .fire-burst-btn").forEach(function (btn) {
      btn.classList.toggle("action-dry", a.current <= 0);
    });
  }

  function logToEl(container, cls, msg) {
    const log = container.querySelector("." + cls);
    if (!log) return;
    const line = document.createElement("div");
    line.className = "ammo-log-line";
    line.textContent = "> " + msg;
    log.appendChild(line);
    log.scrollTop = log.scrollHeight;
    while (log.children.length > 6) log.removeChild(log.firstChild);
  }

  function flashAmmoCount(container) {
    const el = container.querySelector(".ammo-count");
    if (!el) return;
    el.classList.add("flash-warn");
    setTimeout(function () { el.classList.remove("flash-warn"); }, 400);
  }

  // --- Support items (heal / revive) ---
  // Healing is rolled on a PHYSICAL die and applied by the GM. Using an item
  // only consumes it (from the user) and tells the GM which die to roll.
  //   die: which die to roll · self/ally: who it can target ·
  //   allyOnlyWhenDown: ally target must be passed out (revive only)
  function supportFor(item) { return (item && item.support) || null; }

  function allyUsable(cfg, other, uses) {
    if (uses <= 0) return false;
    if (cfg.allyOnlyWhenDown) return other.hp <= 0;
    return other.hp < other.hpMax; // heal anyone not at full (includes downed)
  }
  function selfUsable(cfg, self, uses) {
    return cfg.self && uses > 0 && self.hp < self.hpMax;
  }

  function useSupport(userIdx, item, container, who) {
    var cfg = supportFor(item);
    if (!cfg) return;
    var c = item.consumable;
    if (c.current <= 0) {
      SFX.empty();
      logToEl(container, "consumable-log", c.depletedMsg);
      var el = container.querySelector(".consumable-count");
      if (el) { el.classList.add("flash-warn"); setTimeout(function () { el.classList.remove("flash-warn"); }, 400); }
      return;
    }

    var targetIdx = who === "ally" ? (1 - userIdx) : userIdx;
    var target = STATE.players[targetIdx];

    if (who === "ally") {
      if (!cfg.ally) return;
      if (cfg.allyOnlyWhenDown && target.hp > 0) { logToEl(container, "consumable-log", displayName(targetIdx) + " IS NOT DOWN"); return; }
    } else if (!cfg.self) {
      return;
    }

    // Consume from the user's item; the actual HP is a physical roll the GM applies.
    c.current -= c.perUse;
    consumableSound(item);
    var verb = target.hp <= 0 ? "REVIVE" : "HEAL";
    logToEl(container, "consumable-log", verb + " " + displayName(targetIdx) + " — ROLL " + cfg.die.toUpperCase() + ", GM APPLIES");
    updateConsumableDisplay(item, container);
    refreshSupportButtons(userIdx, item, container);
    if (window.GameSync) {
      GameSync.send({ type: "coop-heal", user: userIdx, target: targetIdx, item: item.name, die: cfg.die, revive: target.hp <= 0 });
    }
    save();
    if (navigator.vibrate) navigator.vibrate([15, 50, 15]);
  }

  function refreshSupportButtons(idx, item, container) {
    var cfg = supportFor(item);
    if (!cfg) return;
    var c = item.consumable;
    var self = STATE.players[idx], other = STATE.players[1 - idx];
    var selfBtn = container.querySelector('[data-action="use-self"]');
    if (selfBtn) selfBtn.disabled = !selfUsable(cfg, self, c.current);
    var allyBtn = container.querySelector('[data-action="use-ally"]');
    if (allyBtn) {
      allyBtn.disabled = !allyUsable(cfg, other, c.current);
      allyBtn.textContent = (other.hp <= 0 ? "REVIVE " : "USE ON ") + displayName(1 - idx) + " (" + cfg.die.toUpperCase() + ")";
    }
  }

  // --- Inventory: consumables ---
  function buildConsumablePanel(item, idx) {
    const c = item.consumable;
    const emptyClass = c.current === 0 ? " ammo-empty" : "";
    const lowClass = c.current > 0 && c.current <= Math.ceil(c.max * 0.25) ? " ammo-low" : "";

    let pipsHtml = "";
    for (let i = 0; i < c.max; i++) pipsHtml += '<div class="consumable-pip' + (i < c.current ? " filled" : "") + '"></div>';

    var cfg = supportFor(item);
    var actions = "";
    if (cfg) {
      var self = STATE.players[idx], other = STATE.players[1 - idx];
      if (cfg.self) {
        actions += '<button class="weapon-action-btn use-self-btn" data-action="use-self"' +
          (selfUsable(cfg, self, c.current) ? "" : " disabled") + '>USE ON SELF (' + cfg.die.toUpperCase() + ')</button>';
      }
      if (cfg.ally) {
        var aLabel = (other.hp <= 0 ? "REVIVE " : "USE ON ") + displayName(1 - idx) + " (" + cfg.die.toUpperCase() + ")";
        actions += '<button class="weapon-action-btn use-ally-btn" data-action="use-ally"' +
          (allyUsable(cfg, other, c.current) ? "" : " disabled") + '>' + aLabel + '</button>';
      }
    } else {
      actions += '<button class="weapon-action-btn use-btn" data-action="use"' +
        (c.current <= 0 ? " disabled" : "") + '>' + c.useLabel + '</button>';
    }
    actions += '<button class="weapon-action-btn found-btn" data-action="found-supply">+ FOUND ' + c.unit.toUpperCase() + '</button>';

    return '' +
      '<div class="ammo-panel">' +
      '<div class="ammo-header">' + c.verb + ' STATUS</div>' +
      '<div class="ammo-display"><div class="ammo-current' + emptyClass + lowClass + '">' +
      '<span class="ammo-count consumable-count">' + c.current + '</span>' +
      '<span class="ammo-sep">/</span><span class="ammo-cap">' + c.max + '</span></div>' +
      '<div class="ammo-label">' + c.unit.toUpperCase() + '</div></div>' +
      '<div class="consumable-pips">' + pipsHtml + '</div>' +
      '<div class="weapon-actions">' + actions +
      '</div><div class="ammo-log consumable-log"></div></div>';
  }

  function wireConsumableActions(idx, item, container) {
    container.querySelectorAll("[data-action]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var a = btn.dataset.action;
        if (a === "use") useConsumable(idx, item, container);
        else if (a === "use-self") useSupport(idx, item, container, "self");
        else if (a === "use-ally") useSupport(idx, item, container, "ally");
        else if (a === "found-supply") foundSupply(idx, item);
      });
    });
  }

  // Pick the recorded sound that fits the item being consumed.
  function consumableSound(item) {
    var verb = item.consumable && item.consumable.verb;
    if (verb === "EAT") return SFX.eat();
    if (item.type === "medical" || verb === "APPLY" || verb === "INJECT") return SFX.heal();
    return SFX.use(); // batteries, generic charges, etc.
  }

  function useConsumable(idx, item, container) {
    const c = item.consumable;
    if (c.current <= 0) {
      SFX.empty();
      logToEl(container, "consumable-log", c.depletedMsg);
      const el = container.querySelector(".consumable-count");
      if (el) { el.classList.add("flash-warn"); setTimeout(function () { el.classList.remove("flash-warn"); }, 400); }
      return;
    }
    c.current -= c.perUse;
    consumableSound(item);
    logToEl(container, "consumable-log", c.verb + " — " + c.current + " " + c.unit + " remaining");
    updateConsumableDisplay(item, container);
    save();
    if (navigator.vibrate) navigator.vibrate([15, 50, 15]);
  }

  function foundSupply(idx, item) {
    const c = item.consumable;
    c.current += 1;
    c.max += 1;
    SFX.use();
    showInventoryDetail(idx, item);
    save();
    if (navigator.vibrate) navigator.vibrate([15, 50, 15]);
  }

  function updateConsumableDisplay(item, container) {
    const c = item.consumable;
    const countEl = container.querySelector(".consumable-count");
    if (countEl) countEl.textContent = c.current;
    const display = countEl ? countEl.closest(".ammo-current") : null;
    if (display) {
      display.classList.toggle("ammo-empty", c.current === 0);
      display.classList.toggle("ammo-low", c.current > 0 && c.current <= Math.ceil(c.max * 0.25));
    }
    container.querySelectorAll(".consumable-pips .consumable-pip").forEach(function (pip, i) {
      pip.classList.toggle("filled", i < c.current);
    });
    const useBtn = container.querySelector(".use-btn");
    if (useBtn) { useBtn.disabled = c.current <= 0; useBtn.classList.toggle("action-dry", c.current <= 0); }
  }

  // --- GM-driven item creation (received over sync) ---
  function buildItemFromSpec(spec) {
    spec = spec || {};

    // Predefined catalog item from the GM console: a full item object
    // (icon, ammo/consumable, fireModes, stats). Clone it and re-id.
    if (spec.ammo || spec.consumable || spec.icon || spec.stats || spec.fireModes) {
      var full = clone(spec);
      full.id = genId();
      full.type = full.type || "misc";
      full.name = full.name || "Unknown Item";
      full.quantity = Math.max(1, parseInt(full.quantity, 10) || 1);
      full.description = full.description || "No description.";
      if (!full.stats || typeof full.stats !== "object") full.stats = {};
      return full;
    }

    // Legacy simplified spec (name/type/tracker fields)
    var type = spec.type || "misc";
    var item = {
      id: genId(),
      type: type,
      name: (spec.name || "").trim() || "Unknown Item",
      icon: spec.icon || ICON_FOR_TYPE[type] || "📦",
      quantity: Math.max(1, parseInt(spec.quantity, 10) || 1),
      description: (spec.description || "").trim() || "No description.",
      stats: spec.stats && typeof spec.stats === "object" ? spec.stats : {},
    };
    if (spec.tracker === "ammo") {
      var cap = Math.max(1, parseInt(spec.magCapacity, 10) || 1);
      var spare = Math.max(0, parseInt(spec.spareMags, 10) || 0);
      item.ammo = { current: cap, magCapacity: cap, spareMags: spare, magLabel: "Magazine", spareLabel: "Magazines" };
      item.fireModes = ["semi"];
    } else if (spec.tracker === "uses") {
      var m = Math.max(1, parseInt(spec.maxUses, 10) || 1);
      item.consumable = { current: m, max: m, unit: "uses", perUse: 1, verb: "USE", useLabel: "USE", depletedMsg: "DEPLETED" };
    }
    return item;
  }

  // --- Sync (GM uplink) ---
  function clampStat(p, stat, value) {
    var v = parseInt(value, 10);
    if (isNaN(v)) return;
    if (stat === "hpMax" || stat === "stressMax") {
      p[stat] = Math.max(1, v);
      var cur = stat === "hpMax" ? "hp" : "stress";
      if (p[cur] > p[stat]) p[cur] = p[stat];
    } else if (stat === "hp" || stat === "stress") {
      var max = stat === "hp" ? p.hpMax : p.stressMax;
      p[stat] = Math.max(0, Math.min(max, v));
    }
  }

  function snapshot() {
    return {
      type: "coop-state",
      storyId: STORY_ID,
      players: STATE.players.map(function (p, i) {
        return { name: displayName(i), hp: p.hp, hpMax: p.hpMax, stress: p.stress, stressMax: p.stressMax };
      }),
    };
  }

  var seenItemNonces = []; // recently applied coop-add-item nonces (dedupe)
  var seenFxNonces = [];   // recently applied fear/panic nonces (dedupe WS+BC double)
  var toastTimer = null;

  function showToast(msg) {
    var el = document.getElementById("duo-toast");
    if (!el) return;
    el.textContent = msg;
    el.classList.remove("hidden");
    // force reflow so re-triggers re-run the transition
    void el.offsetWidth;
    el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove("show"); }, 2600);
  }

  function handleSyncMessage(msg) {
    if (!msg || typeof msg !== "object") return;

    if (msg.type === "request-state") {
      GameSync.send(snapshot());
      return;
    }

    if (msg.type === "lights-on") { clearAllFx(); return; }

    if (msg.type === "ambiance") {
      if (SFX.ambiance) SFX.ambiance(msg.url, msg.on !== false, msg.volume);
      return;
    }

    if (msg.type === "fear" || msg.type === "panic") {
      // GameSync delivers over WS + BroadcastChannel; drop the duplicate so a
      // single press doesn't fire (or toggle) twice.
      if (msg.nonce) {
        if (seenFxNonces.indexOf(msg.nonce) !== -1) return;
        seenFxNonces.push(msg.nonce);
        if (seenFxNonces.length > 40) seenFxNonces.shift();
      }
    }

    if (msg.type === "fear") {
      if (msg.active) {
        document.body.classList.add("fear-active");
        startFearDrone(); // ambient drone only — no alert blip
      } else {
        document.body.classList.remove("fear-active");
        stopFearDrone();
      }
      return;
    }

    if (msg.type === "panic") {
      handlePanic(msg.action, msg.on);
      return;
    }

    if (msg.type === "coop-stat") {
      var idx = msg.player === 1 ? 1 : 0;
      var p = STATE.players[idx];
      clampStat(p, msg.stat, msg.value);
      renderVitals(idx);
      // If the partner is holding a support item open, refresh it so the
      // revive/heal button reflects this player's new HP.
      var otherIdx = 1 - idx;
      var openId = STATE.openItem[otherIdx];
      if (openId) {
        var openItem = STATE.players[otherIdx].inventory.find(function (it) { return it.id === openId; });
        if (openItem && openItem.consumable && supportFor(openItem)) showInventoryDetail(otherIdx, openItem);
      }
      save();
      return;
    }

    if (msg.type === "coop-add-item") {
      // GameSync delivers over WebSocket AND BroadcastChannel; ignore the
      // duplicate copy so a single "give" doesn't add the item twice.
      if (msg.nonce) {
        if (seenItemNonces.indexOf(msg.nonce) !== -1) return;
        seenItemNonces.push(msg.nonce);
        if (seenItemNonces.length > 50) seenItemNonces.shift();
      }
      var pi = msg.player === 1 ? 1 : 0;
      var inv = STATE.players[pi].inventory;
      var incoming = buildItemFromSpec(msg.item || {});

      // Merge into an existing matching item instead of stacking a duplicate:
      //  - consumable (stim, medkit, rations) -> add uses
      //  - ammo weapon -> add a spare magazine
      //  - anything else -> bump quantity
      var existing = inv.find(function (it) {
        return it.type === incoming.type && it.name.toLowerCase() === incoming.name.toLowerCase();
      });
      var target = incoming; // the item the player ends up interacting with

      if (existing && existing.consumable && incoming.consumable) {
        existing.consumable.max += incoming.consumable.max;
        existing.consumable.current += incoming.consumable.max;
        target = existing;
        consumableSound(existing);
      } else if (existing && existing.ammo && incoming.ammo) {
        existing.ammo.spareMags += 1;
        target = existing;
        SFX.reload();
      } else if (existing && !existing.ammo && !existing.consumable) {
        existing.quantity = (existing.quantity || 1) + (incoming.quantity || 1);
        target = existing;
        SFX.use();
      } else {
        inv.push(incoming);
        SFX.use();
      }

      if (STATE.view[pi] === "gear") {
        // If the player is looking at the item that just changed, refresh that
        // detail; otherwise just refresh the grid.
        if (STATE.openItem[pi] && STATE.openItem[pi] === target.id) showInventoryDetail(pi, target);
        else if (!STATE.openItem[pi]) renderInventory(pi);
      }
      save();
      return;
    }

    if (msg.type === "coop-note") {
      var note = msg.note;
      if (!note || !note.id) return;
      if (STATE.notes.some(function (n) { return n.id === note.id; })) return; // already recovered
      STATE.notes.unshift({
        id: note.id,
        type: "note",
        title: note.title || "Recovered Note",
        date: "RECOVERED",
        author: "FIELD NOTE",
        classification: note.tone || "",
        body: note.body || "",
        effect: note.effect || null,
        image: note.image || null,
      });
      // Subtle UI cue only — revealing a note must NOT fire the atmosphere triggers.
      if (SFX.radioSwitch) SFX.radioSwitch();
      if (navigator.vibrate) navigator.vibrate(20);
      switchArchTab("journal");
      renderArchJournalList();
      renderArchMediaList(); // a note may unlock a related archive image
      showToast("NEW LOG RECOVERED");
      save();
      return;
    }

    if (msg.type === "coop-reset") {
      STATE.players = [makePlayer(), makePlayer()];
      STATE.view = ["vitals", "vitals"];
      STATE.notes = []; // recovered field notes clear back to the starter journal
      STATE.allHereDone = false; // the set-piece can play again next game
      STATE.started = false; // next load runs the intro + crew setup again
      SFX.bootDone();
      closeRecord();
      renderArchJournalList();
      renderArchMediaList();
      renderAll();
      save();
      GameSync.send(snapshot());
      return;
    }
  }

  // --- Atmosphere effects (driven by the GM console) ---
  var fearDrone = null;

  var flickerTimer = null;

  // Sustained panic. Visual effects (glitch/corrupt/blackout/flicker) are
  // mutually exclusive; static (audio) and reboot (one-shot) are independent.
  // No alert/error blips — only radio static makes sound.
  function handlePanic(action, on) {
    on = on !== false;
    if (action === "static") {
      if (SFX.radioStaticSet) SFX.radioStaticSet(on);
      if (on && navigator.vibrate) navigator.vibrate(60);
      return;
    }
    if (action === "alarm") { // sound only — no lights, no visuals
      if (SFX.alarm) SFX.alarm(on);
      if (on && navigator.vibrate) navigator.vibrate(60);
      return;
    }
    if (action === "reboot") { panicReboot(); return; }

    clearVisualFx();   // one visual effect at a time (also stops the glitch alarm)
    if (!on) return;   // toggled off — already cleared
    switch (action) {
      case "glitch":
        document.body.classList.add("panic-glitch-hold");
        if (SFX.alarm) SFX.alarm(true);
        if (navigator.vibrate) navigator.vibrate([50, 30, 50]);
        break;
      case "corrupt":
        document.body.classList.add("panic-corrupt-hold");
        break;
      case "blackout":
        document.getElementById("blackout-overlay").classList.add("active");
        break;
      case "flicker":
        setFlicker(true);
        break;
    }
  }

  // Continuous failing-light flicker on the terminal (blackout overlay).
  function setFlicker(on) {
    var overlay = document.getElementById("blackout-overlay");
    if (on) {
      if (flickerTimer) return;
      flickerTimer = setInterval(function () {
        overlay.classList.toggle("active", Math.random() < 0.5);
      }, 90);
    } else {
      clearInterval(flickerTimer);
      flickerTimer = null;
      overlay.classList.remove("active");
    }
  }

  // Stop the visual panic effects (they're mutually exclusive). Also stops the
  // glitch alarm, which lives with the glitch effect.
  function clearVisualFx() {
    document.body.classList.remove("panic-glitch-hold", "panic-corrupt-hold", "panic-glitch", "panic-corrupt");
    setFlicker(false);
    var overlay = document.getElementById("blackout-overlay");
    if (overlay) overlay.classList.remove("active");
    if (SFX.alarm) SFX.alarm(false);
  }

  // Master all-clear (the GM's "LIGHTS ON"): stop every terminal effect.
  function clearAllFx() {
    clearVisualFx();
    document.body.classList.remove("fear-active");
    stopFearDrone();
    if (SFX.radioStaticSet) SFX.radioStaticSet(false);
  }

  function panicReboot() {
    var overlay = document.getElementById("reboot-overlay");
    var bar = document.getElementById("reboot-bar");
    overlay.classList.add("active");
    stopFearDrone();
    if (navigator.vibrate) navigator.vibrate(300);

    bar.style.width = "0%";
    var progress = 0;
    var interval = setInterval(function () {
      progress += 2 + Math.random() * 8;
      if (progress > 100) progress = 100;
      bar.style.width = progress + "%";
      if (progress >= 100) {
        clearInterval(interval);
        setTimeout(function () {
          overlay.classList.remove("active");
          bar.style.width = "0%";
          if (document.body.classList.contains("fear-active")) startFearDrone();
        }, 800);
      }
    }, 150);
  }

  function startFearDrone() {
    if (fearDrone) return;
    if (!SFX.ensureContext()) return;
    const ctx = SFX._ctx();
    if (!ctx) return;

    const lfo = ctx.createOscillator();
    lfo.type = "sine";
    lfo.frequency.value = 0.5;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 15;
    lfo.connect(lfoGain);

    const bass = ctx.createOscillator();
    bass.type = "sawtooth";
    bass.frequency.value = 28;
    lfoGain.connect(bass.frequency);
    const bassGain = ctx.createGain();
    bassGain.gain.value = 0.06;
    bass.connect(bassGain);
    bassGain.connect(ctx.destination);

    const whine = ctx.createOscillator();
    whine.type = "sine";
    whine.frequency.value = 4200;
    const whineGain = ctx.createGain();
    whineGain.gain.value = 0.03;
    whine.connect(whineGain);
    whineGain.connect(ctx.destination);

    const bufLen = ctx.sampleRate * 2;
    const noiseBuf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
    const noiseData = noiseBuf.getChannelData(0);
    for (let i = 0; i < bufLen; i++) noiseData[i] = Math.random() * 2 - 1;
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuf;
    noise.loop = true;
    const noiseFilt = ctx.createBiquadFilter();
    noiseFilt.type = "bandpass";
    noiseFilt.frequency.value = 2000;
    noiseFilt.Q.value = 0.5;
    const noiseGain = ctx.createGain();
    noiseGain.gain.value = 0.04;
    noise.connect(noiseFilt);
    noiseFilt.connect(noiseGain);
    noiseGain.connect(ctx.destination);

    lfo.start();
    bass.start();
    whine.start();
    noise.start();

    fearDrone = { lfo: lfo, bass: bass, whine: whine, noise: noise, bassGain: bassGain, whineGain: whineGain, noiseGain: noiseGain };
  }

  function stopFearDrone() {
    if (!fearDrone) return;
    const d = fearDrone;
    fearDrone = null;
    try {
      d.lfo.stop();
      d.bass.stop();
      d.whine.stop();
      d.noise.stop();
      d.bassGain.disconnect();
      d.whineGain.disconnect();
      d.noiseGain.disconnect();
    } catch (e) {}
  }

  function initSync() {
    if (!window.GameSync) return;
    var statusEl = document.getElementById("link-status");
    GameSync.onStatus(function (online) {
      if (statusEl) statusEl.classList.toggle("online", !!online);
    });
    GameSync.onMessage(handleSyncMessage);
    GameSync.init("player");
    // Announce our current vitals so a GM console that's already open syncs up.
    GameSync.send(snapshot());
  }

  // --- Interactions ---
  function switchView(idx, view) {
    if (view === STATE.view[idx]) return;
    STATE.view[idx] = view;
    SFX.tab();
    if (navigator.vibrate) navigator.vibrate(10);
    renderColumnChrome(idx);
    if (view === "gear") { closeDetail(idx); renderInventory(idx); }
    save();
  }

  function initToggles() {
    document.querySelectorAll(".col-tabs .nav-tab").forEach(function (tab) {
      tab.addEventListener("click", function () {
        switchView(Number(tab.dataset.player), tab.dataset.view);
      });
    });
    document.querySelectorAll(".back-btn[data-back]").forEach(function (btn) {
      btn.addEventListener("click", function () { SFX.back(); closeDetail(Number(btn.dataset.back)); });
    });
  }

  // --- Identity picker (portrait carousel + name) ---
  var identityPlayer = 0; // which player the modal is editing
  var pcIndex = 0;        // current carousel position

  function loadPortraits() {
    if (!window.fetch) return;
    fetch("/api/portraits")
      .then(function (r) { return r.json(); })
      .then(function (list) { if (Array.isArray(list)) PORTRAITS = list; })
      .catch(function () { /* no server / no portraits — picker shows empty */ });
  }

  function renderCarousel() {
    var img = document.getElementById("pc-img");
    var empty = document.getElementById("pc-empty");
    var count = document.getElementById("pc-count");
    if (!PORTRAITS.length) {
      img.hidden = true; empty.classList.remove("hidden"); count.textContent = "0 / 0";
      return;
    }
    empty.classList.add("hidden");
    pcIndex = (pcIndex % PORTRAITS.length + PORTRAITS.length) % PORTRAITS.length;
    img.src = PORTRAITS[pcIndex];
    img.hidden = false;
    count.textContent = (pcIndex + 1) + " / " + PORTRAITS.length;
  }

  // Apply the currently-shown portrait to the player being edited (live).
  function applyPortrait() {
    if (!PORTRAITS.length) return;
    STATE.players[identityPlayer].portrait = PORTRAITS[pcIndex];
    renderIdentity(identityPlayer);
    save();
    if (window.GameSync) GameSync.send(snapshot());
  }

  function navPortrait(dir) {
    if (!PORTRAITS.length) return;
    pcIndex += dir;
    renderCarousel();
    applyPortrait();
  }

  function openIdentity(idx) {
    identityPlayer = idx;
    var p = STATE.players[idx];
    document.getElementById("identity-name").value = p.name || "";
    pcIndex = p.portrait ? Math.max(0, PORTRAITS.indexOf(p.portrait)) : 0;
    renderCarousel();
    applyPortrait(); // commit the shown portrait so the first image counts without navigating
    SFX.select();
    document.getElementById("identity-modal").classList.remove("hidden");
  }

  function closeIdentity() {
    document.getElementById("identity-modal").classList.add("hidden");
  }

  function initIdentity() {
    // Open from either the portrait or the name button on each card
    [0, 1].forEach(function (idx) {
      document.getElementById("col-portrait-" + idx).addEventListener("click", function () { openIdentity(idx); });
      document.getElementById("name-btn-" + idx).addEventListener("click", function () { openIdentity(idx); });
    });

    var modal = document.getElementById("identity-modal");
    modal.querySelector(".pc-prev").addEventListener("click", function () { navPortrait(-1); });
    modal.querySelector(".pc-next").addEventListener("click", function () { navPortrait(1); });
    modal.querySelector(".identity-backdrop").addEventListener("click", function () { SFX.back(); closeIdentity(); });
    document.getElementById("identity-done").addEventListener("click", function () { SFX.back(); closeIdentity(); });

    var nameInput = document.getElementById("identity-name");
    nameInput.addEventListener("input", function () {
      STATE.players[identityPlayer].name = nameInput.value;
      renderIdentity(identityPlayer);
      save();
      if (window.GameSync) GameSync.send(snapshot());
    });
  }

  // --- Ship records (shared journal + archives) ---
  function archiveJournal() {
    var base = activeStory().journal || [];
    // Recovered field notes sit on top (newest first), then the briefing.
    return STATE.notes.concat(base);
  }
  function archiveMedia() {
    var archives = activeStory().archives || [];
    // Only show an image once its related journal entry/note is in play.
    var present = {};
    archiveJournal().forEach(function (e) { present[e.id] = true; });
    return archives.filter(function (m) { return !m.requires || present[m.requires]; });
  }

  function entryRow(id, type, title, meta) {
    return '<button class="entry-row" data-id="' + id + '">' +
      '<span class="entry-type type-' + type + '">' + type.toUpperCase() + '</span>' +
      '<span class="entry-main"><span class="entry-title">' + escapeHtml(title) + '</span>' +
      (meta ? '<span class="entry-meta">' + escapeHtml(meta) + '</span>' : '') +
      '</span></button>';
  }

  function renderArchJournalList() {
    var list = document.getElementById("arch-journal-list");
    var entries = archiveJournal();
    if (!entries.length) { list.innerHTML = '<div class="empty-state"><div class="empty-text">NO LOGS RECOVERED</div></div>'; return; }
    list.innerHTML = entries.map(function (e) {
      var meta = (e.date || "") + (e.author ? " · " + e.author : "");
      return entryRow(e.id, e.type, e.title, meta);
    }).join("");
    list.querySelectorAll(".entry-row").forEach(function (row) {
      row.addEventListener("click", function () {
        SFX.select();
        var e = archiveJournal().find(function (x) { return x.id === row.dataset.id; });
        if (e) showArchJournalDetail(e);
      });
    });
  }

  function openRecord(html) {
    var content = document.getElementById("record-content");
    content.innerHTML = html;
    var box = document.querySelector("#record-modal .record-box");
    if (box) box.scrollTop = 0;
    document.getElementById("record-modal").classList.remove("hidden");
  }

  function closeRecord() {
    document.getElementById("record-modal").classList.add("hidden");
  }

  function showArchJournalDetail(e) {
    // One-time set-piece: the "WE ARE ALL HERE" page writes itself out,
    // accelerates, fear takes hold, then the terminal force-reboots.
    if (e.effect === "allhere" && !STATE.allHereDone) {
      STATE.allHereDone = true;
      save();
      runAllHereSequence(e);
      return;
    }
    var meta = '<span>' + escapeHtml(e.date || "") + '</span>' +
      (e.author ? '<span>' + escapeHtml(e.author) + '</span>' : '') +
      (e.classification ? '<span>' + escapeHtml(String(e.classification).toUpperCase()) + '</span>' : '');
    var img = e.image ? '<img class="arch-media" src="' + storyImg(e.image) + '" alt="" draggable="false">' : "";
    openRecord(
      '<div class="doc-header"><div class="doc-title">' + escapeHtml(e.title) + '</div>' +
      '<div class="doc-meta">' + meta + '</div></div>' +
      img +
      '<div class="doc-body journal-body">' + escapeHtml(e.body || "") + '</div>'
    );
  }

  function renderArchMediaList() {
    var list = document.getElementById("arch-media-list");
    var media = archiveMedia();
    if (!media.length) { list.innerHTML = '<div class="empty-state"><div class="empty-text">NO ARCHIVES</div></div>'; return; }
    list.innerHTML = media.map(function (m) {
      return entryRow(m.id, m.type, m.name, m.date || "");
    }).join("");
    list.querySelectorAll(".entry-row").forEach(function (row) {
      row.addEventListener("click", function () {
        SFX.select();
        var m = archiveMedia().find(function (x) { return x.id === row.dataset.id; });
        if (m) showArchMediaDetail(m);
      });
    });
  }

  function runAllHereSequence(e) {
    openRecord(
      '<div class="doc-header"><div class="doc-title">' + escapeHtml(e.title) + '</div>' +
      '<div class="doc-meta"><span>' + escapeHtml(e.date || "") + '</span></div></div>' +
      '<div class="doc-body journal-body" id="allhere-stream"></div>'
    );
    var stream = document.getElementById("allhere-stream");
    var box = document.querySelector("#record-modal .record-box");
    var LINE = "WE ARE ALL HERE.\n";

    function append(n) {
      var s = "";
      for (var i = 0; i < n; i++) s += LINE;
      stream.textContent += s;
      if (box) box.scrollTop = box.scrollHeight;
    }

    // Build an accelerating timeline: slow → fast → (fear) → frantic → reboot.
    var steps = [];
    for (var i = 0; i < 6; i++) steps.push({ delay: 210, n: 1 });   // slow, deliberate
    for (i = 0; i < 14; i++) steps.push({ delay: 60, n: 1 });        // speeding up
    steps.push({ delay: 60, fear: true, n: 1 });                     // fear takes hold
    for (i = 0; i < 40; i++) steps.push({ delay: 26, n: 3 });        // faster
    for (i = 0; i < 26; i++) steps.push({ delay: 12, n: 9 });        // endless
    steps.push({ delay: 1300, n: 4 });                               // hold — let the dread sit
    steps.push({ reboot: true });

    var idx = 0;
    (function tick() {
      if (idx >= steps.length) return;
      var st = steps[idx++];
      if (st.fear) {
        document.body.classList.add("fear-active");
        SFX.fearStart();
        startFearDrone();
      }
      if (st.n) append(st.n);
      if (st.reboot) {
        // Full stop: clear fear so the reboot ends in silence, then reboot.
        document.body.classList.remove("fear-active");
        stopFearDrone();
        closeRecord();
        panicReboot();
        return;
      }
      setTimeout(tick, st.delay);
    })();
  }

  function showArchMediaDetail(m) {
    var mediaHtml = m.type === "video"
      ? '<video src="' + m.src + '" controls playsinline class="arch-media"></video>'
      : '<img src="' + storyImg(m.image) + '" alt="" class="arch-media" draggable="false">';
    openRecord(
      '<div class="doc-header"><div class="doc-title">' + escapeHtml(m.name) + '</div>' +
      '<div class="doc-meta"><span>' + escapeHtml(m.date || "") + '</span></div></div>' +
      mediaHtml +
      '<div class="doc-body">' + escapeHtml(m.description || "") + '</div>'
    );
  }

  function switchArchTab(which) {
    document.querySelectorAll(".archive-tabs .nav-tab").forEach(function (t) {
      t.classList.toggle("active", t.dataset.arch === which);
    });
    document.getElementById("arch-journal").classList.toggle("active", which === "journal");
    document.getElementById("arch-archives").classList.toggle("active", which === "archives");
    SFX.tab();
  }

  function initArchive() {
    renderArchJournalList();
    renderArchMediaList();
    document.querySelectorAll(".archive-tabs .nav-tab").forEach(function (t) {
      t.addEventListener("click", function () { switchArchTab(t.dataset.arch); });
    });
    document.getElementById("record-close").addEventListener("click", function () { SFX.back(); closeRecord(); });
    document.querySelector("#record-modal .record-backdrop").addEventListener("click", function () { SFX.back(); closeRecord(); });
  }

  // --- Render everything ---
  function renderAll() {
    [0, 1].forEach(function (idx) {
      renderColumnChrome(idx);
      renderVitals(idx);
      renderInventory(idx);
      if (STATE.view[idx] === "gear") {
        // keep grid visible; close any stale detail
        closeDetail(idx);
      }
    });
  }

  // --- Init ---
  function initApp() {
    load();
    buildColumns();
    startClock();
    initToggles();
    initIdentity();
    initArchive();
    loadPortraits();
    renderAll();
    initSync();
    // ECG monitors need layout, so they start in beginGame() once #app is shown.
  }

  // --- Intro: story briefing -> crew setup -> game ---

  function startIntro() {
    var intro = document.getElementById("intro");
    var textEl = document.getElementById("intro-text");
    var contBtn = document.getElementById("intro-continue");
    intro.classList.remove("hidden");
    var introImgEl = document.getElementById("intro-img");
    var firstArch = (activeStory().archives || [])[0];
    if (introImgEl && firstArch && firstArch.image) introImgEl.src = storyImg(firstArch.image);
    textEl.textContent = "";
    contBtn.classList.add("hidden");

    var lines = activeStory().briefing || [];
    var i = 0;
    function typeStory() {
      if (i >= lines.length) {
        contBtn.classList.remove("hidden");
        return;
      }
      var line = lines[i];
      textEl.textContent += line + "\n";
      i++;
      if (line !== "") SFX.tick();
      setTimeout(typeStory, line === "" ? 160 : 220 + Math.random() * 120);
    }
    typeStory();

    contBtn.addEventListener("click", function () {
      SFX.select();
      document.getElementById("intro-story").classList.add("hidden");
      document.getElementById("intro-setup").classList.remove("hidden");
      buildSetupCards();
    }, { once: true });

    document.getElementById("setup-begin").addEventListener("click", beginGame);
  }

  // --- Crew setup cards (name + portrait + equipment choices) ---
  function choiceRow(idx, slot, label, opts) {
    var btns = opts.map(function (o) {
      return '<button class="choice-btn" data-player="' + idx + '" data-slot="' + slot + '" data-val="' + o[0] + '">' + o[1] + '</button>';
    }).join("");
    return '<div class="setup-choice"><span class="choice-label">' + label + '</span>' +
      '<div class="choice-opts">' + btns + '</div>' +
      '<img class="choice-pic" id="choicepic-' + slot + '-' + idx + '" alt="" draggable="false" hidden>' +
      '</div>';
  }

  function statInput(idx, group, key, label) {
    var p = STATE.players[idx];
    var v = (p[group] && p[group][key] != null) ? p[group][key] : "";
    return '<label class="stat-field"><span>' + label + '</span>' +
      '<input type="number" inputmode="numeric" data-player="' + idx + '" data-group="' + group + '" data-key="' + key + '" value="' + v + '"></label>';
  }

  function rollSection(idx, group, label, hint, keys) {
    var fields = keys.map(function (s) { return statInput(idx, group, s[0], s[1]); }).join("");
    return '<div class="setup-rolls"><div class="ss-head">' + label +
      ' <span class="dice-hint">' + hint + '</span></div><div class="ss-grid">' + fields + '</div></div>';
  }

  function setupCardHTML(idx) {
    return '' +
      '<div class="setup-card" data-setup="' + idx + '">' +
      '<button class="setup-identity" data-setup="' + idx + '">' +
      '<div class="setup-portrait" data-player="' + idx + '">' +
      '<img id="setup-img-' + idx + '" class="setup-img" alt="" draggable="false" hidden>' +
      '<span id="setup-ph-' + idx + '" class="setup-ph">TAP<br>TO SET</span>' +
      '</div>' +
      '<div class="setup-name" id="setup-name-' + idx + '">PLAYER ' + (idx + 1) + '</div>' +
      '</button>' +
      rollSection(idx, "stats", "STATS", "roll 2d10 + 30", STAT_KEYS) +
      rollSection(idx, "saves", "SAVES", "roll 2d10 + 20", SAVE_KEYS) +
      choiceRow(idx, "weapon", "WEAPON", [["chainsword", "CHAINSWORD"], ["revolver", "REVOLVER"]]) +
      choiceRow(idx, "armor", "ARMOR", [["light", "LIGHT ARMOR"], ["leather", "LEATHER JACKET"]]) +
      '<div class="setup-fixed">Everyone also carries: Flashlight &middot; 20ft Rope &middot; First Aid Kit</div>' +
      '</div>';
  }

  function buildSetupCards() {
    var wrap = document.getElementById("setup-cards");
    wrap.innerHTML = setupCardHTML(0) + setupCardHTML(1);
    [0, 1].forEach(function (idx) {
      // Authoritative: rebuild the starting inventory from the loadout so a
      // stale/old saved inventory can't linger into a fresh setup.
      STATE.players[idx].inventory = window.buildLoadout(STATE.players[idx].loadout);
      renderInventory(idx);
      wrap.querySelector('.setup-identity[data-setup="' + idx + '"]').addEventListener("click", function () { openIdentity(idx); });
      wrap.querySelectorAll('.choice-btn[data-player="' + idx + '"]').forEach(function (btn) {
        btn.addEventListener("click", function () { setLoadout(idx, btn.dataset.slot, btn.dataset.val); });
      });
      wrap.querySelectorAll('input[data-player="' + idx + '"][data-group]').forEach(function (inp) {
        inp.addEventListener("input", function () {
          var v = parseInt(inp.value, 10);
          STATE.players[idx][inp.dataset.group][inp.dataset.key] = isNaN(v) ? null : v;
          renderProfile(idx);
          save();
        });
      });
      renderIdentity(idx);
      renderSetupChoices(idx);
    });
    save();
  }

  function setLoadout(idx, slot, val) {
    STATE.players[idx].loadout[slot] = val;
    STATE.players[idx].inventory = window.buildLoadout(STATE.players[idx].loadout);
    renderInventory(idx);
    renderSetupChoices(idx);
    SFX.select();
    save();
  }

  function renderSetupChoices(idx) {
    var lo = STATE.players[idx].loadout || {};
    document.querySelectorAll('.choice-btn[data-player="' + idx + '"]').forEach(function (btn) {
      btn.classList.toggle("selected", lo[btn.dataset.slot] === btn.dataset.val);
    });
    ["weapon", "armor"].forEach(function (slot) {
      var img = document.getElementById("choicepic-" + slot + "-" + idx);
      if (!img) return;
      var catalogKey = (CHOICE_CATALOG_KEY[slot] || {})[lo[slot]];
      var src = catalogKey && window.ITEMS && window.ITEMS[catalogKey] ? window.ITEMS[catalogKey].photo : null;
      if (src) { img.src = src; img.hidden = false; } else { img.hidden = true; }
    });
  }

  function beginGame() {
    STATE.started = true;
    save();
    SFX.bootDone();
    document.getElementById("intro").classList.add("hidden");
    document.getElementById("app").classList.remove("hidden");
    initEcgMonitors();   // now visible -> canvases have a size
    renderAll();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", runBootSequence);
  } else {
    runBootSequence();
  }
})();
