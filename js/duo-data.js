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
})();
