/* ============================================
   CARC-7A — T4-84 Field Notes (co-op)
   Letters/notes the GM can reveal to the crew as they explore the derelict
   survey cruiser T4-84. Mostly dread, with goofy humor for punctuation.
   Written to be easy to follow for younger players.
     tone: "casual" | "dread" | "cryptic"
   ============================================ */

(function () {
  "use strict";

  window.DUO_NOTES = [
    // --- casual / goofy (early; makes the scary stuff land harder) ---
    {
      id: "note-ration", tone: "casual", title: "Note Taped to the Snack Locker",
      body: "ROLLO. If you ate my space-cookies AGAIN, I am going to lose it.\nThose were MINE. I labeled the box. I drew a little angry face on it and everything.\n\n— Vess"
    },
    {
      id: "note-roster", tone: "casual", title: "Chore List (with Complaints)",
      body: "CAKE DUTY: Mara\nFLYING THE SHIP: Dolan\nCLEANING THE VENTS: Tuck\n\n(scribbled at the bottom)\nDo NOT let Tuck decorate the cake again. He used KETCHUP. On a CAKE."
    },
    {
      id: "note-card", tone: "casual", title: "Birthday Card",
      body: "38 missions and you STILL park the ship like a maniac.\nHappy birthday, Captain Crash.\n\n— from your favorite (and only) crew"
    },
    {
      id: "note-memo", tone: "casual", title: "Note on the Fridge",
      body: "REMINDER FOR EVERYONE:\nThe weird thing in the vents is NOT a pet.\nStop feeding it snacks. Stop giving it a name.\n\n(Greg. This means you, Greg.)\n— Captain Aliz"
    },

    // --- dread (the bulk; simple words, big creepy ideas) ---
    {
      id: "note-vents", tone: "dread", title: "Tuck's Vent Log",
      body: "Something keeps knocking inside the vents. Three nights in a row now.\nHere's the weird part: it only knocks when nobody's listening.\nThe second you stop and listen... it stops too.\nPipes don't do that. Pipes don't WAIT."
    },
    {
      id: "note-headcount", tone: "dread", title: "Night Watch — Head Count",
      body: "We counted everybody tonight. We got 13.\nWe counted again. Still 13.\nBut there are only 12 of us.\n\nSo who is the extra one?"
    },
    {
      id: "note-comms", tone: "dread", title: "New Radio Rule",
      body: "New rule, everyone follow it: do NOT say anyone's name on the radio.\nThe thing on this ship can copy our voices. It already copied Mara's.\nIt uses her voice to get people to open doors.\nIf a voice asks you to open a door — don't."
    },
    {
      id: "note-party", tone: "dread", title: "What Happened at the Party",
      body: "It was Dolan's birthday. We were all eating cake when the lights went out.\nWhen they came back on, his chair was empty. And pushed in. All neat and tidy.\nWe didn't do a head count after that.\nWe were scared of what the number would be."
    },
    {
      id: "note-arranged", tone: "dread", title: "Why Is Everything So Tidy?",
      body: "People's stuff keeps showing up in neat little piles. Boots lined up. Bags zipped. Everything in a perfect row.\nNobody is cleaning up. But SOMETHING is.\nIt takes the person... and leaves their things stacked up nice and neat.\nThat's the part that scares me."
    },
    {
      id: "note-mimic", tone: "dread", title: "Watch Note — Stuck on With a Knife",
      body: "It's not just in the vents. Sometimes it pretends to BE things.\nA chair nobody pulled out. A box you walked past. A locker that was open, then closed.\nWatch for things that shouldn't have teeth.\nIf you shoot it, it lets go — but it doesn't die easy, and the noise brings more.\nDon't try to win the fight. Scare it off and RUN."
    },
    {
      id: "note-lastentry", tone: "dread", title: "The Last Note We Can Read",
      body: "If you came all the way out here looking for us — go home.\nTake the records. Tell them we got lost. Then don't come back.\nSome doors are better left shut."
    },

    // --- cryptic (drop a few, late; short and eerie) ---
    {
      id: "note-count", tone: "cryptic", title: "Written on the Wall",
      body: "DON'T COUNT THEM.\nIT LIKES BEING COUNTED."
    },
    {
      id: "note-allpresent", tone: "cryptic", title: "A Page Full of Tally Marks",
      body: "(line after line of little tally marks... then, in different ink:)\n\nEVERYONE IS HERE.\nEVERYONE IS HERE.\nEVERYONE IS HERE."
    },
    {
      id: "note-rule", tone: "cryptic", title: "Scratched Into a Table",
      body: "RULE:\nIF YOU DON'T REMEMBER PUTTING IT DOWN,\nDON'T PICK IT UP."
    },
    {
      id: "note-answers", tone: "cryptic", title: "Folded Up Inside a Helmet",
      body: "It can talk now.\nIf you call a name down the hallway... something calls back. In that person's voice. From the dark.\nDon't go toward the voice.\nThe voice is the trap, not the thing."
    }
  ];
})();
