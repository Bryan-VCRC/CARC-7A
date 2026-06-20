# Writing a New Story

CARC-7A's co-op mode is a fixed engine plus swappable **story packs**. The
engine (vitals, items, GM console, atmosphere triggers, the records reader,
the "WE ARE ALL HERE" set-piece) never changes. A story is *pure narrative
data*: a briefing, journal entries, field notes the GM reveals, and archive
images. Add a story and it appears on the launcher's **SELECT ADVENTURE**
screen automatically — no code changes, no API calls.

There are two ways to add a story. **The in-app screen is the easy path** —
no file editing.

### Easy path: the in-app "Add New Story" screen

1. Launcher → **TWO PLAYER CO-OP → SELECT ADVENTURE → + ADD NEW STORY**.
2. Tap **COPY CHATGPT PROMPT**, paste it into ChatGPT, fill the two blanks
   (your premise + a story id), and send.
3. Paste ChatGPT's output into the box and tap **ADD STORY**. The story is
   saved in the browser and appears in your adventure list right away.
4. The screen lists the image filenames to drop into
   `data/stories/<your-id>/`. Add them and you're done.

Stories added this way live in your browser's local storage (on the tablet
you play on). They're real and playable immediately. If you ever want to bake
one permanently into the repo, the success screen has a **COPY FOR
stories.js** button — paste that into `js/stories.js` (see below). The prompt
the button copies is the canonical one in `docs/story-prompt.txt`.

### Manual path: edit `js/stories.js` directly

1. Copy the **ChatGPT prompt** at the bottom of this doc (same text as the
   in-app button / `docs/story-prompt.txt`) into ChatGPT.
2. Fill in the two blanks and send it.
3. Paste its output into `js/stories.js`.
4. Drop the images it describes into `data/stories/<your-id>/`.
5. Reload the launcher and pick your story.

The rest of this doc explains the pack format — useful either way, and
required reading if you go manual.

---

## How a pack is wired

Everything lives in `js/stories.js`:

```js
(function () {
  "use strict";
  window.STORIES = {
    "t4-84": { /* ...the first story... */ },

    // Add yours as another key in this same object:
    "your-id": { /* ...your story... */ },
  };
})();
```

- The **key** (`"your-id"`) is the story id. Lowercase, hyphenated, no spaces
  (e.g. `"derelict-halls"`). It must be unique and it must match the image
  folder name (`data/stories/your-id/`).
- The launcher lists every key in `window.STORIES`. Choosing one opens
  `duo.html?story=your-id`; the player terminal and the GM console both load
  that pack.

### Image paths are bare filenames

Inside a pack, every image is just a filename — `"corridor.png"`, not a path.
The engine resolves it to `data/stories/<story-id>/<filename>`. So an image
named `"corridor.png"` in the `your-id` pack must exist at
`data/stories/your-id/corridor.png`. Keep filenames lowercase and simple.

---

## The pack schema

A story object has exactly these five parts:

```js
"your-id": {
  title: "Short Title: Tagline",          // shown on the launcher card
  blurb: "One or two sentences of hook.", // shown under the title

  briefing: [ /* lines */ ],   // typewriter intro, plays before crew setup
  journal:  [ /* entries */ ], // starting ship records (always visible)
  notes:    [ /* notes */ ],   // field notes the GM reveals during play
  archives: [ /* images */ ],  // photos, gated behind journal/notes
}
```

### `briefing` — the intro crawl

An array of strings. Each string is one line, typed out one at a time on the
intro screen. Use an empty string `""` for a blank spacer line. Keep lines
short (they're on a tablet). End on a hook. The first archive image is shown
beside the briefing automatically.

```js
briefing: [
  "INCOMING CONTRACT // COLONIAL RESOURCE AUTHORITY",
  "",
  "The mining platform stopped answering six weeks ago.",
  "",
  "Recover the core logs. Don't ask what's on them.",
],
```

### `journal` — starting ship records

Logs/memos the crew can read from the start (the JOURNAL tab). Each entry:

| field            | required | notes |
|------------------|----------|-------|
| `id`             | yes      | unique within the pack, e.g. `"log-contract"`. Archives reference these ids. |
| `type`           | yes      | a short tag shown as a chip: `memo`, `log`, `document`, etc. |
| `title`          | yes      | the entry headline |
| `date`           | no       | small meta line, e.g. `"RECOVERY CONTRACT"` |
| `author`         | no       | small meta line, e.g. `"COLONIAL RESOURCE AUTHORITY"` |
| `classification` | no       | shown uppercased in the reader, e.g. `"open"`, `"sealed"` |
| `body`           | yes      | the text. Use a backtick template string for multi-line; `\n` works too. |
| `image`          | no       | bare filename shown inside the entry |

```js
journal: [
  {
    id: "log-contract",
    type: "memo",
    title: "Contract — Platform K-9",
    date: "RECOVERY CONTRACT",
    author: "COLONIAL RESOURCE AUTHORITY",
    classification: "open",
    body: `Platform K-9 went silent six weeks ago. No mayday.

Recover the core logs. Survivors pay more.`,
  },
],
```

### `notes` — field notes the GM reveals

The GM console lists these with a **REVEAL** button. Revealing one pushes it
onto the crew's JOURNAL (newest first) and can unlock a gated archive image.
This is the main pacing tool — drip these out as the session escalates. Each
note:

| field    | required | notes |
|----------|----------|-------|
| `id`     | yes      | unique within the pack |
| `tone`   | yes      | one of `casual`, `dread`, `cryptic` — colors the chip and sets the mood arc |
| `title`  | yes      | what the GM sees in the reveal list |
| `body`   | yes      | the note text (`\n` for line breaks) |
| `image`  | no       | bare filename shown with the note |
| `effect` | no       | special hook; only `"allhere"` exists (see below) |

Order them as a mood arc: a few `casual` (mundane, human — chore lists,
birthday cards), then `dread` (something is wrong), then `cryptic` (rules,
warnings, the wrongness made explicit). The crew should feel the temperature
drop as the GM reveals them in order.

```js
notes: [
  { id: "note-snack", tone: "casual", title: "Note on the Locker",
    body: "WHO keeps eating my rations. I labeled them. I drew a SKULL on the box.\n\n— Vess" },
  { id: "note-walls", tone: "dread", title: "Maintenance Log",
    body: "The knocking in the walls again.\nOnly when no one is listening.\nTonight I held my breath to hear it. It held its breath too." },
  { id: "note-rule", tone: "cryptic", title: "Scratched Into the Bulkhead",
    body: "IF YOU DON'T REMEMBER PUTTING IT DOWN,\nDON'T PICK IT UP." },
],
```

#### The `"allhere"` set-piece (optional, use once)

Give exactly **one** `cryptic` note `effect: "allhere"`. When a player opens
it, the engine ignores the note body and runs a scripted sequence: a page
writes the same line over and over, accelerating, fear takes hold, and the
terminal force-reboots. It's the story's gut-punch. It fires once per game.
You don't write the sequence — just mark the note:

```js
{ id: "note-allpresent", tone: "cryptic", effect: "allhere",
  title: "A Page Full of the Same Words",
  image: "wearehere.png",
  body: "WE ARE ALL HERE.\n".repeat(60).trim() },
```

(The `body` is a fallback only; the set-piece supplies its own text. Keep one.)

### `archives` — gated images

Photographs the crew uncovers. Each archive stays hidden until its
`requires` id (a journal entry id **or** a note id) is in play — so an image
unlocks the moment the related log exists or the GM reveals the related note.
This is how images reveal themselves as the story progresses. Each archive:

| field         | required | notes |
|---------------|----------|-------|
| `id`          | yes      | unique within the pack, e.g. `"arc-corridor"` |
| `type`        | yes      | `"image"` (the engine also supports `"video"` via a `src` field, rarely used) |
| `name`        | yes      | the archive headline |
| `date`        | no       | small meta line, e.g. `"INTERIOR"` |
| `requires`    | yes      | the `id` of the journal entry or note that unlocks it |
| `description` | no       | caption shown under the image |
| `image`       | yes      | bare filename in `data/stories/<id>/` |

```js
archives: [
  { id: "arc-corridor", type: "image", name: "Deck Corridor", date: "INTERIOR",
    requires: "note-walls",
    description: "Empty. Fogged. The emergency lights cycle for no one.",
    image: "corridor.png" },
],
```

**Make the first archive your establishing shot** — it's displayed beside the
briefing. For T4-84 that's the exterior of the ship.

---

## Installing your story

1. Open `js/stories.js`. Inside `window.STORIES = { ... }`, add your pack as a
   new key (don't disturb the existing ones). Mind the comma between entries.
2. Create `data/stories/<your-id>/` and drop in every image your pack
   references, named exactly as the `image` fields say (lowercase).
3. Start the server (`npm start`) and open the launcher. **TWO PLAYER CO-OP →
   SELECT ADVENTURE** now lists your story. Pick it.
4. Quick check: the briefing types out, the establishing image shows, the GM
   console's FIELD NOTES list shows your notes, and revealing a note unlocks
   its gated archive on the crew terminal.

If your story doesn't appear, you probably broke the JSON-ish syntax in
`stories.js` — a missing comma or unbalanced bracket. The browser console
will point at the line.

---

## Image style (for generating art)

For a consistent look across stories, generate images with this brief:

> Cinematic still, found-footage horror aboard a derelict spacecraft.
> Grimy industrial sci-fi (Alien / Mothership tone). Dim, low-key lighting
> with one cold practical light source; deep shadow; volumetric haze. Muted
> desaturated palette — rust, oxidized teal, sodium-amber emergency glow.
> 35mm grain, slight lens distortion, no people unless asked. 4:3 or 3:2,
> landscape. No text, no watermark, no UI.

Then describe the specific subject per image (corridor, hold, airlock, etc.).
Keep file sizes reasonable (these load on a tablet); ~1–2 MB PNG/JPG is fine.

You typically want: **1 establishing exterior** (first archive), **3–6
interiors** gated behind notes, and **1–2 close detail shots** for the
creepiest beats. Match each `image` filename to what you save on disk.

---

## ChatGPT prompt

Copy everything in the block below into ChatGPT. Replace the two
**`<<< >>>`** blanks. Paste the result into `js/stories.js`.

````text
You are writing a STORY PACK for a 2-player co-op horror tabletop companion
app (space survival horror, Mothership / Alien / Silent Hill tone). Output is
PURE DATA in a specific JavaScript object format — narrative only, no game
mechanics, no new code.

STORY PREMISE (write the story around this):
<<< describe your premise in 1-3 sentences here >>>

STORY ID (lowercase, hyphenated, no spaces — also the image folder name):
<<< e.g. derelict-halls >>>

Produce ONE JavaScript object literal for that story id, exactly in this
shape (this is the real schema — follow field names and types precisely):

"<story-id>": {
  title: "Short Title: Tagline",
  blurb: "One or two sentence hook, shown on the launcher.",
  briefing: [
    // 12-20 short lines for a typed-out intro crawl. "" = blank spacer line.
    // Open with a header line, end on a hook. Keep lines short (tablet width).
  ],
  journal: [
    // 3 starting records the crew can read immediately. Each:
    // { id, type, title, date?, author?, classification?, body, image? }
    // - id: unique, lowercase-hyphenated (e.g. "log-contract")
    // - type: short chip tag like "memo" | "log" | "document"
    // - body: multi-line allowed (use \n)
  ],
  notes: [
    // 12-16 field notes the GM reveals one at a time. Each:
    // { id, tone, title, body, image?, effect? }
    // - tone: "casual" | "dread" | "cryptic"
    // - ORDER them as a mood arc: casual (mundane, human) -> dread (wrong)
    //   -> cryptic (rules/warnings). The temperature should drop as they go.
    // - Exactly ONE note must be: tone "cryptic", effect: "allhere",
    //   with body "WE ARE ALL HERE.\n".repeat(60).trim() (a scripted
    //   set-piece — keep that body literally).
  ],
  archives: [
    // 5-6 images the crew uncovers. Each:
    // { id, type: "image", name, date?, requires, description?, image }
    // - requires: the id of a journal entry OR a note that unlocks this image
    // - image: a BARE filename, e.g. "corridor.png" (no path)
    // - The FIRST archive is the establishing exterior shot.
  ],
}

RULES:
- Image fields are BARE filenames only (e.g. "corridor.png"), never paths.
- Every archive's `requires` must match a real id from journal or notes.
- All ids unique within the pack.
- Keep exactly one note with effect: "allhere".
- Tone: dread by implication, not gore. Mundane human details (chore lists,
  birthday cards, inside jokes) that curdle into wrongness land hardest.
- Output ONLY the object literal (starting at "<story-id>": { ), ready to
  paste as a new entry inside window.STORIES. No prose, no markdown fences.

AFTER the object, list the image filenames you used and a one-line art
description for each, so I can generate them. Use this style for every image:
"Cinematic found-footage horror still aboard a derelict spacecraft; grimy
industrial sci-fi, dim low-key lighting with one cold light source, deep
shadow, haze, muted rust/teal/amber palette, 35mm grain, no text."
````

---

That's it. The engine does the rest: vitals, loadout, items, atmosphere
triggers, the records reader, and the set-piece are all shared and already
built. A story is just the words and the pictures.
