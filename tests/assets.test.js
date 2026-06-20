/* ============================================
   CARC-7A — Audio Asset Path Tests
   Uses Node's built-in test runner (node:test) — no npm dependencies.
   Run with: npm test  OR  node --test
   ============================================ */

"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const SFX_DIR = path.join(__dirname, "..", "data", "media", "sfx");

const EXPECTED_FILES = [
  "sci-fi-alert.wav",
  "sci-fi-error.wav",
  "revolver-shot.wav",
  "revolver-reload.wav",
  "rifle-shot.wav",
  "rifle-burst.wav",
  "rifle-reload.wav",
  "gun-empty.wav",
  "chainsword.mp3",
  "alarm.mp3",
  "radio-static.mp3",
  "radio-switch.wav",
  "heartbeat-low.mp3",
  "heal.mp3",
  "eat.aiff",
  "spaceship-roar.mp3",
];

test("all 16 expected sfx files exist in data/media/sfx/", function () {
  for (const name of EXPECTED_FILES) {
    const fullPath = path.join(SFX_DIR, name);
    assert.ok(
      fs.existsSync(fullPath),
      "Missing sfx file: " + name + " (expected at " + fullPath + ")"
    );
  }
});

test("js/audio.js contains no old soundeffects paths", function () {
  const src = fs.readFileSync(
    path.join(__dirname, "..", "js", "audio.js"),
    "utf8"
  );
  assert.ok(
    !src.includes("data/media/soundeffects"),
    "audio.js still references data/media/soundeffects"
  );
  assert.ok(
    !src.includes("data/media/375975"),
    "audio.js still references data/media/375975 (old sci-fi alert path)"
  );
  assert.ok(
    !src.includes("data/media/176238"),
    "audio.js still references data/media/176238 (old sci-fi error path)"
  );
});
