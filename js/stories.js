/* ============================================
   CARC-7A — Story Packs
   Swappable narrative content for co-op mode.
   Each pack contains: briefing (typewriter lines),
   journal entries, field notes, and archive images.
   Image paths are bare filenames; the engine resolves
   them to data/stories/<id>/<filename>.
   ============================================ */

(function () {
  "use strict";

  window.STORIES = {
    "t4-84": {
      title: "T4-84: It Took Us",
      blurb: "A derelict survey cruiser, three months silent. No crew. A party that never ended.",

      briefing: [
        "INCOMING CONTRACT // COLONIAL RESOURCE AUTHORITY",
        "",
        "Survey cruiser T4-84 went dark three months ago.",
        "No distress call. No escape pods. No beacon.",
        "",
        "The only transmission ever recovered arrived",
        "forty-two minutes after the last check-in.",
        "Audio destroyed. Nav unreadable.",
        "Three words survived intact:",
        "",
        "IT TOOK US.",
        "",
        "You are bounty hunters. Underfunded. Expendable.",
        "Recover whatever explains it. Survivors pay more.",
        "",
        "The cruiser is dead ahead — running, warm,",
        "and still broadcasting:",
        "",
        "\"All clear. Come aboard. Party's still going.\"",
      ],

      journal: [
        {
          id: "duo-contract",
          type: "memo",
          title: "Contract — Survey Cruiser T4-84",
          date: "RECOVERY CONTRACT",
          author: "COLONIAL RESOURCE AUTHORITY",
          classification: "open",
          body: `Survey cruiser T4-84 went dark three months ago. No distress call. No escape pods. No beacon.

Recover anything that explains it — flight records, sensor logs, salvage. Survivors pay more. A lot more.

Your ship is small, underfunded, and expendable. So are you. That's why the rate is generous.

OBJECTIVE: Rendezvous with T4-84. Establish contact. Recover evidence. Survive.`
        },
        {
          id: "duo-approach",
          type: "log",
          title: "Approach — Something's Still Broadcasting",
          date: "T4-84 // DOCKING",
          author: "CREW — INBOUND",
          classification: "open",
          body: `The cruiser's warm. Life support's running. Hull's intact. And it's still transmitting.

Same loop, open channel, friendly and relaxed: "All clear. Come aboard. Party's still going."

— "Nobody's answered a hail in three months, but the party line's open?"
— "Contract says verify the signal. So we verify the signal."

Hard dock confirmed. The message hasn't changed once — not the words, not the breath between them.`
        },
        {
          id: "duo-transmission",
          type: "document",
          title: "The Only Transmission Ever Recovered",
          date: "+42 MIN AFTER FINAL CHECK-IN",
          author: "T4-84",
          classification: "restricted",
          body: `[AUDIO CHANNELS DESTROYED]
[NAVIGATION DATA UNREADABLE]
[BODY OF MESSAGE CORRUPTED — UNRECOVERABLE]

Only the transmission label survived intact.

Three words.

IT TOOK US.`
        }
      ],

      notes: [
        // --- casual / goofy (early; makes the scary stuff land harder) ---
        {
          id: "note-ration", tone: "casual", title: "Note SLAMMED on the Snack Locker",
          body: "DID SOMEONE EAT MY OREOS AGAIN???\nThese were MINE. I hid them. I LABELED them. I drew a skull on the box.\nIf I find out who did it, I am launching you out the airlock myself.\nI'm not even mad. Okay I'm a little mad. I'm extremely mad.\n\n— Vess"
        },
        {
          id: "note-roster", tone: "casual", title: "Chore List (Heavily Vandalized)",
          body: "CAKE DUTY: Mara\nFLY THE SHIP: Dolan\nVENT DUTY: Tuck\n\n(scribbled all over)\nWHY is it ALWAYS me on vents?? I've done it SIX times in a row. Tuck has done it ZERO times. ZERO. This is rigged.\nAlso Tuck is banned from cake forever. We do not talk about the ketchup incident."
        },
        {
          id: "note-card", tone: "casual", title: "Birthday Card",
          body: "38 missions and you STILL fly like you're being chased by bees.\nHappy birthday, Captain Crash.\nPlease, for the love of everything, let someone else park next time.\n\n— everyone. unanimously."
        },
        {
          id: "note-memo", tone: "casual", title: "Note Stuck to the Fridge",
          body: "OKAY. Who keeps feeding the thing in the vents.\nIt is NOT a pet. It is NOT cute. It does NOT need a name.\nGREG. We all know it's you, Greg. I can see you reading this. STOP.\n\n— Capt. Aliz"
        },

        // --- dread (spare, ambient; the horror is in what isn't said) ---
        {
          id: "note-vents", tone: "dread", title: "Vent Log",
          body: "The knocking in the walls again.\nIt only happens when no one is listening.\nTonight I held my breath to hear it better.\n\nIt held its breath too."
        },
        {
          id: "note-headcount", tone: "dread", title: "Night Watch",
          body: "We counted. Twelve.\nWe counted again. Thirteen.\nNobody wanted to count a third time."
        },
        {
          id: "note-comms", tone: "dread", title: "Radio Note",
          body: "Mara still says goodnight over the radio. Same time, every night.\nWe tried answering — asked her where she is, told her to come to the bridge.\nShe just says goodnight.\nShe's been gone a week.\nIt's her voice. We don't think it's her.\nWe stopped answering."
        },
        {
          id: "note-party", tone: "dread", title: "The Main Hold", image: "HappyBirthday.png",
          body: "Looks like a birthday. The banner's torn off mid-word.\nThe cake's still on the table — candles burned down to stubs, never cut.\nThe air's sweet in here. Old frosting, burnt-out wax, and something sour underneath it you can't place.\nMost of the chairs are pushed in neat. One sits a little apart, squared up to the table.\nLike someone got up in the middle of it, and something tidied the chair back in for them."
        },
        {
          id: "note-arranged", tone: "dread", title: "By the Airlock", image: "OrganizedBoots.png",
          body: "A pair of boots by the airlock. Laced, set side by side, toes squared to the wall.\nA jacket folded on top.\nNo sign of whoever was wearing them.\nIt smells like cold metal and ozone over here. Clean. Too clean.\nWhatever happened, it left everything tidy."
        },
        {
          id: "note-mimic", tone: "dread", title: "Watch Note",
          body: "The Stowaways copy the furniture. A chair. A crate. The locker that was open a second ago.\nWhile they're pretending, bullets do nothing — you just make noise and bring more.\nThey have to open up to grab you. That half-second is the only time a shot lands.\nOne round to make it flinch, then RUN.\nThe ones who stayed to finish the job didn't leave notes."
        },
        {
          id: "note-lastentry", tone: "dread", title: "Last Entry",
          body: "If you're reading this, you came looking.\nI'm sorry.\nTake what you need and go.\n\nDon't say my name on the way out."
        },

        // --- cryptic (short, eerie; drop a few, late) ---
        {
          id: "note-count", tone: "cryptic", title: "On the Wall",
          body: "DON'T COUNT THEM.\nIT LIKES BEING COUNTED."
        },
        {
          id: "note-allpresent", tone: "cryptic", effect: "allhere", title: "A Page Full of the Same Words",
          image: "wearehere.png",
          body: "WE ARE ALL HERE.\n".repeat(60).trim()
        },
        {
          id: "note-rule", tone: "cryptic", title: "Scratched Into a Table",
          body: "IF YOU DON'T REMEMBER PUTTING IT DOWN,\nDON'T PICK IT UP."
        },
        {
          id: "note-answers", tone: "cryptic", title: "Folded Inside a Helmet",
          body: "Call a name down the hall and something answers.\nIt uses their voice.\nIt is not them.\n\nDon't go to the voice."
        }
      ],

      archives: [
        { id: "arc-exterior", type: "image", name: "T4-84 — Exterior", date: "ON APPROACH",
          requires: "duo-approach",
          description: "The survey cruiser, adrift. Hull intact. Nearly every window dark. One beacon still blinking.",
          image: "OutsideShip.png" },
        { id: "arc-approach", type: "image", name: "Docking View", date: "T4-84 // DOCKING",
          requires: "duo-approach",
          description: "One warm light burning somewhere deep inside an otherwise lightless ship. The comms light won't stop blinking.",
          image: "CruiserApproaching.png" },
        { id: "arc-corridor", type: "image", name: "Deck Corridor", date: "INTERIOR",
          requires: "note-vents",
          description: "Empty. Fogged. The emergency lights still cycle for no one. The air's damp down here — mildew and cold ozone.",
          image: "EmptyCorridor.png" },
        { id: "arc-hold", type: "image", name: "Main Hold", date: "INTERIOR",
          requires: "note-party",
          description: "Someone's birthday. The banner's half torn down, the cake never cut. It smells sweet in here — old frosting and burnt-out wax — and something sour underneath.",
          image: "HappyBirthday.png" },
        { id: "arc-weapons", type: "image", name: "Weapons Bay", date: "INTERIOR",
          requires: "note-mimic",
          description: "Mounts torn open, rifles snapped, spent casings across the deck. The air still carries burnt propellant. A fight — and no one left to find.",
          image: "LostFight.png" },
        { id: "arc-airlock", type: "image", name: "By the Airlock", date: "INTERIOR",
          requires: "note-arranged",
          description: "Boots. Lined up. Toes squared to the wall. Nobody wearing them. It smells like cold metal over here. Clean. Too clean.",
          image: "OrganizedBoots.png" },
      ]
    }
  };
})();
