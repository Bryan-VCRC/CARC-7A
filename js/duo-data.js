/* ============================================
   CARC-7A — Co-op Journal: T4-84 ("It took us")
   Minimal starter entries for the two bounty hunters. The bulk of the
   atmosphere comes from field notes the GM reveals during play (see
   js/duo-notes.js). Solo journal (js/data.js JOURNAL_ENTRIES) is untouched.
   ============================================ */

(function () {
  "use strict";

  window.DUO_JOURNAL = [
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
  ];

  // Archives tab — T4-84 imagery. Each image only appears once its related
  // journal entry / field note is in play (see `requires` -> a journal id).
  // The exterior/approach are tied to the always-present approach log; the
  // interior shots unlock as the GM reveals the matching notes.
  window.DUO_ARCHIVES = [
    { id: "arc-exterior", type: "image", name: "T4-84 — Exterior", date: "ON APPROACH",
      requires: "duo-approach",
      description: "The survey cruiser, adrift. Hull intact. Nearly every window dark. One beacon still blinking.",
      src: "data/media/duos/OutsideShip.png" },
    { id: "arc-approach", type: "image", name: "Docking View", date: "T4-84 // DOCKING",
      requires: "duo-approach",
      description: "One warm light burning somewhere deep inside an otherwise lightless ship. The comms light won't stop blinking.",
      src: "data/media/duos/CruiserApproaching.png" },
    { id: "arc-corridor", type: "image", name: "Deck Corridor", date: "INTERIOR",
      requires: "note-vents",
      description: "Empty. Fogged. The emergency lights still cycle for no one. The air's damp down here — mildew and cold ozone.",
      src: "data/media/duos/EmptyCorridor.png" },
    { id: "arc-hold", type: "image", name: "Main Hold", date: "INTERIOR",
      requires: "note-party",
      description: "Someone's birthday. The banner's half torn down, the cake never cut. It smells sweet in here — old frosting and burnt-out wax — and something sour underneath.",
      src: "data/media/duos/HappyBirthday.png" },
    { id: "arc-weapons", type: "image", name: "Weapons Bay", date: "INTERIOR",
      requires: "note-mimic",
      description: "Mounts torn open, rifles snapped, spent casings across the deck. The air still carries burnt propellant. A fight — and no one left to find.",
      src: "data/media/duos/LostFight.png" },
    { id: "arc-airlock", type: "image", name: "By the Airlock", date: "INTERIOR",
      requires: "note-arranged",
      description: "Boots. Lined up. Toes squared to the wall. Nobody wearing them. It smells like cold metal over here. Clean. Too clean.",
      src: "data/media/duos/OrganizedBoots.png" },
  ];
})();
