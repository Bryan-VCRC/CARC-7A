/* ============================================
   CARC-7A — Shared Item Catalog Tests
   Uses Node's built-in test runner (node:test) — no npm dependencies.
   Run with: npm test  OR  node --test
   ============================================ */

"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

// Stub the browser global before loading the module.
global.window = {};
require("../js/items.js");

const ITEMS = window.ITEMS;

const EXPECTED_KEYS = [
  "revolver", "chainsword", "pulse_carbine",
  "light_armor", "leather_jacket", "flashlight",
  "rope", "first_aid", "combat_stim", "defib",
  "comms", "helmet", "rations", "paracord",
];

test("window.ITEMS has exactly 14 expected keys", function () {
  const keys = Object.keys(ITEMS).sort();
  const expected = EXPECTED_KEYS.slice().sort();
  assert.deepStrictEqual(keys, expected);
});

test("every item has key matching its object key, plus non-empty type, name, description", function () {
  for (const key of EXPECTED_KEYS) {
    const item = ITEMS[key];
    assert.ok(item, "missing item: " + key);
    assert.strictEqual(item.key, key, key + ".key should equal '" + key + "'");
    assert.ok(typeof item.type === "string" && item.type.length > 0, key + ".type must be a non-empty string");
    assert.ok(typeof item.name === "string" && item.name.length > 0, key + ".name must be a non-empty string");
    assert.ok(typeof item.description === "string" && item.description.length > 0, key + ".description must be a non-empty string");
  }
});

test("five expected items have a truthy photo field", function () {
  const withPhotos = ["revolver", "chainsword", "pulse_carbine", "light_armor", "leather_jacket"];
  for (const key of withPhotos) {
    assert.ok(ITEMS[key].photo, key + " should have a truthy photo");
  }
});

test("revolver.ammo.spareMags === 1 and fireModes includes 'semi'", function () {
  const rev = ITEMS.revolver;
  assert.strictEqual(rev.ammo.spareMags, 1, "revolver.ammo.spareMags should be 1");
  assert.ok(Array.isArray(rev.fireModes), "revolver.fireModes should be an array");
  assert.ok(rev.fireModes.includes("semi"), "revolver.fireModes should include 'semi'");
});

test("first_aid, combat_stim, defib all have support objects", function () {
  for (const key of ["first_aid", "combat_stim", "defib"]) {
    const item = ITEMS[key];
    assert.ok(item.support && typeof item.support === "object",
      key + ".support should be an object");
  }
});
