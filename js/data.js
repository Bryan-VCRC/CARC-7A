/* ============================================
   CARC-7A — Game Data
   Edit this file to add/remove game content.
   ============================================ */

const SHIP_DATA = {
  name: "ISV CORRIGAN",
  designation: "Interstellar Survey Vessel",
  terminalVersion: "2.4.1",
};

const PLAYER_STATS = {
  name: "CREW MEMBER",
  portrait: "icons/player.svg",
  hp: 6,
  hpMax: 6,
  wounds: 0,
  woundsMax: 3,
  stress: 0,
  stressMax: 6,
  woundLog: [],
};

/* ------------------------------------------
   JOURNAL ENTRIES
   Types: memo, clue, log, document, distress
   ------------------------------------------ */
const JOURNAL_ENTRIES = [
  {
    id: "log-001",
    type: "log",
    title: "Day 1 — Solen Drift Entry",
    date: "CORRIGAN.D1",
    author: "ANALYST D. MERCER",
    classification: "open",
    body: `We crossed into the Solen Drift at 0600. Routine transit. Estimated passage time forty-eight hours. Nothing on sensors. Nothing unusual on external cameras.

Phillips reported a sound in the lower deck overnight. Too slow. Too even. I told her it was hull pressure adjusting to the Drift boundary. I've been telling people things are hull pressure for three days now.`
  },
  {
    id: "log-002",
    type: "log",
    title: "Day 2 — Equipment Displacement",
    date: "CORRIGAN.D2",
    author: "ANALYST D. MERCER",
    classification: "open",
    body: `Cargo Bay 2 reported minor equipment displacement. Two crates moved from their secured positions. No record of crew access during that shift. Logged as a securing failure and reassigned for restraint.

Phillips filed a second noise report. I did not respond to it in writing. I should have.`
  },
  {
    id: "log-003",
    type: "log",
    title: "Day 3 — Something Is In The Ship",
    date: "CORRIGAN.D3",
    author: "ANALYST D. MERCER",
    classification: "restricted",
    body: `Something is in the ship.

I don't know when it came aboard. I don't know how. There was no breach alert, no pressure event, nothing on external sensors during the window we think it entered. It was just not here and then it was. Whatever it is, it is large and it has been moving through the lower decks and it has been rearranging things.

Not ransacking. Rearranging. Everything parallel. Everything equidistant. Like someone with a ruler and infinite patience and no understanding of what any of it is for.

Cargo Bay 2 has been almost entirely reorganized. The crates are in rows. The spacing between them is identical. Several items that were secured to the walls have been removed and placed on the floor in the pattern. I don't know how it got them down without triggering any alerts. I don't know how it moved some of them at all.

Crew is restricted to Decks 1 through 3 until further notice.`
  },
  {
    id: "log-004",
    type: "log",
    title: "Day 4 — First Sighting, Corridor C",
    date: "CORRIGAN.D4",
    author: "ANALYST D. MERCER",
    classification: "restricted",
    body: `Saw it in Engineering Corridor C.

Tall. Pale. Wrong proportions, wrong in the way a reflection is wrong when the glass isn't flat. The surface of it moved even while it was standing still, slow and continuous, like something shifting just underneath. It was standing at the corridor junction, doing nothing, or doing something I couldn't identify as anything. There was a faint light coming from somewhere in its torso. Amber. Greenish. It lit the wall beside it and I stood there longer than I should have trying to understand what I was looking at.

I looked away for two seconds to key my radio.

When I looked back it was closer and I still didn't hear it move.

I ran. I am not embarrassed about that.

Designating for formal identification. Provisional field name assigned pending review.

DESIGNATION: CARC-7A
FIELD NAME: Seamwarden`
  },
  {
    id: "log-005",
    type: "log",
    title: "Day 5 — The Shedding",
    date: "CORRIGAN.D5",
    author: "ANALYST D. MERCER",
    classification: "restricted",
    body: `Found something in the vents. Small. Fast. Pale, same quality as the large one. Five limbs, though calling them legs is generous. They move wrong, they grip wrong, the word leg doesn't quite apply but there's no better word available. There is a secondary structure on the dorsal surface, a thin filament, semi-translucent, that extends upward from the body. We don't know what it's for. When two of them are in proximity the filaments reach toward each other.

They scatter when approached. Murcheson tried to grab one and it clawed and bit his hand before disappearing into a conduit. He needed eight stitches.

There are more of them than we can count.

I watched them come off the large one. Pieces of it simply separating, dropping, and moving away. It didn't slow down. It didn't react. Like it doesn't notice, or like noticing isn't relevant to what it's doing.

Sealed the vent access points on Decks 1 and 2. Probably too late.`
  },
  {
    id: "log-006",
    type: "log",
    title: "Day 6 — The Gomez Incident",
    date: "CORRIGAN.D6",
    author: "ANALYST D. MERCER",
    classification: "classified",
    body: `Gomez is dead.

We don't fully understand what happened. He was in Cargo Bay 2 running a sweep for the small ones when CARC-7A came through to continue calibrating. Based on what we found, we think he moved something it had already placed. Maybe by accident. Maybe he didn't see it in the dark.

It put him in a storage container. The container was latched from the outside. We don't know how long he was in there before anyone checked. Thankfully we heard him banging on the wall. We took him to the medical bay but he hasn't spoken since. He's catatonic.

CARC-7A did not target him. That is what I keep coming back to. It did not single him out. It needed that space filled and he was the nearest available object and that was the full extent of the decision.

We have told the crew. We have told them to stay out of the lower decks.

Three of them are asking for weapons.

I don't think weapons are the answer. I don't think I can explain why in a way that will matter to them right now.`
  },
  {
    id: "log-007",
    type: "log",
    title: "Day 7 — Weapons Are Not The Answer",
    date: "CORRIGAN.D7",
    author: "ANALYST D. MERCER",
    classification: "classified",
    body: `Weapons are not the answer.

Prasad and Okafor went down to Deck 4 with sidearms. They found two of the small ones in the corridor near Engineering and killed them both. Easy enough. Then CARC-7A came around the corner at the far end of the hall.

Prasad fired at it. She said it was a good hit, center mass, and that the large one paused. Its light changed, dimmed and flickered, and for a moment she thought that was it.

Then it resumed walking toward them.

They ran. Okafor tripped on something it had placed in the corridor and went down. By the time Prasad turned back, CARC-7A was already standing over him. She said it looked at him, though she can't explain how she knew it was looking, it doesn't have eyes in any arrangement that makes sense. It crouched down. It picked him up.

It put him in a chair. A crew chair that had been placed in the middle of the corridor, perfectly centered, facing the wall. It placed him in it and then straightened up and continued down the corridor.

Okafor is fine physically. He sat in the chair for eleven minutes before he got up. He said he couldn't explain why he waited that long. It just didn't feel like something he was supposed to interrupt.

We are not sending anyone else down with just sidearms.`
  },
  {
    id: "log-008",
    type: "log",
    title: "Day 8 — Geometry Is Wrong",
    date: "CORRIGAN.D8",
    author: "ANALYST D. MERCER",
    classification: "classified",
    body: `Deck 4 is approximately halfway reconfigured. The layout is wrong now. The corridors are the same corridors but the distances feel off, and three crew members who tried to navigate by memory ended up somewhere they weren't expecting. Reyes checked the schematics against what he could observe from the Deck 4 access hatch and reported that a support column in Engineering Bay 2 is no longer where the plans say it is.

Not by much. Enough to notice if you're looking. Enough to matter if something needs to fit against it.

CARC-7A is not moving walls. It is adjusting them. Slowly, incrementally, according to something we cannot read.

I have been trying to calculate how long we have before it finishes. I don't have a good number. I have a bad feeling, which is less useful but currently more available.

We need to get out of the Drift. Navigation says we can reroute but it costs us six days and we are already behind on the Corrigan's scheduled arrival. I have escalated the request. Command has not yet responded.

Command is not on this ship.`
  },
  {
    id: "log-009",
    type: "log",
    title: "Day 9 — Deck 5 Description",
    date: "CORRIGAN.D9",
    author: "ANALYST D. MERCER",
    classification: "classified",
    body: `I am going to describe what Deck 5 looks like now because I think someone should put it in writing before we can't get close enough to look anymore.

Every object on Deck 5 has been repositioned. Every piece of loose equipment, every chair, every tool left out, every container that wasn't bolted down. They are arranged in rows along the corridor walls, evenly spaced, facing the same direction. The spacing is exact in a way that a human being cannot replicate by eye. We measured it. The variance across forty-seven objects is less than two millimeters.

The corridor itself has been cleared. Perfectly clear, center to wall, nothing in the path. Like something is expected to move through it that needs the space.

The lights in two sections of Deck 5 have been repositioned as well. We don't know how. They are angled slightly differently than they were installed. The light falls in clean lines now, parallel strips down the corridor floor.

It looks like something prepared for an arrival.

I have stopped telling the crew it is probably nothing.`
  },
  {
    id: "memo-001",
    type: "memo",
    title: "CREW BRIEFING — All Hands",
    date: "CORRIGAN.D9",
    author: "ANALYST D. MERCER",
    classification: "open",
    body: `Here is what we know.

Something came aboard when we entered the Drift. We don't know if it followed us in or if it was waiting. What we know is that it is large, it is moving through the lower decks, and it is changing the layout of this ship. Methodically. Continuously. We do not know what it is building toward but we know it is not finished and we know we do not want it to finish.

It has shed smaller organisms throughout the ship. They are in the vents, the crawlspaces, and the cargo hold. They are weak individually and do not survive gunfire. They are fast in confined spaces and will cause real damage to equipment and personnel if left unaddressed. Treat them as a serious secondary problem.

The large one is the priority.

It has not attacked anyone who stayed out of its way. Crew members who have disrupted what it was doing, or who were simply in the wrong place at the wrong time, have been dealt with. What that looks like is not consistent. It may move you somewhere harmless. It may put you somewhere that is not harmless. We do not believe it chooses. We believe it places objects where its current logic requires them, and if you are the nearest available object, that applies to you.

Gomez is an example of what that can mean. We are not going to pretend otherwise.

Do not go to Decks 4 or 5 alone. Do not disrupt anything that looks like it has been arranged. Do not act erratically in its presence. If you encounter it, move slowly, move consistently, and do not give it a reason to notice you.

We are working on getting the ship out of the Drift. Until that happens, our goal is to slow it down. Disrupt the small ones. Introduce controlled chaos in sections it hasn't reached yet. Buy time.

Do not try to fight the large one directly. Weapons slow it but do not stop it and the attempt will draw its full attention.

We do not know what happens when it finishes. We are not going to find out.

Good luck.`
  },
  {
    id: "clue-001",
    type: "clue",
    title: "Noise Reports — Phillips (x2)",
    date: "CORRIGAN.D1",
    author: "CREW: PHILLIPS",
    classification: "open",
    body: `REPORT 1:
Sound in the lower deck overnight. Too slow. Too even. Does not match any known mechanical cycle. Filed for review.

REPORT 2:
Second occurrence of rhythmic sound from lower decks. Longer duration this time. No response from Analyst Mercer on first report. Requesting formal investigation.

[NOTE: Reports were dismissed as hull pressure adjustment. — D.M.]`
  },
  {
    id: "clue-002",
    type: "clue",
    title: "Cargo Bay 2 — Rearrangement Pattern",
    date: "CORRIGAN.D3",
    author: "ANALYST D. MERCER",
    classification: "restricted",
    body: `Observations on the Cargo Bay 2 reconfiguration:

- All crates arranged in parallel rows
- Spacing between objects is identical (measured)
- Items removed from wall-mounted positions and placed on floor
- No alerts triggered during repositioning
- No record of crew access during displacement window
- Pattern suggests deliberate geometric organization
- Whatever did this has strength sufficient to move secured industrial cargo without tools

This is not random. This is not damage. This is organization by something that does not understand what any of these objects are for, only where they should be relative to each other.`
  },
  {
    id: "clue-003",
    type: "clue",
    title: "CARC-7A — First Contact Description",
    date: "CORRIGAN.D4",
    author: "ANALYST D. MERCER",
    classification: "classified",
    body: `Physical description of entity designated CARC-7A ("Seamwarden"):

- Tall. Proportions wrong. Elongated in ways that don't correspond to known biology
- Surface moves continuously even when stationary — something shifting underneath
- Faint internal light source, torso region. Amber to greenish
- No identifiable eyes, though observers report a strong sense of being watched
- Silent movement — no footfalls detected even on metal grating
- Closes distance when unobserved. Does not appear to move while being watched directly
- Does not respond to verbal communication
- Behavior suggests total spatial awareness, zero social awareness

It does not hunt. It calibrates.`
  },
  {
    id: "clue-004",
    type: "clue",
    title: "Shed Organisms — Field Notes",
    date: "CORRIGAN.D5",
    author: "ANALYST D. MERCER",
    classification: "restricted",
    body: `The small organisms shed from CARC-7A:

- Five limbs, pale, same surface quality as main body
- Fast in confined spaces, disoriented in open areas
- Dorsal filament, semi-translucent, extends upward — purpose unknown
- Filaments reach toward each other when two organisms are in proximity
- Will bite and claw when cornered (ref: Murcheson, 8 stitches)
- Detach from CARC-7A's body during movement — main body shows no reaction
- Appear to perform subtasks in areas too small for the main body
- Population: uncountable. They are in the vents.

Sealed vent access on Decks 1 and 2. Probably too late.`
  },
  {
    id: "clue-005",
    type: "clue",
    title: "Deck 4 — Spatial Anomalies",
    date: "CORRIGAN.D8",
    author: "REYES",
    classification: "classified",
    body: `Structural survey of Deck 4 from access hatch observation:

- Support column in Engineering Bay 2 has shifted from schematic position
- Displacement is small but measurable
- Three crew members navigating by memory became disoriented — arrived at unexpected locations
- Corridors are physically the same but distances feel wrong
- CARC-7A is not moving walls — it is adjusting them incrementally
- Changes follow a pattern we cannot decode

The ship's own geometry is being rewritten.`
  },
  {
    id: "document-001",
    type: "document",
    title: "ISV Corrigan — Incident Record Header",
    date: "CORRIGAN.D9",
    author: "ANALYST D. MERCER",
    classification: "restricted",
    body: `ISV CORRIGAN — INCIDENT RECORD
CARC-7A / "SEAMWARDEN" EVENT
Compiled by: Analyst D. Mercer
Classification: Internal. Do not transmit.

INCIDENT LOG — ISV CORRIGAN
Decks 4 and 5 / Engineering Corridor C
Reporting Officer: Analyst D. Mercer

This document contains the complete daily log of the CARC-7A incursion event aboard the ISV Corrigan during Solen Drift transit. All entries are filed chronologically. Crew should review all entries and report any additional observations to the analyst on duty.

Current ship status: DECKS 4-5 RESTRICTED. All crew confined to Decks 1-3 unless authorized.`
  },
];

/* ------------------------------------------
   INVENTORY ITEMS
   Types: weapon, tool, medical, armor,
          consumable, keyitem, misc
   ------------------------------------------ */
const INVENTORY_ITEMS = [
  // --- WEAPONS ---
  {
    id: "item-001",
    type: "weapon",
    name: "Revolver",
    icon: "icons/items/revolver.svg",
    quantity: 1,
    description: "Six rounds, no frills. Loud enough to hear through a bulkhead.",
    ammo: {
      current: 6,
      magCapacity: 6,
      spareMags: 2,
      magLabel: "Cylinder",
      spareLabel: "Speedloaders"
    },
    fireModes: ["semi"],
    stats: {
      "Damage": "1d10",
      "Range": "Medium",
      "Condition": "Worn"
    }
  },
  {
    id: "item-002",
    type: "weapon",
    name: "Combat Knife",
    icon: "icons/items/knife.svg",
    quantity: 1,
    description: "Standard issue. Works on anything that gets too close.",
    stats: {
      "Damage": "1d10",
      "Range": "Adjacent",
      "Condition": "Sharp"
    }
  },
  {
    id: "item-003",
    type: "weapon",
    name: "Pulse Carbine",
    icon: "icons/items/carbine.svg",
    quantity: 1,
    description: "Fires charged kinetic rounds. Accurate, reliable, kicks like a mule.",
    ammo: {
      current: 20,
      magCapacity: 20,
      spareMags: 2,
      magLabel: "Magazine",
      spareLabel: "Magazines"
    },
    fireModes: ["semi", "burst"],
    stats: {
      "Damage": "2d10 (Semi) / 3d10 (Burst)",
      "Range": "Long",
      "Condition": "Functional"
    }
  },
  // --- PROTECTION ---
  {
    id: "item-004",
    type: "armor",
    name: "Light Military Armor",
    icon: "icons/items/armor.svg",
    quantity: 1,
    description: "Ceramic plating over a flex underlayer. Won't stop everything. Stops enough.",
    stats: {
      "Armor Points": "2 AP",
      "Speed Penalty": "-1 Speed",
      "Condition": "Scuffed"
    }
  },
  {
    id: "item-005",
    type: "armor",
    name: "Helmet",
    icon: "icons/items/helmet.svg",
    quantity: 1,
    description: "Sealed, reinforced. Built-in visor with basic HUD.",
    stats: {
      "Armor Points": "1 AP (Head)",
      "HUD": "Basic targeting, O2 readout",
      "Seal": "Vacuum-rated",
      "Condition": "Functional"
    }
  },
  // --- GEAR ---
  {
    id: "item-006",
    type: "tool",
    name: "Flashlight",
    icon: "icons/items/flashlight.svg",
    quantity: 1,
    description: "High-beam, long battery. The dark is everywhere out here.",
    consumable: {
      current: 12,
      max: 12,
      unit: "hours",
      perUse: 1,
      verb: "DRAIN",
      useLabel: "USE 1 HOUR",
      depletedMsg: "BATTERY DEAD"
    },
    stats: {
      "Beam": "High intensity",
      "Condition": "Functional"
    }
  },
  {
    id: "item-007",
    type: "medical",
    name: "First Aid Kit",
    icon: "icons/items/firstaid.svg",
    quantity: 1,
    description: "Bandages, sealant foam, a basic stimshot. Buys time.",
    consumable: {
      current: 3,
      max: 3,
      unit: "uses",
      perUse: 1,
      verb: "APPLY",
      useLabel: "USE — HEAL 1d5",
      depletedMsg: "KIT EMPTY",
      foundAmount: 3,
      foundLabel: "FIRST AID KIT"
    },
    stats: {
      "Heals": "1d5 Health per use",
      "Contents": "Bandages, foam sealant, stimshot"
    }
  },
  {
    id: "item-008",
    type: "tool",
    name: "Comms Unit",
    icon: "icons/items/comms.svg",
    quantity: 1,
    description: "Short range radio. Works unless the ship doesn't want it to.",
    stats: {
      "Range": "Short (shipboard)",
      "Encryption": "Standard",
      "Battery": "24 hours",
      "Condition": "Functional"
    }
  },
  {
    id: "item-009",
    type: "consumable",
    name: "Rations",
    icon: "icons/items/rations.svg",
    quantity: 3,
    description: "Three days of food bars. They taste like nothing on purpose.",
    consumable: {
      current: 3,
      max: 3,
      unit: "days",
      perUse: 1,
      verb: "EAT",
      useLabel: "CONSUME RATION",
      depletedMsg: "NO RATIONS LEFT"
    },
    stats: {
      "Nutrition": "1 day per unit",
      "Taste": "Intentionally absent"
    }
  },
  {
    id: "item-010",
    type: "tool",
    name: "Paracord",
    icon: "icons/items/paracord.svg",
    quantity: 1,
    description: "Fifty feet. Marines find a use for it every single time.",
    stats: {
      "Length": "50 feet",
      "Rating": "550 lb tensile",
      "Condition": "New"
    }
  },
  // --- CONSUMABLES ---
  {
    id: "item-011",
    type: "consumable",
    name: "Combat Stim",
    icon: "icons/items/stim.svg",
    quantity: 1,
    description: "One use. Keeps you moving when your body says stop. You'll feel it later.",
    consumable: {
      current: 1,
      max: 1,
      unit: "dose",
      perUse: 1,
      verb: "INJECT",
      useLabel: "INJECT STIM",
      depletedMsg: "STIM SPENT"
    },
    stats: {
      "Effect": "Ignore wounds, +1 Speed for 10 min",
      "Side Effect": "Stress +2 when it wears off"
    }
  },
];

/* ------------------------------------------
   MEDIA FILES
   Types: image, video
   src should point to files in /data/media/
   thumb is optional (auto-uses src for images)
   ------------------------------------------ */
const MEDIA_FILES = [
  {
    id: "media-001",
    type: "image",
    name: "Crew Photo — Shore Leave, Prospero Station",
    date: "2371.03.12",
    description: "Group photo taken dockside before departure. A few of the crew smiling, arms around each other — back when the mission still felt routine. One of the last good days before the Solen Drift.",
    src: "data/media/group-photo.png",
    thumb: "data/media/group-photo.png"
  },
  {
    id: "media-002",
    type: "video",
    name: "CARC-9A Sighting — Cargo Cam 3",
    date: "2371.03.22",
    description: "Security footage recovered from cargo bay camera 3. Brief visual contact with an unidentified organism moving between storage containers. Footage is degraded — subject appears to shift form mid-frame. Timestamp corruption suggests electromagnetic interference at close range.",
    src: "data/media/carc-9a-sighting.MP4",
    thumb: ""
  }
];
