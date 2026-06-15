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

  function initMenu() {
    document.querySelectorAll(".mode-card").forEach(function (card) {
      if (card.classList.contains("disabled")) return;
      card.addEventListener("click", function () {
        const href = card.dataset.href;
        if (!href) return;
        SFX.select();
        if (navigator.vibrate) navigator.vibrate(12);
        card.classList.add("launching");
        setTimeout(function () { window.location.href = href; }, 260);
      });
    });
  }

  initMenu();

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", runBootSequence);
  } else {
    runBootSequence();
  }
})();
