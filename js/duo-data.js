/* ============================================
   CARC-7A — Co-op Journal (first pass)
   Pulls the existing ship logs from data.js and prepends a two-crew
   framing entry. These are placeholders for a proper co-op rewrite later;
   archives (media) are pulled from data.js as-is.
   ============================================ */

(function () {
  "use strict";

  var base = (typeof JOURNAL_ENTRIES !== "undefined" && Array.isArray(JOURNAL_ENTRIES))
    ? JOURNAL_ENTRIES
    : [];

  // Co-op framing entry — addressed to the two crew sharing this terminal.
  var intro = {
    id: "duo-000",
    type: "memo",
    title: "Crew Terminal — Two-Person Protocol",
    date: "CORRIGAN.D0",
    author: "WARDEN SYSTEM",
    classification: "open",
    body: `Two of you are signed in. That is not an accident.

Warden Protocol assumes a two-person watch: one set of eyes is how people die out here. Keep both terminals live. Share what you find. If one of you goes down, the other is the only reason this log keeps updating.

The records below were recovered from the ISV Corrigan's analyst station. They were written by one person, alone, near the end. Read them together. You will have an advantage she did not.`
  };

  // First pass: intro + the recovered logs, pulled verbatim. We'll rewrite the
  // individual entries for a two-crew voice in a later pass.
  window.DUO_JOURNAL = [intro].concat(base);
})();
