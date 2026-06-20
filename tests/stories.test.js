/* ============================================
   CARC-7A — Story Pack Tests
   Uses Node's built-in test runner (node:test) — no npm dependencies.
   Run with: npm test  OR  node --test
   ============================================ */

"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

// Stub window so the IIFE in stories.js can assign to window.STORIES
global.window = {};

require("../js/stories.js");

const STORY_DIR = path.join(__dirname, "..", "data", "stories", "t4-84");

test("window.STORIES['t4-84'] exists with non-empty title and blurb", function () {
  assert.ok(window.STORIES, "window.STORIES is not defined");
  const story = window.STORIES["t4-84"];
  assert.ok(story, "window.STORIES['t4-84'] is missing");
  assert.ok(typeof story.title === "string" && story.title.length > 0, "title is empty");
  assert.ok(typeof story.blurb === "string" && story.blurb.length > 0, "blurb is empty");
});

test("briefing is a non-empty array", function () {
  const story = window.STORIES["t4-84"];
  assert.ok(Array.isArray(story.briefing), "briefing is not an array");
  assert.ok(story.briefing.length > 0, "briefing is empty");
});

test("journal has exactly 3 entries", function () {
  const story = window.STORIES["t4-84"];
  assert.ok(Array.isArray(story.journal), "journal is not an array");
  assert.strictEqual(story.journal.length, 3, "expected 3 journal entries");
});

test("notes has exactly 15 entries", function () {
  const story = window.STORIES["t4-84"];
  assert.ok(Array.isArray(story.notes), "notes is not an array");
  assert.strictEqual(story.notes.length, 15, "expected 15 notes");
});

test("archives has exactly 6 entries", function () {
  const story = window.STORIES["t4-84"];
  assert.ok(Array.isArray(story.archives), "archives is not an array");
  assert.strictEqual(story.archives.length, 6, "expected 6 archive entries");
});

test("all notes[].image values are bare filenames and files exist", function () {
  const story = window.STORIES["t4-84"];
  for (const note of story.notes) {
    if (!note.image) continue;
    assert.ok(
      !note.image.includes("/"),
      "notes[" + note.id + "].image contains a slash: " + note.image
    );
    const fullPath = path.join(STORY_DIR, note.image);
    assert.ok(
      fs.existsSync(fullPath),
      "notes[" + note.id + "].image file missing: " + fullPath
    );
  }
});

test("all archives[].image values are bare filenames and files exist", function () {
  const story = window.STORIES["t4-84"];
  for (const arc of story.archives) {
    if (!arc.image) continue;
    assert.ok(
      !arc.image.includes("/"),
      "archives[" + arc.id + "].image contains a slash: " + arc.image
    );
    const fullPath = path.join(STORY_DIR, arc.image);
    assert.ok(
      fs.existsSync(fullPath),
      "archives[" + arc.id + "].image file missing: " + fullPath
    );
  }
});
