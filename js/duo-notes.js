/* ============================================
   CARC-7A — T4-84 Field Notes (co-op)
   Letters/notes the GM can reveal to the crew as they explore the derelict
   survey cruiser T4-84. Casual notes are goofy young-teen humor; the scary
   ones are spare and ambient (Silent Hill style) — the dread lives in the
   gaps, not in explanation. Kept simple enough for younger players.
     tone: "casual" | "dread" | "cryptic"
   ============================================ */

(function () {
  "use strict";

  window.DUO_NOTES = [
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
      id: "note-party", tone: "dread", title: "The Party",
      body: "The lights went out during the cake.\nWhen they came back, Dolan's chair was empty.\nSomeone had pushed it in.\n\nWe finished the song. I don't know why we finished the song."
    },
    {
      id: "note-arranged", tone: "dread", title: "By the Door",
      body: "Found Pavel's boots by the airlock.\nLaced. Side by side. Toes to the wall.\nPavel isn't here.\n\nNothing on this ship is messy anymore."
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
  ];
})();
