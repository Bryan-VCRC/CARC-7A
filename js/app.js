/* ============================================
   CARC-7A — Main Application
   ============================================ */

(function () {
  "use strict";

  // --- Boot Sequence ---
  const BOOT_LINES = [
    "MONARCH CORP. BIOS v4.2.1",
    "COPYRIGHT 2371 MONARCH CORPORATION",
    "",
    "INITIALIZING HARDWARE...",
    "  CPU: MONARCH M-7700 .............. OK",
    "  MEM: 2048 TB QUANTUM RAM ......... OK",
    "  NET: TIGHTBEAM ARRAY ............. OK",
    "  SENSORS: ARRAY 1-6 ............... OK",
    "",
    "LOADING CREW TERMINAL OS...",
    "  KERNEL: WARDEN v2.4.1 ............ LOADED",
    "  SECURITY PROTOCOLS ............... ACTIVE",
    "  ENCRYPTION LAYER ................. AES-QUANTUM",
    "",
    `SHIP DESIGNATION: ${SHIP_DATA.name}`,
    `CLASS: ${SHIP_DATA.designation}`,
    "",
    "AUTHENTICATING CREW MEMBER......... GRANTED",
    "",
    "TERMINAL READY.",
    "WELCOME ABOARD.",
  ];

  function runBootSequence() {
    const bootScreen = document.getElementById("boot-screen");
    const bootLog = document.getElementById("boot-log");
    const app = document.getElementById("app");

    // Init audio on first tap anywhere during boot
    bootScreen.addEventListener("touchstart", function () { SFX.ensureContext(); }, { once: true });
    bootScreen.addEventListener("click", function () { SFX.ensureContext(); }, { once: true });

    let lineIndex = 0;

    function typeLine() {
      if (lineIndex >= BOOT_LINES.length) {
        SFX.bootDone();
        setTimeout(() => {
          bootScreen.classList.add("done");
          app.classList.remove("hidden");
          setTimeout(() => bootScreen.remove(), 800);
          initApp();
        }, 600);
        return;
      }

      const line = BOOT_LINES[lineIndex];
      bootLog.textContent += line + "\n";
      bootLog.parentElement.scrollTop = bootLog.parentElement.scrollHeight;
      lineIndex++;

      // Tick sound on non-empty lines
      if (line !== "") SFX.tick();

      const delay = line === "" ? 100 : 40 + Math.random() * 60;
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
      clockEl.textContent = `${h}:${m}:${s}`;
    }
    update();
    setInterval(update, 1000);
  }

  // --- Navigation ---
  function initNavigation() {
    const tabs = document.querySelectorAll(".nav-tab");
    const panels = document.querySelectorAll(".panel");

    tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        const target = tab.dataset.panel;

        tabs.forEach((t) => t.classList.remove("active"));
        tab.classList.add("active");

        panels.forEach((p) => {
          p.classList.remove("active");
          // Also hide any open detail views
          const detail = p.querySelector(".detail-view");
          if (detail) detail.classList.add("hidden");
          const list = p.querySelector(".entry-list, .inventory-grid, .media-grid");
          if (list) list.style.display = "";
          const header = p.querySelector(".panel-header");
          if (header) header.style.display = "";
        });

        document.getElementById(`panel-${target}`).classList.add("active");

        // Re-fit map when switching to map tab (needs visible dimensions)
        if (target === "map" && window.refitShipMap) {
          requestAnimationFrame(() => window.refitShipMap());
        }

        SFX.tab();
        if (navigator.vibrate) navigator.vibrate(10);
      });
    });

    // Back buttons
    document.querySelectorAll(".back-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        SFX.back();
        const panel = btn.dataset.back;
        const detailView = btn.closest(".detail-view");
        detailView.classList.add("hidden");

        const panelEl = document.getElementById(`panel-${panel}`);
        const list = panelEl.querySelector(".entry-list, .inventory-grid, .media-grid");
        if (list) list.style.display = "";
        const header = panelEl.querySelector(".panel-header");
        if (header) header.style.display = "";
      });
    });
  }

  // --- Journal ---
  function renderJournal(filter = "all") {
    const list = document.getElementById("journal-list");
    const entries = filter === "all"
      ? JOURNAL_ENTRIES
      : JOURNAL_ENTRIES.filter((e) => e.type === filter);

    if (entries.length === 0) {
      list.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📭</div>
          <div class="empty-text">NO ENTRIES FOUND</div>
        </div>`;
      return;
    }

    const icons = {
      memo: "📋",
      clue: "🔍",
      log: "📅",
      document: "📄",
      distress: "🆘",
    };

    list.innerHTML = entries
      .map(
        (entry) => `
      <div class="entry-card type-${entry.type}" data-id="${entry.id}">
        <div class="entry-icon">${icons[entry.type] || "📋"}</div>
        <div class="entry-info">
          <div class="entry-title">${entry.title}</div>
          <div class="entry-meta">
            <span class="entry-tag">${entry.type}</span>
            <span>${entry.date}</span>
            <span>${entry.author}</span>
          </div>
        </div>
      </div>`
      )
      .join("");

    // Entry click handlers
    list.querySelectorAll(".entry-card").forEach((card) => {
      card.addEventListener("click", () => {
        SFX.select();
        const entry = JOURNAL_ENTRIES.find((e) => e.id === card.dataset.id);
        if (entry) showJournalDetail(entry);
      });
    });
  }

  function showJournalDetail(entry) {
    const detail = document.getElementById("journal-detail");
    const content = document.getElementById("journal-detail-content");

    const classMap = {
      classified: "classified",
      restricted: "restricted",
      open: "open",
    };

    content.innerHTML = `
      <div class="doc-header">
        <div class="doc-title">${entry.title}</div>
        <div class="doc-meta">
          <span>DATE: ${entry.date}</span>
          <span>AUTHOR: ${entry.author}</span>
          <span>
            <span class="classification ${classMap[entry.classification] || "open"}">
              ${(entry.classification || "OPEN").toUpperCase()}
            </span>
          </span>
        </div>
      </div>
      <div class="doc-body">${escapeHtml(entry.body)}</div>`;

    // Hide list, show detail
    document.getElementById("journal-list").style.display = "none";
    document.querySelector("#panel-journal .panel-header").style.display = "none";
    detail.classList.remove("hidden");
  }

  // --- Inventory ---
  function renderInventory(filter = "all") {
    const grid = document.getElementById("inventory-grid");
    const items = filter === "all"
      ? INVENTORY_ITEMS
      : INVENTORY_ITEMS.filter((i) => i.type === filter);

    if (items.length === 0) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column: 1/-1;">
          <div class="empty-icon">📦</div>
          <div class="empty-text">CARGO BAY EMPTY</div>
        </div>`;
      return;
    }

    grid.innerHTML = items
      .map(
        (item) => `
      <div class="inv-card type-${item.type}" data-id="${item.id}">
        <div class="inv-icon">${renderIcon(item.icon)}</div>
        <div class="inv-name">${item.name}</div>
        ${item.quantity > 1 ? `<div class="inv-qty">x${item.quantity}</div>` : ""}
      </div>`
      )
      .join("");

    grid.querySelectorAll(".inv-card").forEach((card) => {
      card.addEventListener("click", () => {
        SFX.select();
        const item = INVENTORY_ITEMS.find((i) => i.id === card.dataset.id);
        if (item) showInventoryDetail(item);
      });
    });
  }

  function showInventoryDetail(item) {
    const detail = document.getElementById("inventory-detail");
    const content = document.getElementById("inventory-detail-content");

    let statsHtml = "";
    if (item.stats) {
      const rows = Object.entries(item.stats)
        .map(
          ([k, v]) => `
        <div class="stat-row">
          <span class="stat-label">${k}</span>
          <span class="stat-value">${v}</span>
        </div>`
        )
        .join("");
      statsHtml = `<div class="item-stats">${rows}</div>`;
    }

    // Ammo display + action buttons for weapons
    let ammoHtml = "";
    if (item.ammo) {
      ammoHtml = buildAmmoPanel(item);
    }

    // Consumable panel
    let consumableHtml = "";
    if (item.consumable) {
      consumableHtml = buildConsumablePanel(item);
    }

    content.innerHTML = `
      <div class="doc-header">
        <div class="doc-title">${renderIcon(item.icon, 'detail-icon')} ${item.name}</div>
        <div class="doc-meta">
          <span>TYPE: ${item.type.toUpperCase()}</span>
          <span>QTY: ${item.quantity}</span>
        </div>
      </div>
      <div class="doc-body">${escapeHtml(item.description)}</div>
      ${statsHtml}
      ${ammoHtml}
      ${consumableHtml}`;

    // Wire up weapon action buttons
    if (item.ammo) {
      wireAmmoActions(item, content);
    }

    // Wire up consumable actions
    if (item.consumable) {
      wireConsumableActions(item, content);
    }

    document.getElementById("inventory-grid").style.display = "none";
    document.querySelector("#panel-inventory .panel-header").style.display = "none";
    detail.classList.remove("hidden");
  }

  function buildAmmoPanel(item) {
    const a = item.ammo;
    const totalRemaining = a.current + (a.spareMags * a.magCapacity);
    const emptyClass = a.current === 0 ? " ammo-empty" : "";
    const lowClass = a.current > 0 && a.current <= Math.ceil(a.magCapacity * 0.25) ? " ammo-low" : "";

    let fireButtons = "";
    if (item.fireModes.includes("semi")) {
      fireButtons += `<button class="weapon-action-btn fire-semi-btn" data-action="semi">FIRE — SEMI</button>`;
    }
    if (item.fireModes.includes("burst")) {
      fireButtons += `<button class="weapon-action-btn fire-burst-btn" data-action="burst">FIRE — BURST (×3)</button>`;
    }

    const reloadDisabled = a.spareMags <= 0 || a.current === a.magCapacity ? " disabled" : "";

    return `
      <div class="ammo-panel">
        <div class="ammo-header">AMMUNITION</div>
        <div class="ammo-display">
          <div class="ammo-current${emptyClass}${lowClass}">
            <span class="ammo-count" id="ammo-count">${a.current}</span>
            <span class="ammo-sep">/</span>
            <span class="ammo-cap">${a.magCapacity}</span>
          </div>
          <div class="ammo-label">${a.magLabel}</div>
        </div>
        <div class="ammo-reserve">
          <span class="ammo-reserve-label">SPARE ${a.spareLabel.toUpperCase()}</span>
          <span class="ammo-reserve-value" id="ammo-spare">${a.spareMags}</span>
        </div>
        <div class="ammo-reserve">
          <span class="ammo-reserve-label">TOTAL REMAINING</span>
          <span class="ammo-reserve-value" id="ammo-total">${totalRemaining}</span>
        </div>
        <div class="weapon-actions">
          ${fireButtons}
          <button class="weapon-action-btn reload-btn" data-action="reload"${reloadDisabled}>RELOAD ${a.magLabel.toUpperCase()}</button>
          <button class="weapon-action-btn found-btn" data-action="found-mag">+ FOUND ${a.spareLabel.toUpperCase().slice(0, -1)}</button>
        </div>
        <div class="ammo-log" id="ammo-log"></div>
      </div>`;
  }

  function wireAmmoActions(item, container) {
    container.querySelectorAll(".weapon-action-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
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

    if (spent === 1) {
      SFX.gunshot();
      logAmmoEvent(`FIRED 1 ROUND — ${a.current} remaining`);
    } else {
      SFX.burst(spent);
      logAmmoEvent(`BURST FIRE — ${spent} ROUNDS SPENT — ${a.current} remaining`);
    }

    updateAmmoDisplay(item);
    SaveSystem.save();
    const vibePattern = Array.from({ length: spent }, (_, i) => i === 0 ? 30 : [40, 30]).flat();
    if (navigator.vibrate) navigator.vibrate(vibePattern);
  }

  function reloadWeapon(item) {
    const a = item.ammo;
    if (a.spareMags <= 0) {
      SFX.empty();
      logAmmoEvent("NO SPARE " + a.spareLabel.toUpperCase());
      return;
    }
    if (a.current === a.magCapacity) {
      logAmmoEvent(a.magLabel.toUpperCase() + " ALREADY FULL");
      return;
    }

    SFX.reload();
    const oldRounds = a.current;
    a.spareMags--;
    a.current = a.magCapacity;

    if (oldRounds > 0) {
      logAmmoEvent(`SWAPPED ${a.magLabel.toUpperCase()} — ${oldRounds} ROUNDS DISCARDED`);
    } else {
      logAmmoEvent(`${a.magLabel.toUpperCase()} LOADED — ${a.magCapacity} ROUNDS`);
    }

    updateAmmoDisplay(item);
    SaveSystem.save();
    if (navigator.vibrate) navigator.vibrate([20, 80, 40]);
  }

  function foundMag(item) {
    const a = item.ammo;
    a.spareMags++;
    SFX.use();
    SaveSystem.save();
    showInventoryDetail(item);
    if (navigator.vibrate) navigator.vibrate([15, 50, 15]);
  }

  function updateAmmoDisplay(item) {
    const a = item.ammo;
    const totalRemaining = a.current + (a.spareMags * a.magCapacity);

    const countEl = document.getElementById("ammo-count");
    const spareEl = document.getElementById("ammo-spare");
    const totalEl = document.getElementById("ammo-total");

    if (countEl) countEl.textContent = a.current;
    if (spareEl) spareEl.textContent = a.spareMags;
    if (totalEl) totalEl.textContent = totalRemaining;

    // Update styling
    const display = countEl ? countEl.closest(".ammo-current") : null;
    if (display) {
      display.classList.toggle("ammo-empty", a.current === 0);
      display.classList.toggle("ammo-low", a.current > 0 && a.current <= Math.ceil(a.magCapacity * 0.25));
    }

    // Update reload button state
    const reloadBtn = document.querySelector(".reload-btn");
    if (reloadBtn) {
      reloadBtn.disabled = a.spareMags <= 0 || a.current === a.magCapacity;
    }

    // Update fire button styling
    document.querySelectorAll(".fire-semi-btn, .fire-burst-btn").forEach((btn) => {
      btn.classList.toggle("action-dry", a.current <= 0);
    });
  }

  function logAmmoEvent(msg) {
    const log = document.getElementById("ammo-log");
    if (!log) return;
    const line = document.createElement("div");
    line.className = "ammo-log-line";
    line.textContent = "> " + msg;
    log.appendChild(line);
    log.scrollTop = log.scrollHeight;
    // Keep last 6 lines
    while (log.children.length > 6) {
      log.removeChild(log.firstChild);
    }
  }

  function flashAmmoCount() {
    const el = document.getElementById("ammo-count");
    if (!el) return;
    el.classList.add("flash-warn");
    setTimeout(() => el.classList.remove("flash-warn"), 400);
  }

  // --- Consumables ---

  function buildConsumablePanel(item) {
    const c = item.consumable;
    const emptyClass = c.current === 0 ? " ammo-empty" : "";
    const lowClass = c.current > 0 && c.current <= Math.ceil(c.max * 0.25) ? " ammo-low" : "";
    const disabled = c.current <= 0 ? " disabled" : "";

    // Build pips for visual gauge
    let pipsHtml = "";
    for (let i = 0; i < c.max; i++) {
      const filled = i < c.current ? " filled" : "";
      pipsHtml += `<div class="consumable-pip${filled}"></div>`;
    }

    return `
      <div class="ammo-panel">
        <div class="ammo-header">${c.verb} STATUS</div>
        <div class="ammo-display">
          <div class="ammo-current${emptyClass}${lowClass}">
            <span class="ammo-count" id="consumable-count">${c.current}</span>
            <span class="ammo-sep">/</span>
            <span class="ammo-cap">${c.max}</span>
          </div>
          <div class="ammo-label">${c.unit.toUpperCase()}</div>
        </div>
        <div class="consumable-pips" id="consumable-pips">${pipsHtml}</div>
        <div class="weapon-actions">
          <button class="weapon-action-btn use-btn" data-action="use"${disabled}>${c.useLabel}</button>
          <button class="weapon-action-btn found-btn" data-action="found-supply">+ FOUND ${c.foundLabel || c.unit.toUpperCase()}</button>
        </div>
        <div class="ammo-log" id="consumable-log"></div>
      </div>`;
  }

  function wireConsumableActions(item, container) {
    container.querySelectorAll("[data-action]").forEach((btn) => {
      btn.addEventListener("click", () => {
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
      if (el) {
        el.classList.add("flash-warn");
        setTimeout(() => el.classList.remove("flash-warn"), 400);
      }
      return;
    }

    c.current -= c.perUse;
    SFX.use();
    logConsumableEvent(`${c.verb} — ${c.current} ${c.unit} remaining`);
    updateConsumableDisplay(item);
    SaveSystem.save();
    if (navigator.vibrate) navigator.vibrate([15, 50, 15]);
  }

  function foundSupply(item) {
    const c = item.consumable;
    const amount = c.foundAmount || 1;
    c.current += amount;
    c.max += amount;
    SFX.use();
    const label = c.foundLabel || c.unit.toUpperCase();
    logConsumableEvent(`ACQUIRED ${label} (+${amount}) — ${c.current} total`);

    // Re-render the detail view to reflect new max/pips
    showInventoryDetail(item);
    SaveSystem.save();
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

    // Update pips
    const pips = document.querySelectorAll("#consumable-pips .consumable-pip");
    pips.forEach((pip, i) => {
      pip.classList.toggle("filled", i < c.current);
    });

    // Update button
    const useBtn = document.querySelector(".use-btn");
    if (useBtn) {
      useBtn.disabled = c.current <= 0;
      useBtn.classList.toggle("action-dry", c.current <= 0);
    }
  }

  function logConsumableEvent(msg) {
    const log = document.getElementById("consumable-log");
    if (!log) return;
    const line = document.createElement("div");
    line.className = "ammo-log-line";
    line.textContent = "> " + msg;
    log.appendChild(line);
    log.scrollTop = log.scrollHeight;
    while (log.children.length > 6) {
      log.removeChild(log.firstChild);
    }
  }

  // --- Media ---
  function renderMedia(filter = "all") {
    const grid = document.getElementById("media-grid");
    const files = filter === "all"
      ? MEDIA_FILES
      : MEDIA_FILES.filter((m) => m.type === filter);

    if (files.length === 0) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column: 1/-1;">
          <div class="empty-icon">🗃️</div>
          <div class="empty-text">NO ARCHIVE FILES FOUND</div>
        </div>`;
      return;
    }

    grid.innerHTML = files
      .map(
        (file) => `
      <div class="media-card" data-id="${file.id}">
        <div class="media-thumb">
          <img src="${file.thumb || file.src}" alt="${file.name}" onerror="this.style.display='none'">
          ${
            file.type === "video"
              ? `<div class="play-overlay"><div class="play-icon">&#9654;</div></div>`
              : ""
          }
        </div>
        <div class="media-info">
          <div class="media-name">${file.name}</div>
          <div class="media-meta">${file.type} — ${file.date}</div>
        </div>
      </div>`
      )
      .join("");

    grid.querySelectorAll(".media-card").forEach((card) => {
      card.addEventListener("click", () => {
        SFX.select();
        const file = MEDIA_FILES.find((m) => m.id === card.dataset.id);
        if (file) showMediaViewer(file);
      });
    });
  }

  function showMediaViewer(file) {
    const viewer = document.getElementById("media-viewer");
    const content = document.getElementById("media-viewer-content");

    let mediaEl = "";
    if (file.type === "image") {
      mediaEl = `<img src="${file.src}" alt="${file.name}" onerror="this.alt='[CORRUPTED DATA — FILE NOT FOUND]'">`;
    } else if (file.type === "video") {
      mediaEl = `<video controls playsinline src="${file.src}">
        Your terminal does not support video playback.
      </video>`;
    }

    content.innerHTML = `
      <div class="media-title">${file.name}</div>
      ${mediaEl}
      <div class="media-desc">${escapeHtml(file.description)}</div>
      <div class="doc-meta" style="justify-content: center;">
        <span>DATE: ${file.date}</span>
        <span>TYPE: ${file.type.toUpperCase()}</span>
      </div>`;

    document.getElementById("media-grid").style.display = "none";
    document.querySelector("#panel-media .panel-header").style.display = "none";
    viewer.classList.remove("hidden");
  }

  // --- Filters ---
  function initFilters() {
    document.getElementById("journal-filter").addEventListener("change", (e) => {
      SFX.filter();
      renderJournal(e.target.value);
    });

    document.getElementById("inventory-filter").addEventListener("change", (e) => {
      SFX.filter();
      renderInventory(e.target.value);
    });

    document.getElementById("media-filter").addEventListener("change", (e) => {
      SFX.filter();
      renderMedia(e.target.value);
    });
  }

  // --- Entry Count ---
  function updateEntryCount() {
    const total = JOURNAL_ENTRIES.length + INVENTORY_ITEMS.length + MEDIA_FILES.length;
    document.getElementById("entry-count").textContent = total;
  }

  // --- ECG Health Monitor ---
  var ecgCanvas = null;
  var ecgCtx = null;
  var ecgX = 0;
  var ecgAnimId = null;
  var ecgWoundState = 0;
  var ecgLastTime = 0;

  // ECG waveform shape: flat → small bump → sharp spike → dip → recovery → flat
  // Returns y offset (0 = baseline) for a given phase position (0-1)
  function ecgBeat(t) {
    // P wave (small bump)
    if (t < 0.1) return 0;
    if (t < 0.18) { var p = (t - 0.1) / 0.08; return -Math.sin(p * Math.PI) * 0.15; }
    if (t < 0.25) return 0;
    // QRS complex (sharp spike)
    if (t < 0.28) { var q = (t - 0.25) / 0.03; return q * 0.1; }
    if (t < 0.32) { var r = (t - 0.28) / 0.04; return 0.1 - r * 1.1; }
    if (t < 0.36) { var s = (t - 0.32) / 0.04; return -1.0 + s * 1.15; }
    if (t < 0.40) { var u = (t - 0.36) / 0.04; return 0.15 - u * 0.15; }
    // T wave (recovery bump)
    if (t < 0.55) { var tw = (t - 0.40) / 0.15; return -Math.sin(tw * Math.PI) * 0.2; }
    return 0;
  }

  function getEcgColor(wounds, maxWounds) {
    if (wounds === 0) return { color: "#00ff9d", glow: "rgba(0, 255, 157, 0.4)", label: "FINE" };
    if (wounds === 1) return { color: "#ffcc00", glow: "rgba(255, 204, 0, 0.4)", label: "CAUTION" };
    if (wounds >= maxWounds) return { color: "#ff3344", glow: "rgba(255, 51, 68, 0.5)", label: "CRITICAL" };
    return { color: "#ff6b35", glow: "rgba(255, 107, 53, 0.4)", label: "DANGER" };
  }

  function getEcgSpeed(wounds) {
    // Heartbeat gets faster with more wounds
    if (wounds === 0) return 1.0;
    if (wounds === 1) return 1.4;
    return 1.9;
  }

  function initEcgMonitor() {
    ecgCanvas = document.getElementById("ecg-canvas");
    if (!ecgCanvas) return;
    ecgCtx = ecgCanvas.getContext("2d");
    // Set canvas resolution to match display
    ecgCanvas.width = 240;
    ecgCanvas.height = 100;
    ecgX = 0;
    ecgLastTime = performance.now();
    // Clear to black
    ecgCtx.fillStyle = "rgba(0, 0, 0, 1)";
    ecgCtx.fillRect(0, 0, ecgCanvas.width, ecgCanvas.height);
    ecgAnimId = requestAnimationFrame(drawEcg);
  }

  function drawEcg(now) {
    if (!ecgCtx) return;
    var w = ecgCanvas.width;
    var h = ecgCanvas.height;
    var dt = (now - ecgLastTime) / 1000;
    ecgLastTime = now;

    var speed = getEcgSpeed(ecgWoundState) * 120; // pixels per second
    var advance = speed * dt;

    var state = getEcgColor(ecgWoundState, PLAYER_STATS.woundsMax);
    var midY = h * 0.5;
    var amp = h * 0.35;

    // The beat cycle length in pixels
    var cycleLen = w * 0.8;

    // Draw column by column for the advance amount
    var steps = Math.ceil(advance);
    for (var s = 0; s < steps; s++) {
      // Erase ahead (dark fade)
      var clearX = (ecgX + 8) % w;
      ecgCtx.fillStyle = "rgba(0, 0, 0, 1)";
      ecgCtx.fillRect(clearX, 0, 3, h);

      // Phase within the beat cycle
      var phase = (ecgX % cycleLen) / cycleLen;
      var yOff = ecgBeat(phase);
      var y = midY + yOff * amp;

      // Draw the dot
      ecgCtx.fillStyle = state.color;
      ecgCtx.fillRect(ecgX % w, y, 2, 2);

      // Glow effect
      ecgCtx.shadowColor = state.glow;
      ecgCtx.shadowBlur = 6;
      ecgCtx.fillRect(ecgX % w, y, 2, 2);
      ecgCtx.shadowBlur = 0;

      ecgX = (ecgX + 1) % w;
    }

    ecgAnimId = requestAnimationFrame(drawEcg);
  }

  function updateHealthMonitor(wounds, maxWounds) {
    ecgWoundState = wounds;
    var state = getEcgColor(wounds, maxWounds);
    var label = document.getElementById("monitor-label");
    if (label) {
      label.textContent = state.label;
      label.style.color = state.color;
    }
    var monitor = document.getElementById("health-monitor");
    if (monitor) {
      monitor.style.borderColor = state.color;
    }
  }

  // --- Player Stats ---
  function renderPlayerStats() {
    var p = PLAYER_STATS;

    document.getElementById("stat-hp").textContent = p.hp;
    document.getElementById("stat-hp-max").textContent = p.hpMax;
    document.getElementById("stat-wounds").textContent = p.wounds;
    document.getElementById("stat-wounds-max").textContent = p.woundsMax;
    document.getElementById("stat-stress").textContent = p.stress;
    document.getElementById("stat-stress-max").textContent = p.stressMax;

    renderPips("pips-hp", p.hp, p.hpMax);
    renderPips("pips-wounds", p.wounds, p.woundsMax);
    renderPips("pips-stress", p.stress, p.stressMax);

    // Critical state thresholds
    var hpEl = document.querySelector(".stat-hp");
    hpEl.classList.toggle("critical", p.hp <= Math.ceil(p.hpMax * 0.25) && p.hp > 0);

    var wndEl = document.querySelector(".stat-wounds");
    wndEl.classList.toggle("critical", p.wounds >= p.woundsMax);

    var stsEl = document.querySelector(".stat-stress");
    stsEl.classList.toggle("critical", p.stress >= p.stressMax);

    // Health monitor
    updateHealthMonitor(p.wounds, p.woundsMax);
  }

  function renderPips(containerId, current, max) {
    var el = document.getElementById(containerId);
    var html = "";
    for (var i = 0; i < max; i++) {
      html += '<div class="stat-pip' + (i < current ? ' filled' : '') + '"></div>';
    }
    el.innerHTML = html;
  }

  // --- Death State ---
  function checkDeathState() {
    var dead = PLAYER_STATS.wounds >= PLAYER_STATS.woundsMax;
    document.getElementById("death-overlay").classList.toggle("hidden", !dead);
  }

  // --- Wound Log Modal ---
  function renderWoundLog() {
    var list = document.getElementById("wound-log-list");
    var log = PLAYER_STATS.woundLog;
    if (!log || log.length === 0) {
      list.innerHTML = '<div class="wound-log-empty">No wounds recorded.</div>';
      return;
    }
    var html = "";
    log.forEach(function (entry, i) {
      html += '<div class="wound-log-entry">' +
        '<div class="wound-log-number">WOUND #' + (i + 1) + '</div>' +
        '<div class="wound-log-text">' + escapeHtml(entry) + '</div>' +
        '</div>';
    });
    list.innerHTML = html;
  }

  function initWoundModal() {
    var modal = document.getElementById("wound-modal");
    var trigger = document.getElementById("wounds-trigger");
    var closeBtn = document.getElementById("wound-modal-close");
    var backdrop = modal.querySelector(".wound-modal-backdrop");

    trigger.addEventListener("click", function () {
      SFX.select();
      renderWoundLog();
      modal.classList.remove("hidden");
    });

    closeBtn.addEventListener("click", function () {
      SFX.back();
      modal.classList.add("hidden");
    });

    backdrop.addEventListener("click", function () {
      SFX.back();
      modal.classList.add("hidden");
    });
  }

  // --- Helpers ---
  function renderIcon(icon, extraClass) {
    if (icon && icon.endsWith('.svg')) {
      const cls = extraClass ? ` class="${extraClass}"` : '';
      return `<img src="${icon}"${cls} alt="" draggable="false">`;
    }
    return icon || '';
  }

  function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  // --- Init ---
  function initApp() {
    // Load saved game state before rendering
    if (window.SaveSystem) SaveSystem.load();

    startClock();
    initNavigation();
    initFilters();
    initResetButton();
    renderPlayerStats();
    initEcgMonitor();
    checkDeathState();
    initWoundModal();
    renderJournal();
    renderInventory();
    renderMedia();
    updateEntryCount();
    if (window.initShipMap) window.initShipMap();
  }

  function initResetButton() {
    const btn = document.getElementById("reset-game-btn");
    const modal = document.getElementById("reset-modal");
    const cancelBtn = document.getElementById("reset-cancel");
    const confirmBtn = document.getElementById("reset-confirm");
    const backdrop = modal.querySelector(".reset-modal-backdrop");

    btn.addEventListener("click", () => {
      SFX.select();
      modal.classList.remove("hidden");
    });

    cancelBtn.addEventListener("click", () => {
      SFX.back();
      modal.classList.add("hidden");
    });

    backdrop.addEventListener("click", () => {
      SFX.back();
      modal.classList.add("hidden");
    });

    confirmBtn.addEventListener("click", () => {
      SaveSystem.clear();
      SFX.bootDone();
      modal.classList.add("hidden");
      location.reload();
    });
  }

  // --- Admin Command Channel ---
  const adminChannel = new BroadcastChannel("carc7a_admin");
  let fearDrone = null;

  adminChannel.onmessage = function (e) {
    const cmd = e.data;
    if (cmd.type === "fear") {
      if (cmd.active) {
        document.body.classList.add("fear-active");
        SFX.fearStart();
        startFearDrone();
      } else {
        document.body.classList.remove("fear-active");
        stopFearDrone();
      }
    } else if (cmd.type === "panic") {
      handlePanic(cmd.action);
    } else if (cmd.type === "stats") {
      // Admin updated player stats
      if (cmd.stat && cmd.value !== undefined) {
        PLAYER_STATS[cmd.stat] = cmd.value;
        renderPlayerStats();
        checkDeathState();
        SaveSystem.save();
      }
    } else if (cmd.type === "wound-log") {
      if (cmd.action === "add" && cmd.text) {
        PLAYER_STATS.woundLog.push(cmd.text);
        SaveSystem.save();
      } else if (cmd.action === "remove" && cmd.index !== undefined) {
        PLAYER_STATS.woundLog.splice(cmd.index, 1);
        SaveSystem.save();
      }
    } else if (cmd.type === "death") {
      checkDeathState();
    }
  };

  function handlePanic(action) {
    if (action === "glitch") panicGlitch();
    else if (action === "blackout") panicBlackout();
    else if (action === "corrupt") panicCorrupt();
    else if (action === "reboot") panicReboot();
  }

  function panicGlitch() {
    SFX.fearStart();
    document.body.classList.add("panic-glitch");
    if (navigator.vibrate) navigator.vibrate([50, 30, 50, 30, 80, 40, 100]);
    setTimeout(function () {
      document.body.classList.remove("panic-glitch");
    }, 600);
  }

  function panicBlackout() {
    var overlay = document.getElementById("blackout-overlay");
    overlay.classList.add("active");
    SFX.panicHit();
    if (navigator.vibrate) navigator.vibrate(200);
    // Flicker back after a beat
    setTimeout(function () {
      overlay.classList.remove("active");
    }, 1500);
    setTimeout(function () {
      overlay.classList.add("active");
    }, 1700);
    setTimeout(function () {
      overlay.classList.remove("active");
    }, 1900);
    setTimeout(function () {
      overlay.classList.add("active");
    }, 2000);
    setTimeout(function () {
      overlay.classList.remove("active");
    }, 3200);
  }

  function panicCorrupt() {
    SFX.panicHit();
    document.body.classList.add("panic-corrupt");
    if (navigator.vibrate) navigator.vibrate([80, 50, 80, 50, 80]);
    // Scramble visible text briefly
    var clock = document.getElementById("clock");
    var saved = clock.textContent;
    clock.textContent = "E̵R̶R̸O̷R̵";
    setTimeout(function () {
      document.body.classList.remove("panic-corrupt");
      clock.textContent = saved;
    }, 1000);
  }

  function panicReboot() {
    var overlay = document.getElementById("reboot-overlay");
    var bar = document.getElementById("reboot-bar");
    overlay.classList.add("active");
    stopFearDrone();
    SFX.panicHit();
    if (navigator.vibrate) navigator.vibrate(300);

    bar.style.width = "0%";
    var progress = 0;
    var interval = setInterval(function () {
      // Erratic progress
      progress += 2 + Math.random() * 8;
      if (progress > 100) progress = 100;
      bar.style.width = progress + "%";

      if (progress >= 100) {
        clearInterval(interval);
        setTimeout(function () {
          overlay.classList.remove("active");
          bar.style.width = "0%";
          // Only re-engage if fear mode is still active
          if (document.body.classList.contains("fear-active")) {
            startFearDrone();
          }
        }, 800);
      }
    }, 150);
  }

  function startFearDrone() {
    if (fearDrone) return;
    if (!SFX.ensureContext()) return;

    // Continuous low rumble + high-freq whine
    const ctx = SFX._ctx();
    if (!ctx) return;

    // Sub bass rumble
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

    // High dissonant whine
    const whine = ctx.createOscillator();
    whine.type = "sine";
    whine.frequency.value = 4200;
    const whineGain = ctx.createGain();
    whineGain.gain.value = 0.03;
    whine.connect(whineGain);
    whineGain.connect(ctx.destination);

    // Static hiss
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

    fearDrone = { lfo, bass, whine, noise, bassGain, whineGain, noiseGain };
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

  // Start boot sequence on load
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", runBootSequence);
  } else {
    runBootSequence();
  }
})();
