/* ============================================
   CARC-7A — Loadout Builder Tests
   Uses Node's built-in test runner (node:test) — no npm dependencies.
   Run with: npm test  OR  node --test
   ============================================ */

"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

// Stub the browser global before loading the module.
global.window = {};
require("../js/items.js");

test("buildLoadout({weapon:'revolver',armor:'leather'}) returns 5 items with correct keys", function () {
  var items = window.buildLoadout({ weapon: "revolver", armor: "leather" });
  assert.strictEqual(items.length, 5, "should return 5 items");
  var keys = items.map(function (it) { return it.key; });
  assert.deepStrictEqual(keys, ["revolver", "leather_jacket", "flashlight", "rope", "first_aid"]);
});

test("buildLoadout({weapon:'revolver',armor:'leather'}) items each have a unique truthy id", function () {
  var items = window.buildLoadout({ weapon: "revolver", armor: "leather" });
  var ids = items.map(function (it) { return it.id; });
  ids.forEach(function (id) {
    assert.ok(id, "each item should have a truthy id");
  });
  var unique = new Set(ids);
  assert.strictEqual(unique.size, ids.length, "all ids should be unique");
});

test("buildLoadout({weapon:'revolver',armor:'leather'}) revolver and leather_jacket have photo", function () {
  var items = window.buildLoadout({ weapon: "revolver", armor: "leather" });
  var byKey = {};
  items.forEach(function (it) { byKey[it.key] = it; });
  assert.ok(byKey.revolver.photo, "revolver should have a photo");
  assert.ok(byKey.leather_jacket.photo, "leather_jacket should have a photo");
});

test("buildLoadout({weapon:'chainsword',armor:'light'}) returns chainsword + light_armor", function () {
  var items = window.buildLoadout({ weapon: "chainsword", armor: "light" });
  assert.strictEqual(items.length, 5, "should return 5 items");
  var keys = items.map(function (it) { return it.key; });
  assert.deepStrictEqual(keys, ["chainsword", "light_armor", "flashlight", "rope", "first_aid"]);
});

test("buildLoadout items are deep clones (mutations do not affect catalog)", function () {
  var items = window.buildLoadout({ weapon: "revolver", armor: "light" });
  var rev = items.find(function (it) { return it.key === "revolver"; });
  var origAmmo = window.ITEMS.revolver.ammo.current;
  rev.ammo.current = 0;
  assert.strictEqual(window.ITEMS.revolver.ammo.current, origAmmo, "catalog should not be mutated");
});

test("buildLoadout defaults: no loadout arg gives revolver + light_armor", function () {
  var items = window.buildLoadout({});
  var keys = items.map(function (it) { return it.key; });
  assert.deepStrictEqual(keys, ["revolver", "light_armor", "flashlight", "rope", "first_aid"]);
});
