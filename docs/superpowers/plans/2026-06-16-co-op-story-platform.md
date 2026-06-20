# Co-op Story Platform + Repo Cleanup — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make co-op stories swappable narrative data (paste-a-block authoring) on a shared engine, and clean up the duplicated item catalog + inconsistent asset names.

**Architecture:** One shared item catalog (`js/items.js` → `window.ITEMS`) consumed by both the terminal and the GM console. Narrative lives in `js/stories.js` (`window.STORIES`), read by the engine as the "active story" chosen on the launcher and synced GM↔terminal over the existing GameSync. Assets renamed to a per-key / kebab-case convention so hand-maintained lookup maps disappear.

**Tech Stack:** Vanilla ES5-ish browser JS, no build step, no framework. Node only for the dev server (`server.js`, `ws`) and ad-hoc verification.

## Global Constraints

- No build step; browser-compatible JS only (match existing `var`/function style in `js/duo.js`).
- No new HTTP endpoints. Stories register by being present in `window.STORIES`. (`/api/portraits` is pre-existing and stays.)
- Solo mode is untouched: do not modify `solo.html`, `js/app.js`, `js/data.js`, `js/map.js`, `js/menu.js` except where a task explicitly says so.
- Packs are narrative-only: no items/mechanics/sounds/theme in a pack.
- Verification = `node --check <file>` (syntax), `node -e`/`node <script>` (pure-logic simulation), `node server.js` + `curl` (serving). There is no test framework; do not add one.
- Commit after every task. Branch is `main` (this repo commits to main per project convention); end commit messages with the project's Co-Authored-By/Claude-Session trailers already in use.
- After any change a player/GM would see, note "reload terminal + console" — the server already sends `Cache-Control: no-store`.

---

## Phase 1 — Shared item catalog

### Task 1: Create the shared item catalog

**Files:**
- Create: `js/items.js`
- Modify: `duo.html` (add `<script src="js/items.js">` before `js/duo.js`), `admin.html` (add it before the inline `<script>`)

**Interfaces:**
- Produces: `window.ITEMS` — an object keyed by stable item key. Keys: `revolver, chainsword, pulse_carbine, light_armor, leather_jacket, flashlight, rope, first_aid, combat_stim, defib, comms, helmet, rations, paracord`. Each value is a full item template: `{ key, type, name, icon, photo, quantity, description, stats, ammo?, fireModes?, consumable?, sfx?, sfxLabel?, support? }`.

- [ ] **Step 1: Author `js/items.js`.** Build `window.ITEMS` by consolidating the two current sources:
  - From `js/duo.js` `ITEMS` (the loadout templates): `revolver, chainsword, light → light_armor, leather → leather_jacket, flashlight, rope, firstaid → first_aid`.
  - From `admin.html` `CO_OP_ITEMS`: `pulse_carbine, combat_stim, defib, comms, helmet, rations, paracord` (and reconcile the duplicates above — keep one definition each; prefer the duo.js stat/ammo values, e.g. revolver `spareMags: 1`).
  - Add to each: `key` (the object key), `icon: "icons/items/<key>.svg"`, `photo: "icons/item-photos/<key>.png"` (paths are the Phase-2 targets — created in Task 5), and carry `sfx`/`sfxLabel` where they exist today (chainsword). For the support items, attach a `support` object matching today's `SUPPORT` map in `duo.js` (`first_aid`, `combat_stim`, `defib`).
  - Use the existing object shapes verbatim from those files; only add the new fields. Keep `icon` pointing at the CURRENT svg names for now (they already match keys for most: `revolver.svg`, `knife.svg` for chainsword, `carbine.svg`, `armor.svg`, etc.) — Task 5 normalizes art.

- [ ] **Step 2: Syntax check.**
Run: `node --check js/items.js`
Expected: no output (exit 0).

- [ ] **Step 3: Load it in both pages.** In `duo.html` add `<script src="js/items.js"></script>` immediately before `<script src="js/duo.js"></script>`. In `admin.html` add the same line immediately before the existing `<script>` that opens the inline console code (after `js/duo-notes.js`... note: admin does not currently load duo-notes for items — add `items.js` before the inline block).

- [ ] **Step 4: Verify the catalog loads and is complete.**
Run:
```
node -e 'global.window={}; require("./js/items.js"); var k=Object.keys(window.ITEMS); console.log(k.length, k.join(","));'
```
Expected: `14` and the full key list above.

- [ ] **Step 5: Commit.**
```
git add js/items.js duo.html admin.html
git commit -m "Co-op: shared item catalog (js/items.js)"
```

### Task 2: Point the terminal at the shared catalog

**Files:**
- Modify: `js/duo.js`

**Interfaces:**
- Consumes: `window.ITEMS` (Task 1).
- Produces: `buildLoadout(loadout)` unchanged signature; `itemPic(item)` resolves from `item.photo`; choice previews resolve from `window.ITEMS[<key>].photo`.

- [ ] **Step 1: Replace the local `ITEMS` const** in `js/duo.js` with a reference to `window.ITEMS`. Update `buildLoadout` so its `keys` array maps loadout choices to catalog keys: weapon `chainsword|revolver`, armor `light→light_armor | leather→leather_jacket`, plus `flashlight, rope, first_aid`. Clone from `window.ITEMS[k]`.

- [ ] **Step 2: Derive item photos from the item, removing the name maps.** Delete `ITEM_PICS` and `CHOICE_PIC`. Change `itemPic(item)` to `return item && item.photo ? item.photo : null;`. Change `CHOICE_PIC` usages in `renderSetupChoices` to read `window.ITEMS[<keyForChoice>].photo`, where weapon `chainsword→"chainsword"`, `revolver→"revolver"`; armor `light→"light_armor"`, `leather→"leather_jacket"`.

- [ ] **Step 3: Point `SUPPORT` at the catalog.** Replace the `SUPPORT` name-map lookups so `supportFor(item)` returns `item.support || null` (support now lives on the catalog item).

- [ ] **Step 4: Syntax check.**
Run: `node --check js/duo.js`
Expected: exit 0.

- [ ] **Step 5: Simulate a loadout.**
Run a `node` snippet that loads `js/items.js` then reimplements `buildLoadout` keys to confirm `{weapon:"revolver",armor:"leather"}` → `revolver, leather_jacket, flashlight, rope, first_aid` (names), and that each has a `photo`.
Expected: those five names, each with a `photo` path.

- [ ] **Step 6: Commit.**
```
git add js/duo.js
git commit -m "Co-op: terminal uses shared item catalog; drop name maps"
```

### Task 3: Point the GM console at the shared catalog

**Files:**
- Modify: `admin.html` (inline script)

**Interfaces:**
- Consumes: `window.ITEMS`.

- [ ] **Step 1: Replace `CO_OP_ITEMS`.** Build the give-item list from `window.ITEMS`: `var CO_OP_ITEMS = Object.keys(window.ITEMS).map(function(k){return window.ITEMS[k];});` (or a curated ordered subset). Keep `itemOptionLabel`/`itemOptionsHTML` working against these objects. The send payload stays the full item object.

- [ ] **Step 2: Syntax check the inline script.**
Run the existing extraction check:
```
node -e 'const fs=require("fs");const h=fs.readFileSync("admin.html","utf8");const m=[...h.matchAll(/<script(?:\s+src="[^"]*")?>([\s\S]*?)<\/script>/g)];for(const s of m){if(s[1].trim())new Function(s[1]);}console.log("ok");'
```
Expected: `ok`.

- [ ] **Step 3: Serve check.**
Run `PORT=3099 node server.js &`, then `curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3099/js/items.js` (expect 200) and `curl -s http://localhost:3099/admin.html | grep -c CO_OP_ITEMS` (expect ≥1). Kill the server.

- [ ] **Step 4: Commit.**
```
git add admin.html
git commit -m "Co-op: GM give-item uses shared catalog"
```

---

## Phase 2 — Asset naming convention

### Task 4: Normalize sound files

**Files:**
- Rename (git mv): files under `data/media/soundeffects/` → `data/media/sfx/` with kebab-case names.
- Modify: `js/audio.js` (preload paths), `wiz.js` only if it references sound paths (it does not — skip).

**Interfaces:**
- Produces: `data/media/sfx/<name>` canonical paths; `audio.js` is the single place mapping sample keys → files.

- [ ] **Step 1: git mv each sound** into `data/media/sfx/` with these names:
  `revolver_shot.wav→revolver-shot.wav`, `revolver_reload.wav→revolver-reload.wav`, `rifle_singleshot.wav→rifle-shot.wav`, `rifle_burst.wav→rifle-burst.wav`, `rifle_reload.wav→rifle-reload.wav`, `gun_empty.wav→gun-empty.wav`, `Chainsword.mp3→chainsword.mp3`, `TriggerAlarm.mp3→alarm.mp3`, `radio_static.mp3→radio-static.mp3`, `radio_switch.wav→radio-switch.wav`, `lowhealth_heartbeat.mp3→heartbeat-low.mp3`, `heal.mp3→heal.mp3`, `eating.aiff→eat.aiff`, `spaceship_lowroar.mp3→spaceship-roar.mp3`. Leave the two original sci-fi samples (`alert`/`error`) — rename to `sci-fi-alert.wav` / `sci-fi-error.wav` and update their two `preloadSample` lines.

- [ ] **Step 2: Update every `preloadSample(...)` / ambiance URL in `js/audio.js`** to the new `data/media/sfx/...` paths. Update the ambiance default in `admin.html` `AMBIANCE` (`spaceship_lowroar.mp3` → `data/media/sfx/spaceship-roar.mp3`).

- [ ] **Step 3: Syntax check.**
Run: `node --check js/audio.js`
Expected: exit 0.

- [ ] **Step 4: Serve check every sound resolves.**
Run `PORT=3099 node server.js &`; for each new filename `curl -s -o /dev/null -w "%{http_code} %{size_download}\n" http://localhost:3099/data/media/sfx/<name>` and confirm 200 + nonzero. Kill server.

- [ ] **Step 5: Commit.**
```
git add -A data/media js/audio.js admin.html
git commit -m "Assets: sounds -> data/media/sfx, kebab-case; single audio map"
```

### Task 5: Normalize item art by key

**Files:**
- Rename (git mv): `icons/items_pics/*` → `icons/item-photos/<key>.png`. Ensure `icons/items/<key>.svg` exists for each item (rename/copy where the svg name differs from the key, e.g. `knife.svg`→`chainsword.svg` if chainsword should not reuse knife; otherwise set the item's `icon` to the existing svg).
- Modify: `js/items.js` (`icon`/`photo` fields to final paths).

- [ ] **Step 1: git mv the photos** to keys: `Revolver.png→revolver.png`, `Chainsword.png→chainsword.png`, `Carbine_Rifle.png→pulse_carbine.png`, `LightMilitary.png→light_armor.png`, `LeatherJacket.png→leather_jacket.png`. Folder `icons/items_pics` → `icons/item-photos`.

- [ ] **Step 2: Set `js/items.js` `photo`** for each item to `icons/item-photos/<key>.png` and `icon` to `icons/items/<existing-or-key>.svg`. Items without a photo file yet simply have a `photo` path that 404s until art is added — that's fine; the engine already falls back to the icon when the `<img>` is absent (confirm the detail/preview code hides gracefully; if not, guard with an onerror or only set `photo` when a file exists — list the items that currently HAVE photos: revolver, chainsword, pulse_carbine, light_armor, leather_jacket).

  To avoid 404s for the others, only set `photo` on those five; leave `photo` undefined for the rest. `itemPic` already returns null when `photo` is falsy.

- [ ] **Step 3: Syntax check.**
Run: `node --check js/items.js`
Expected: exit 0.

- [ ] **Step 4: Serve check the five photos.**
Run server on 3099; `curl` each `icons/item-photos/<key>.png` for 200. Kill server.

- [ ] **Step 5: Commit.**
```
git add -A icons js/items.js
git commit -m "Assets: item photos -> icons/item-photos/<key>.png"
```

---

## Phase 3 — Story packs

### Task 6: Create `js/stories.js` with the T4-84 pack

**Files:**
- Create: `js/stories.js`
- Rename (git mv): `data/media/duos/*` → `data/stories/t4-84/*` (keep filenames or simplify, e.g. `OutsideShip.png`→`exterior.png`); update the pack's `image` fields to bare filenames.
- Modify: `duo.html` + `admin.html` (load `js/stories.js`; can replace the `js/duo-data.js` + `js/duo-notes.js` includes).
- Delete (after migration): `js/duo-data.js`, `js/duo-notes.js`.

**Interfaces:**
- Produces: `window.STORIES["t4-84"] = { title, blurb, briefing[], journal[], notes[], archives[] }`. `archives[].image` and `notes[].image` are bare filenames resolved against `data/stories/<id>/`.

- [ ] **Step 1: Build `window.STORIES["t4-84"]`** by moving content out of the current files: `briefing` from `STORY_LINES` (in `js/duo.js`), `journal` from `js/duo-data.js` `DUO_JOURNAL`, `notes` from `js/duo-notes.js` `DUO_NOTES`, `archives` from `DUO_ARCHIVES` (in `js/duo-data.js`). Keep every field (`tone`, `effect`, `requires`) verbatim. Convert image refs to bare filenames (e.g. `data/media/duos/HappyBirthday.png` → `the-party.png`).

- [ ] **Step 2: git mv the story images** to `data/stories/t4-84/` with the bare names referenced in Step 1.

- [ ] **Step 3: Load `js/stories.js`** in `duo.html` (before `js/duo.js`) and `admin.html` (before inline). Remove the `js/duo-data.js` and `js/duo-notes.js` `<script>` tags.

- [ ] **Step 4: Syntax + shape check.**
Run: `node --check js/stories.js` (exit 0), then
```
node -e 'global.window={};require("./js/stories.js");var s=window.STORIES["t4-84"];console.log(!!s, s.briefing.length, s.journal.length, s.notes.length, s.archives.length);'
```
Expected: `true` and nonzero counts matching today (briefing ~19, journal 3, notes 15, archives 6).

- [ ] **Step 5: Commit.**
```
git add -A js/stories.js data/stories duo.html admin.html
git rm js/duo-data.js js/duo-notes.js
git commit -m "Co-op: T4-84 narrative -> js/stories.js story pack"
```

### Task 7: Terminal reads the active story pack

**Files:**
- Modify: `js/duo.js`

**Interfaces:**
- Consumes: `window.STORIES`.
- Produces: `activeStory()` returns the current pack object; engine reads briefing/journal/notes/archives from it.

- [ ] **Step 1: Add story selection.** Add `var activeStoryId = null;` and `function activeStory(){ return (window.STORIES && window.STORIES[activeStoryId]) || firstStory(); }` where `firstStory()` returns the first value in `window.STORIES`. Resolve `activeStoryId` at init from the URL: `new URLSearchParams(location.search).get("story")`, falling back to the first key. Persist it in the duo save (`STATE.storyId`) and restore on load.

- [ ] **Step 2: Repoint the engine reads:**
  - `STORY_LINES` → `activeStory().briefing`.
  - `archiveJournal()` base → `activeStory().journal` (still concat `STATE.notes`).
  - `archiveMedia()` → `activeStory().archives`, resolving each `image` to `data/stories/<activeStoryId>/<image>`.
  - Recovered-note image and `showArchJournalDetail`/`showArchMediaDetail` → resolve bare `image` filenames the same way (add a helper `storyImg(name)`).
  - Remove the now-dead `DUO_JOURNAL`/`DUO_ARCHIVES`/`STORY_LINES` references.

- [ ] **Step 3: Announce the story over GameSync.** In `snapshot()` include `storyId: activeStoryId`. On `initSync`, after `GameSync.init("player")`, send the snapshot (already happens). Handle no-op if missing.

- [ ] **Step 4: Syntax check.**
Run: `node --check js/duo.js`
Expected: exit 0.

- [ ] **Step 5: Commit.**
```
git add js/duo.js
git commit -m "Co-op: terminal reads the active story pack"
```

### Task 8: GM console reads/adopts the active story

**Files:**
- Modify: `admin.html` (inline script)

**Interfaces:**
- Consumes: `window.STORIES`, `coop-state.storyId` over GameSync.

- [ ] **Step 1: Build FIELD NOTES from the active story.** Replace `window.DUO_NOTES` usage with `activeStory().notes`, where the console tracks `var adminStoryId` (default first key) and `activeStory()` mirrors the terminal helper. Send `note.image` bare filenames as today (terminal resolves them).

- [ ] **Step 2: Adopt the terminal's story.** In the existing `GameSync.onMessage` `coop-state` handler, if `msg.storyId` differs, set `adminStoryId = msg.storyId`, rebuild the FIELD NOTES list, and show the story title somewhere in the header.

- [ ] **Step 3: Inline syntax check** (same extraction snippet as Task 3 Step 2). Expected `ok`.

- [ ] **Step 4: Commit.**
```
git add admin.html
git commit -m "Co-op: GM console reads + adopts the active story"
```

### Task 9: Launcher select-adventure screen

**Files:**
- Modify: `index.html` (+ its menu JS, `js/menu.js`), `duo.html` reachability unchanged.

- [ ] **Step 1: Add a story-select step.** When "TWO PLAYER" is chosen on the launcher, instead of linking straight to `duo.html`, render a list from `window.STORIES` (load `js/stories.js` in `index.html`): each entry shows `title` + `blurb` and links to `duo.html?story=<id>`. If only one story exists, it may go straight through.

- [ ] **Step 2: Serve check.**
Run server on 3099; `curl -s http://localhost:3099/index.html | grep -c stories.js` (≥1). Kill server. Manually: launcher → TWO PLAYER → see T4-84 listed → opens `duo.html?story=t4-84`.

- [ ] **Step 3: Commit.**
```
git add index.html js/menu.js
git commit -m "Co-op: launcher select-adventure screen"
```

---

## Phase 4 — Authoring kit

### Task 10: Write `docs/STORY-AUTHORING.md`

**Files:**
- Create: `docs/STORY-AUTHORING.md`

- [ ] **Step 1: Write the doc** with three sections:
  1. **How to add a story** — paste a block into `js/stories.js` under `window.STORIES`, drop images in `data/stories/<id>/`, reload. (3 steps.)
  2. **The template** — the fully-commented story block (the §1.3 shape from the spec), with the allowed `tone` values, the `effect: "allhere"` note, `requires` semantics, and image-filename rules.
  3. **The ChatGPT prompt** — the full paste-in prompt (from spec §5) that emits a finished story block + the image prompts using the grimy-derelict style block (copy the style + negative block verbatim from earlier in the project).

- [ ] **Step 2: Sanity check** the embedded template is itself valid by extracting it and `new Function("return (" + block + ")")` in node. Expected: parses.

- [ ] **Step 3: Commit.**
```
git add docs/STORY-AUTHORING.md
git commit -m "Docs: story authoring kit (template + ChatGPT prompt)"
```

---

## Self-Review

- **Spec coverage:** §1 packs → Tasks 6–7; §2 select/sync → Tasks 7–9; §3 shared items → Tasks 1–3; §4 asset rename → Tasks 4–5; §5 authoring kit → Task 10; §6 engine untouched → enforced by Global Constraints. ✓
- **Placeholder scan:** migrations reference exact source files/symbols to copy (DRY for existing content); new code shapes are specified. No "TBD"/"handle edge cases".
- **Type consistency:** item keys are identical across Tasks 1/2/3/5; `activeStory()`/`storyImg()`/`storyId` names match across Tasks 7/8; `photo`/`icon` fields consistent Tasks 1/5/2.
- **Risk note:** Task 5 — only the five items with real photos get a `photo`; `itemPic` returns null otherwise, so no 404s. Task 6 deletes `duo-data.js`/`duo-notes.js` only after their content is moved.
