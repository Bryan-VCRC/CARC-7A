const test = require("node:test");
const assert = require("node:assert");

global.window = {};
const StoryImport = require("../js/story-import.js");

// A realistic pasted pack: bare entry, template-literal body, .repeat(), trailing comma.
const PASTED = `"derelict-halls": {
  title: "Derelict Halls",
  blurb: "A station gone quiet.",
  briefing: ["LINE ONE", "", "LINE TWO"],
  journal: [
    { id: "log-1", type: "memo", title: "Contract", body: \`Multi
line body\` },
  ],
  notes: [
    { id: "note-1", tone: "casual", title: "A Note", body: "hi" },
    { id: "note-all", tone: "cryptic", effect: "allhere", title: "Page", image: "page.png", body: "WE ARE ALL HERE.\\n".repeat(60).trim() },
  ],
  archives: [
    { id: "arc-1", type: "image", name: "Exterior", requires: "log-1", description: "x", image: "exterior.png" },
  ],
},`;

test("parse reads a bare entry into { id, story }", () => {
  const { id, story } = StoryImport.parse(PASTED);
  assert.equal(id, "derelict-halls");
  assert.equal(story.title, "Derelict Halls");
  assert.equal(story.briefing.length, 3);
  assert.equal(story.notes.length, 2);
  // .repeat() executed during parse
  assert.ok(story.notes[1].body.startsWith("WE ARE ALL HERE."));
});

test("parse tolerates a markdown code fence and a window.STORIES wrapper", () => {
  const fenced = "```js\nwindow.STORIES = {\n" + PASTED + "\n};\n```";
  const { id, story } = StoryImport.parse(fenced);
  assert.equal(id, "derelict-halls");
  assert.equal(story.title, "Derelict Halls");
});

test("parse throws on empty or junk input", () => {
  assert.throws(() => StoryImport.parse(""));
  assert.throws(() => StoryImport.parse("not a story at all"));
});

test("validate passes a well-formed pack and collects images", () => {
  const { id, story } = StoryImport.parse(PASTED);
  const v = StoryImport.validate(id, story);
  assert.equal(v.ok, true);
  assert.deepEqual(v.errors, []);
  assert.deepEqual(v.images.sort(), ["exterior.png", "page.png"]);
});

test("validate rejects a bad id and a path-y image", () => {
  const v = StoryImport.validate("Bad ID", {
    title: "T", briefing: ["x"], journal: [], notes: [], archives: [
      { id: "a", type: "image", name: "n", requires: "x", image: "sub/dir.png" },
    ],
  });
  assert.equal(v.ok, false);
  assert.ok(v.errors.some((e) => /lowercase/.test(e)));
  assert.ok(v.errors.some((e) => /bare filename/.test(e)));
});

test("validate requires title and a non-empty briefing", () => {
  const v = StoryImport.validate("ok-id", { briefing: [] });
  assert.equal(v.ok, false);
  assert.ok(v.errors.some((e) => /title/.test(e)));
  assert.ok(v.errors.some((e) => /briefing/.test(e)));
});

test("validate warns on a dangling archive requires", () => {
  const v = StoryImport.validate("ok-id", {
    title: "T", blurb: "b", briefing: ["x"],
    journal: [], notes: [{ id: "n1", tone: "dread", title: "t", body: "b" }],
    archives: [{ id: "a", type: "image", name: "Orphan", requires: "nope", image: "a.png" }],
  });
  assert.equal(v.ok, true); // dangling requires is a warning, not an error
  assert.ok(v.warnings.some((w) => /never unlock/.test(w)));
});
