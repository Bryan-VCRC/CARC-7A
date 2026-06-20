/* ============================================
   CARC-7A — Story Import
   Parse + validate a story pack pasted from ChatGPT.
   Pure logic; usable in the browser (window.StoryImport)
   and under node:test (module.exports).
   ============================================ */

(function (root) {
  "use strict";

  // Strip markdown code fences and any window.STORIES = {...} wrapper, so we
  // tolerate ChatGPT occasionally wrapping its output despite instructions.
  function clean(text) {
    var t = String(text == null ? "" : text).trim();
    t = t.replace(/^```[a-zA-Z0-9]*\s*\n?/, "").replace(/\n?```\s*$/, "").trim();
    var assign = t.match(/window\.STORIES\s*=\s*(\{[\s\S]*\})\s*;?\s*$/);
    if (assign) t = assign[1].trim();
    return t;
  }

  function evalObject(src) {
    // The pasted pack is a JS object literal (template strings, .repeat(), etc.),
    // not JSON — so we evaluate it. This runs the user's own pasted ChatGPT
    // output on their own local machine; acceptable for this personal tool.
    /* eslint-disable no-new-func */
    return new Function("return (" + src + ");")();
    /* eslint-enable no-new-func */
  }

  // Accepts either a bare entry  ("id": { ... })  or a map  ({ "id": { ... } }).
  // Returns { id, story }.
  function parse(text) {
    var t = clean(text);
    if (!t) throw new Error("Nothing to read — paste the story first.");

    var candidates = [];
    try { candidates.push(evalObject("{" + t.replace(/,\s*$/, "") + "}")); } catch (e) {}
    try { candidates.push(evalObject(t)); } catch (e) {}

    for (var i = 0; i < candidates.length; i++) {
      var c = candidates[i];
      if (c && typeof c === "object" && !Array.isArray(c)) {
        var keys = Object.keys(c);
        if (keys.length === 1 && c[keys[0]] && typeof c[keys[0]] === "object" && !Array.isArray(c[keys[0]])) {
          return { id: keys[0], story: c[keys[0]] };
        }
      }
    }
    throw new Error('Could not read a single story. Paste ChatGPT\'s output starting with "your-id": { ... }');
  }

  function collectIds(story) {
    var ids = {};
    ["journal", "notes"].forEach(function (sec) {
      (Array.isArray(story[sec]) ? story[sec] : []).forEach(function (e) {
        if (e && e.id) ids[e.id] = true;
      });
    });
    return ids;
  }

  // Returns { ok, errors, warnings, images } — images is the de-duped list of
  // bare filenames the pack expects under data/stories/<id>/.
  function validate(id, story) {
    var errors = [], warnings = [], images = [];

    if (!/^[a-z0-9][a-z0-9-]*$/.test(String(id || ""))) {
      errors.push('Story id "' + id + '" must be lowercase letters, numbers and hyphens (e.g. "derelict-halls").');
    }
    if (!story || typeof story !== "object") {
      errors.push("Story body is not an object.");
      return { ok: false, errors: errors, warnings: warnings, images: images };
    }
    if (!story.title) errors.push("Missing title.");
    if (!story.blurb) warnings.push("No blurb — the launcher card will be blank under the title.");
    if (!Array.isArray(story.briefing) || !story.briefing.length) {
      errors.push("briefing must be a non-empty array of intro lines.");
    }
    ["journal", "notes", "archives"].forEach(function (sec) {
      if (story[sec] != null && !Array.isArray(story[sec])) errors.push(sec + " must be an array.");
    });
    if (!Array.isArray(story.notes) || !story.notes.length) warnings.push("No field notes — the GM will have nothing to reveal.");
    if (!Array.isArray(story.archives) || !story.archives.length) warnings.push("No archives — there will be no images to uncover.");

    var ids = collectIds(story);

    var allHere = 0;
    (Array.isArray(story.notes) ? story.notes : []).forEach(function (n) {
      if (!n || typeof n !== "object") return;
      if (!n.id) warnings.push("A field note is missing an id.");
      if (n.image) images.push(n.image);
      if (n.effect === "allhere") allHere++;
    });
    if (allHere > 1) warnings.push('More than one note has effect "allhere"; only one set-piece is intended.');

    (Array.isArray(story.journal) ? story.journal : []).forEach(function (e) {
      if (e && e.image) images.push(e.image);
    });

    (Array.isArray(story.archives) ? story.archives : []).forEach(function (a) {
      if (!a || typeof a !== "object") return;
      if (a.image) images.push(a.image);
      if (a.requires && !ids[a.requires]) {
        warnings.push('Archive "' + (a.name || a.id || "?") + '" requires "' + a.requires + '", which no journal entry or note defines — it will never unlock.');
      }
    });

    images = images.filter(function (v, i) { return v && images.indexOf(v) === i; });
    images.forEach(function (im) {
      if (/[\/\\]/.test(im)) errors.push('Image "' + im + '" must be a bare filename (no folders), e.g. "corridor.png".');
    });

    return { ok: errors.length === 0, errors: errors, warnings: warnings, images: images };
  }

  var api = { parse: parse, validate: validate, clean: clean };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (root) root.StoryImport = api;
})(typeof window !== "undefined" ? window : this);
