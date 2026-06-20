/* ============================================
   CARC-7A — Launcher / OS Select Menu
   Boots, then routes to a game version.
   ============================================ */

(function () {
  "use strict";

  const BOOT_LINES = [
    "MONARCH CORP. BIOS v4.2.1",
    "COPYRIGHT 2371 MONARCH CORPORATION",
    "",
    "DETECTING TERMINAL PARTITIONS...",
    "  PARTITION 1: SOLO OPERATIONS ..... OK",
    "  PARTITION 2: CO-OP OPERATIONS ..... OK",
    "",
    "MOUNTING CREW TERMINAL OS...",
    "  KERNEL: WARDEN v2.4.1 ............ LOADED",
    "",
    "SELECT OPERATIONS MODE.",
  ];

  function runBootSequence() {
    const bootScreen = document.getElementById("boot-screen");
    const bootLog = document.getElementById("boot-log");
    const menu = document.getElementById("menu");

    // Init audio on first interaction during boot
    bootScreen.addEventListener("touchstart", function () { SFX.ensureContext(); }, { once: true });
    bootScreen.addEventListener("click", function () { SFX.ensureContext(); }, { once: true });

    let lineIndex = 0;

    function typeLine() {
      if (lineIndex >= BOOT_LINES.length) {
        SFX.bootDone();
        setTimeout(function () {
          bootScreen.classList.add("done");
          menu.classList.remove("hidden");
          setTimeout(function () { bootScreen.remove(); }, 800);
        }, 500);
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

  function launchTo(card, href) {
    SFX.select();
    if (navigator.vibrate) navigator.vibrate(12);
    card.classList.add("launching");
    setTimeout(function () { window.location.href = href; }, 260);
  }

  function escapeHtml(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function buildAdventureList() {
    var wrap = document.getElementById("adventure-modes");
    var stories = window.STORIES || {};
    var ids = Object.keys(stories);
    if (!ids.length) {
      wrap.innerHTML = '<div class="mode-desc" style="padding:20px;">NO ADVENTURES INSTALLED.</div>';
      return;
    }
    wrap.innerHTML = ids.map(function (id) {
      var s = stories[id] || {};
      return '<button class="mode-card" data-href="duo.html?story=' + encodeURIComponent(id) + '">' +
        '<div class="mode-glyph">' +
          '<svg viewBox="0 0 24 24"><path d="M4 4h13l3 3v13H4z"/><path d="M8 9h8M8 13h8M8 17h5"/></svg>' +
        '</div>' +
        '<div class="mode-info">' +
          '<div class="mode-name">' + escapeHtml(s.title || id) + '</div>' +
          '<div class="mode-desc">' + escapeHtml(s.blurb || "") + '</div>' +
        '</div>' +
        '<div class="mode-go">&#9656;</div>' +
      '</button>';
    }).join("");
    wrap.querySelectorAll(".mode-card").forEach(function (card) {
      card.addEventListener("click", function () { launchTo(card, card.dataset.href); });
    });
  }

  function showAdventure() {
    SFX.select();
    buildAdventureList();
    document.getElementById("menu").classList.add("hidden");
    document.getElementById("adventure").classList.remove("hidden");
  }

  function initMenu() {
    document.querySelectorAll("#menu .mode-card").forEach(function (card) {
      if (card.classList.contains("disabled")) return;
      card.addEventListener("click", function () {
        if (card.dataset.href) {
          launchTo(card, card.dataset.href);
        } else if (card.dataset.screen === "adventure") {
          showAdventure();
        }
      });
    });

    var back = document.getElementById("adventure-back");
    if (back) back.addEventListener("click", function () {
      SFX.select();
      document.getElementById("adventure").classList.add("hidden");
      document.getElementById("menu").classList.remove("hidden");
    });
  }

  initMenu();

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", runBootSequence);
  } else {
    runBootSequence();
  }
})();
