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

  function isUserStory(id) {
    return !!(window.UserStories && window.UserStories.isUser(id));
  }

  function storyCardHtml(id, s, isUser) {
    return '<button class="mode-card" data-href="duo.html?story=' + encodeURIComponent(id) + '">' +
      '<div class="mode-glyph">' +
        '<svg viewBox="0 0 24 24"><path d="M4 4h13l3 3v13H4z"/><path d="M8 9h8M8 13h8M8 17h5"/></svg>' +
      '</div>' +
      '<div class="mode-info">' +
        '<div class="mode-name">' + escapeHtml(s.title || id) +
          (isUser ? ' <span class="mode-tag user">ADDED</span>' : '') + '</div>' +
        '<div class="mode-desc">' + escapeHtml(s.blurb || "") + '</div>' +
      '</div>' +
      '<div class="mode-go">&#9656;</div>' +
      (isUser ? '<span class="mode-del" data-del="' + escapeHtml(id) + '" title="Remove this story">&#10005;</span>' : '') +
    '</button>';
  }

  function addCardHtml() {
    return '<button class="mode-card add-card" data-screen="author">' +
      '<div class="mode-glyph"><svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg></div>' +
      '<div class="mode-info">' +
        '<div class="mode-name">ADD NEW STORY</div>' +
        '<div class="mode-desc">Author your own adventure from a ChatGPT prompt.</div>' +
      '</div>' +
      '<div class="mode-go">&#9656;</div>' +
    '</button>';
  }

  function buildAdventureList() {
    var wrap = document.getElementById("adventure-modes");
    var stories = window.STORIES || {};
    var ids = Object.keys(stories);
    wrap.innerHTML = ids.map(function (id) {
      return storyCardHtml(id, stories[id] || {}, isUserStory(id));
    }).join("") + addCardHtml();

    wrap.querySelectorAll(".mode-card").forEach(function (card) {
      card.addEventListener("click", function (ev) {
        var del = ev.target.closest && ev.target.closest(".mode-del");
        if (del) { ev.preventDefault(); ev.stopPropagation(); removeStory(del.getAttribute("data-del")); return; }
        if (card.dataset.screen === "author") { showAuthor(); return; }
        if (card.dataset.href) launchTo(card, card.dataset.href);
      });
    });
  }

  function removeStory(id) {
    var s = (window.STORIES || {})[id] || {};
    if (!window.confirm('Remove "' + (s.title || id) + '"?\n\nImages in data/stories/' + id + '/ are left untouched.')) return;
    if (window.UserStories) window.UserStories.remove(id);
    SFX.select();
    buildAdventureList();
  }

  // --- Screen switching ---
  function showScreen(name) {
    ["menu", "adventure", "author"].forEach(function (k) {
      var el = document.getElementById(k);
      if (el) el.classList.toggle("hidden", k !== name);
    });
  }

  function showAdventure() {
    SFX.select();
    buildAdventureList();
    showScreen("adventure");
  }

  function showAuthor() {
    SFX.select();
    resetAuthor();
    showScreen("author");
  }

  // --- Author screen ---
  function copyText(txt) {
    if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(txt);
    return new Promise(function (resolve, reject) {
      try {
        var ta = document.createElement("textarea");
        ta.value = txt;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
        resolve();
      } catch (e) { reject(e); }
    });
  }

  function flash(el) {
    if (!el) return;
    el.classList.remove("hidden");
    clearTimeout(el._flashT);
    el._flashT = setTimeout(function () { el.classList.add("hidden"); }, 1800);
  }

  function copyPrompt() {
    SFX.select();
    fetch("docs/story-prompt.txt", { cache: "no-store" })
      .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.text(); })
      .then(function (txt) { return copyText(txt); })
      .then(function () { flash(document.getElementById("author-copied")); })
      .catch(function () { window.alert("Couldn't load the prompt. It lives in docs/story-prompt.txt"); });
  }

  function resetAuthor() {
    var res = document.getElementById("author-result");
    if (res) { res.className = "author-result hidden"; res.innerHTML = ""; }
  }

  function showResult(kind, html) {
    var res = document.getElementById("author-result");
    res.className = "author-result " + kind;
    res.innerHTML = html;
    if (res.scrollIntoView) res.scrollIntoView({ block: "nearest" });
  }

  function listHtml(cls, items) {
    if (!items || !items.length) return "";
    return '<ul class="' + cls + '">' + items.map(function (m) {
      return "<li>" + escapeHtml(m) + "</li>";
    }).join("") + "</ul>";
  }

  function addStory() {
    SFX.select();
    var input = (document.getElementById("author-input").value || "");
    var parsed;
    try {
      parsed = window.StoryImport.parse(input);
    } catch (e) {
      showResult("err", '<div class="ar-title">Couldn’t read that</div><p>' + escapeHtml(e.message) + "</p>");
      return;
    }

    var v = window.StoryImport.validate(parsed.id, parsed.story);
    if ((window.BUILTIN_STORY_IDS || []).indexOf(parsed.id) >= 0) {
      v.errors.unshift('"' + parsed.id + '" is a built-in story id — choose a different id.');
      v.ok = false;
    }
    if (!v.ok) {
      showResult("err", '<div class="ar-title">This story needs fixes</div>' +
        listHtml("ar-errs", v.errors) +
        (v.warnings.length ? '<div class="ar-warn-h">Warnings</div>' + listHtml("ar-warns", v.warnings) : ""));
      return;
    }

    if (!window.UserStories || !window.UserStories.add(parsed.id, parsed.story)) {
      showResult("err", '<div class="ar-title">Couldn’t save</div><p>Browser storage may be full or unavailable.</p>');
      return;
    }

    SFX.bootDone();
    var imgs = v.images || [];
    showResult("ok",
      '<div class="ar-title">Added “' + escapeHtml(parsed.story.title || parsed.id) + '”</div>' +
      "<p>It’s in your adventure list and ready to play.</p>" +
      (imgs.length
        ? '<div class="ar-sub">Drop these images into <code>data/stories/' + escapeHtml(parsed.id) + '/</code></div>' + listHtml("ar-files", imgs)
        : "<p>This story references no images.</p>") +
      (v.warnings.length ? '<div class="ar-warn-h">Heads up</div>' + listHtml("ar-warns", v.warnings) : "") +
      '<div class="ar-actions">' +
        '<button class="author-btn confirm" id="ar-play">PLAY NOW</button>' +
        '<button class="author-btn" id="ar-copy-src">COPY FOR stories.js</button>' +
      "</div>" +
      '<span id="ar-src-copied" class="author-copied hidden">COPIED &#10003;</span>');

    var play = document.getElementById("ar-play");
    if (play) play.addEventListener("click", function () {
      SFX.select();
      window.location.href = "duo.html?story=" + encodeURIComponent(parsed.id);
    });
    var copySrc = document.getElementById("ar-copy-src");
    if (copySrc) copySrc.addEventListener("click", function () {
      var src = '  "' + parsed.id + '": ' + JSON.stringify(parsed.story, null, 2) + ",";
      copyText(src)
        .then(function () { flash(document.getElementById("ar-src-copied")); })
        .catch(function () { window.alert("Copy failed."); });
    });
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

    var advBack = document.getElementById("adventure-back");
    if (advBack) advBack.addEventListener("click", function () { SFX.select(); showScreen("menu"); });

    var authBack = document.getElementById("author-back");
    if (authBack) authBack.addEventListener("click", function () { showAdventure(); });

    var copyBtn = document.getElementById("author-copy");
    if (copyBtn) copyBtn.addEventListener("click", copyPrompt);

    var addBtn = document.getElementById("author-add");
    if (addBtn) addBtn.addEventListener("click", addStory);
  }

  initMenu();

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", runBootSequence);
  } else {
    runBootSequence();
  }
})();
