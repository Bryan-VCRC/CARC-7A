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

  // Archives tab — T4-84 imagery (replaces the off-story solo media).
  window.DUO_ARCHIVES = [
    { id: "arc-exterior", type: "image", name: "T4-84 — Exterior", date: "ON APPROACH",
      description: "The survey cruiser, adrift. Hull intact. Nearly every window dark. One beacon still blinking.",
      src: "data/media/duos/OutsideShip.png" },
    { id: "arc-approach", type: "image", name: "Docking View", date: "T4-84 // DOCKING",
      description: "One warm light burning somewhere deep inside an otherwise lightless ship. The comms light won't stop blinking.",
      src: "data/media/duos/CruiserApproaching.png" },
    { id: "arc-corridor", type: "image", name: "Deck Corridor", date: "INTERIOR",
      description: "Empty. Fogged. The emergency lights still cycle for no one.",
      src: "data/media/duos/EmptyCorridor.png" },
    { id: "arc-hold", type: "image", name: "Main Hold", date: "INTERIOR",
      description: "Someone's birthday. The banner's half torn down. The cake was never cut.",
      src: "data/media/duos/HappyBirthday.png" },
    { id: "arc-weapons", type: "image", name: "Weapons Bay", date: "INTERIOR",
      description: "Mounts torn open, rifles snapped, spent casings across the deck. A fight — and no one left to find.",
      src: "data/media/duos/LostFight.png" },
    { id: "arc-airlock", type: "image", name: "By the Airlock", date: "INTERIOR",
      description: "Boots. Lined up. Toes squared to the wall. Nobody wearing them. Nothing here is messy anymore.",
      src: "data/media/duos/OrganizedBoots.png" },
  ];
})();
