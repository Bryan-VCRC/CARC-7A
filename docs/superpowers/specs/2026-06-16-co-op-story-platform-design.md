# CARC-7A Co-op — Story Platform + Repo Cleanup

**Date:** 2026-06-16
**Status:** Design (awaiting review)

## Goal

Turn the co-op terminal from a single hard-coded scenario (T4-84) into a
repeatable platform: the **engine** (items, mechanics, vitals, stats/saves,
triggers, lights, GM console, UI, sounds) stays put, and each **story** is
swappable narrative data. Adding a story should be: hand a template to ChatGPT,
get a finished story block back, paste it in, drop in the images — no code.

This also cleans up accumulated mess: a duplicated item catalog and inconsistent
asset names with hand-maintained lookup maps.

## Non-goals

- Solo mode (`solo.html`, `js/app.js`, `js/data.js`) is untouched.
- No new HTTP/API endpoints. Stories are static data registered by hand.
- Packs are **narrative only** — they do not define items, mechanics, sounds, or
  theme. Those are shared engine.

## 1. Story model (narrative-only)

All stories live in one file, **`js/stories.js`**:

```js
window.STORIES = {
  "t4-84": { /* story object */ },
  // paste the next story block here
};
```

Adding a story = paste one block into this object + drop its images in
`data/stories/<id>/`. `duo.html` and `admin.html` already load `js/stories.js`
once, so there are no per-story `<script>` tags and nothing to discover.

### Story object shape

```js
"<id>": {
  title: "T4-84: It Took Us",
  blurb: "A derelict survey cruiser. No crew. A party that never ended.",

  // Typewriter intro shown on entering the story (one array entry per line;
  // "" = blank line).
  briefing: [
    "INCOMING CONTRACT // ...",
    "",
    "IT TOOK US."
  ],

  // Starter journal entries (always present from the start).
  journal: [
    { id: "duo-contract", type: "memo|log|document",
      title: "...", date: "...", author: "...", classification: "open|restricted",
      body: "multi-line\\ntext" }
  ],

  // Field notes the GM reveals during play.
  notes: [
    { id: "note-party", tone: "casual|dread|cryptic",
      title: "...", body: "...",
      image: "the-party.png",   // optional, filename inside data/stories/<id>/
      effect: null }            // optional engine hook, e.g. "allhere"
  ],

  // Archive images, gated by a related journal/note id.
  archives: [
    { id: "arc-exterior", name: "...", date: "...", description: "...",
      image: "exterior.png", requires: "duo-approach" }
  ]
}
```

Field reference:
- `tone` — drives the colored tag in the GM FIELD NOTES list and the journal.
- `effect` — optional engine-implemented set-piece keyed by string. Today only
  `"allhere"` exists (the WE ARE ALL HERE write-out → fear → reboot). Unknown /
  null = a normal note.
- `image` — bare filename; the engine resolves it to `data/stories/<id>/<image>`.
- `requires` (archives) — the archive image only appears once that journal entry
  or note id is in play.

The engine reads the **active** story wherever it currently reads `STORY_LINES`,
`DUO_JOURNAL`, `DUO_NOTES`, `DUO_ARCHIVES`. Those constants are removed; their
T4-84 content migrates verbatim into `stories.js`.

The engine **validates and fills defaults** on load (missing arrays → empty,
missing optional fields → null) so a slightly-imperfect pack still loads instead
of crashing.

## 2. Choosing the active story

- `index.html` "TWO PLAYER" → a **select-adventure screen** built from
  `window.STORIES` (title + blurb per entry). Picking one opens
  `duo.html?story=<id>`.
- The terminal sets its active story from the URL param and **announces it over
  GameSync** (a `coop-story` message, also included in the state snapshot).
- `admin.html` **adopts** the announced story (shows its name, loads its FIELD
  NOTES) so the warden's notes always match the players' story. If admin opens
  first, it defaults to the first story until the terminal announces.
- Reset/return behavior is unchanged; the active story persists in the duo save.

## 3. Shared item catalog (kill the duplicate)

New **`js/items.js`** defines the canonical catalog keyed by stable item keys:

```
revolver, chainsword, pulse_carbine, light_armor, leather_jacket,
flashlight, rope, first_aid, combat_stim, defib, comms, helmet, rations, paracord
```

Each entry carries everything the engine needs (type, name, description, ammo /
consumable / stats, `sfx`, support behavior). `duo.js` (loadout + buildLoadout)
and `admin.html` (give-item list) both consume `window.ITEMS` — removing the
divergence between today's `ITEMS` (duo.js) and `CO_OP_ITEMS` (admin.html).

Because items have stable keys, assets are derived from the key and the
hand-maintained maps go away: `ITEM_PICS`, `CHOICE_PIC`, and the per-name sound
keys are replaced by `icons/items/<key>.svg`, `icons/item-photos/<key>.png`, and
an optional `sfx` field per item.

## 4. Asset naming convention (rename + rewire)

Establish one convention and rename existing files to it (references updated in
the same pass):

- **Sounds → `data/media/sfx/`**, kebab-case by purpose:
  `revolver-shot.wav`, `revolver-reload.wav`, `rifle-shot.wav`, `rifle-burst.wav`,
  `rifle-reload.wav`, `gun-empty.wav`, `chainsword.mp3`, `alarm.mp3`,
  `radio-static.mp3`, `radio-switch.wav`, `heartbeat-low.mp3`, `heal.mp3`,
  `eat.aiff`, plus ambiance `spaceship-roar.mp3`. `audio.js` keeps the single
  name→file map. (`Soundtrack.mp3` remains gitignored.)
- **Item art** → `icons/items/<key>.svg` (line art) and
  `icons/item-photos/<key>.png` (photos), named by item key
  (`Carbine_Rifle.png` → `pulse_carbine.png`, `LightMilitary.png` →
  `light_armor.png`, etc.).
- **Story images** → `data/stories/<id>/<name>.png`. T4-84's `data/media/duos/`
  images move here.
- **Portraits** stay where they are, listed dynamically by the existing
  `/api/portraits` (pre-existing; not a new endpoint).

## 5. The authoring kit — `docs/STORY-AUTHORING.md`

This is the heart of "easy to add stories." It contains:

1. **The template** — the commented story block from §1.3, ready to copy.
2. **A paste-into-ChatGPT prompt** that takes a one-line premise and returns
   (a) a complete, valid story block in this exact shape, and (b) the matching
   image-generation prompts (using our grimy-derelict style block) so the art
   can be generated and named to match the `image` fields.

Draft of the ChatGPT prompt (final wording lives in the doc):

> You are writing a horror story pack for a tabletop co-op terminal app
> (space survival horror, Mothership / Alien / Silent Hill tone). Output ONE
> JavaScript object literal in EXACTLY this schema (keys, types, nesting) and
> nothing else, then a separate list of image prompts.
>
> Tone: dread by absence and the uncanny — mostly unsettling, with occasional
> dry young-teen humor for relief. Plain, spare prose; the scary notes land on
> a quiet last line. Minimal gore (kid-safe; suggested, never explicit).
>
> The pack has: `title`, `blurb`, `briefing` (8–18 short typewriter lines that
> set the contract and end on an ominous beat), `journal` (3 starter entries:
> the contract, the approach, one recovered fragment), `notes` (12–16 field
> notes the GM reveals — tag each `casual`/`dread`/`cryptic`; 2–3 may set
> `image`; leave `effect` null unless using a known hook), and `archives`
> (4–6 scene images, each `requires` a journal/note id).
>
> [schema block inserted here]
>
> Then output an "IMAGE PROMPTS" section: for every `image` filename used, a
> ready-to-paste generation prompt ending with this style block: [style block].

So the loop is: premise → ChatGPT → paste the block into `js/stories.js` →
generate + drop the images in `data/stories/<id>/` → it's in the launcher menu.

## 6. Stays put (the engine)

Items, loadout, stats/saves, all triggers/atmosphere (fear, glitch, blackout,
corrupt, flicker, radio static, alarm, ambiance), lights (`wiz.js`), GM console
controls, sounds, vitals/ECG/heartbeat, the identity/portrait picker, and all
UI/CSS. Adding a story touches none of it.

## 7. Implementation phasing (for the plan)

The plan will sequence this so each chunk is reviewable on its own:

1. **Shared items** — extract `js/items.js`; point `duo.js` + `admin.html` at it;
   remove the duplicate and the name maps. (No visible change.)
2. **Asset rename** — move/rename sounds + item art to the convention; update
   `audio.js` and item refs.
3. **Story packs** — add `js/stories.js`, migrate T4-84 content into it, switch
   the engine to read the active pack; launcher select-adventure screen +
   GameSync story sync; move T4-84 images to `data/stories/t4-84/`.
4. **Authoring kit** — write `docs/STORY-AUTHORING.md` (template + ChatGPT
   prompt + style block).

## Success criteria

- Adding a second story requires only: a pasted block in `js/stories.js` + image
  files — no engine edits.
- One source of truth for items; no `ITEM_PICS`/`CHOICE_PIC`/name-key maps.
- Consistent asset names; no broken references after the rename.
- T4-84 plays identically to today.
