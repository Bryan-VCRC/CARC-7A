/* ============================================
   CARC-7A — T4-84 Field Notes (co-op)
   The library of letters/notes the GM can reveal to the crew as they
   explore the derelict survey cruiser T4-84. Mostly dread, with a little
   dark humor for punctuation. Loaded by both the GM console (to reveal)
   and is sent to the terminal verbatim over the sync layer.
     tone: "casual" | "dread" | "cryptic"
   ============================================ */

(function () {
  "use strict";

  window.DUO_NOTES = [
    // --- casual / human (early, makes the dread land harder) ---
    {
      id: "note-ration", tone: "casual", title: "Galley Door — Taped Note",
      body: "Rollo. If you ate my saved ration again I will space you. This is not a bit.\n\n— Vess"
    },
    {
      id: "note-roster", tone: "casual", title: "Duty Roster (Annotated)",
      body: "CAKE DUTY: Mara.\nNAV: Dolan.\nVENTS: Tuck.\n\n(scrawled) Do NOT let Tuck near the frosting again. Last time was a war crime."
    },
    {
      id: "note-card", tone: "casual", title: "Birthday Card",
      body: "Thirty-eight runs out and you STILL can't dock clean.\nHappy birthday, old man.\n\n— the whole sorry crew"
    },
    {
      id: "note-memo", tone: "casual", title: "Ship-Wide Memo",
      body: "The thing in the portside vents is NOT a sanctioned morale initiative.\nStop feeding it.\nStop naming it.\n\n— Capt. Aliz"
    },

    // --- dread (the bulk) ---
    {
      id: "note-vents", tone: "dread", title: "Maintenance Log — Tuck",
      body: "Knocking in the portside vents. Third night running.\nIt stops the exact second you stop to listen.\nPipes don't do that. Pipes don't wait."
    },
    {
      id: "note-headcount", tone: "dread", title: "Watch Log — 0200",
      body: "Did a head count at change of watch. Got thirteen.\nDid it again. Thirteen.\nThere are twelve of us."
    },
    {
      id: "note-comms", tone: "dread", title: "Comms Discipline Order",
      body: "Effective now: no names on open comms.\nNo exceptions.\n\nIt learned Mara's voice first. It uses it when it wants the doors opened."
    },
    {
      id: "note-party", tone: "dread", title: "Recovered Page — The Party",
      body: "We threw Dolan his birthday in the main hold. Halfway through the cake the lights went.\nWhen they came back his chair was empty. Tucked in. Neat.\nWe kept singing. We didn't know what else to do.\nWe didn't do another head count. We were afraid of the number."
    },
    {
      id: "note-arranged", tone: "dread", title: "Quartermaster's Note",
      body: "Their kit keeps turning up stacked. Boots paired. Tags squared off. Rifles laid parallel.\nNobody's tidying. It tidies.\nIt takes the person and leaves the things exactly so."
    },
    {
      id: "note-mimic", tone: "dread", title: "Watch Note — Pinned by a Knife",
      body: "It isn't only in the vents.\nSometimes it's the chair nobody pulled out. The crate you walked past twice. The locker that was open, then wasn't.\nWatch the things that shouldn't have teeth. Shoot them and they let go — but they don't die easy, and the noise brings more.\nDon't stand and fight. Make it flinch and run."
    },
    {
      id: "note-rule", tone: "cryptic", title: "Scratched Into a Mess Table",
      body: "RULE:\nIF YOU DON'T REMEMBER SETTING IT DOWN,\nDON'T PICK IT UP."
    },
    {
      id: "note-lastentry", tone: "dread", title: "Last Legible Entry",
      body: "If you came out here looking for us — don't.\nTake the flight records. Tell the Authority we navigated wrong.\nLet it stay closed. Let us stay a clerical error."
    },

    // --- cryptic (drop sparingly, late) ---
    {
      id: "note-count", tone: "cryptic", title: "Scrawled on the Bulkhead",
      body: "DON'T COUNT THEM.\nIT LIKES BEING COUNTED."
    },
    {
      id: "note-allpresent", tone: "cryptic", title: "Page of Tally Marks",
      body: "(rows and rows of tally marks, then, in different ink:)\n\nALL PRESENT.\nALL PRESENT.\nALL PRESENT."
    },
    {
      id: "note-answers", tone: "cryptic", title: "Folded in a Helmet",
      body: "It answers now.\nCall a name down the corridor and something answers — in that voice, from the dark.\nDo not call names. Do not go to the voice.\nThe voice is the bait, not the thing."
    }
  ];
})();
