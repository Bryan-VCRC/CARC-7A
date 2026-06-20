/* ============================================
   CARC-7A — Shared Item Catalog
   Single source of truth for all gear used by both the co-op terminal
   (duo.js) and the GM console (admin.html). Keyed by stable string keys.

   Fields per item:
     key          — object key (duplicated for convenience)
     type         — weapon | armor | tool | medical | consumable
     name         — display name
     icon         — svg icon path
     photo        — (optional) photo path for items that have one
     quantity     — starting quantity
     description  — flavour text
     stats        — object of stat rows
     ammo         — (optional) ammo tracker object
     fireModes    — (optional) array of fire mode strings
     consumable   — (optional) consumable tracker object
     sfx          — (optional) sound effect key
     sfxLabel     — (optional) label for the sfx button
     support      — (optional) healing/revival rules for medical items
   ============================================ */

(function () {
  "use strict";

  // --- Id generator (shared across catalog + loadout builder) ---
  var _idCounter = 0;
  function genId() {
    return "it-" + (++_idCounter).toString(36) + Math.random().toString(36).slice(2, 7);
  }

  window.ITEMS = {

    revolver: {
      key: "revolver",
      type: "weapon",
      name: "Revolver",
      icon: "icons/items/revolver.svg",
      photo: "icons/items_pics/Revolver.png",
      quantity: 1,
      description: "Six rounds, no frills. One spare speedloader. Loud enough to hear through a bulkhead.",
      ammo: { current: 6, magCapacity: 6, spareMags: 1, magLabel: "Cylinder", spareLabel: "Speedloaders" },
      fireModes: ["semi"],
      stats: { "Damage": "1d10", "Range": "Medium", "Condition": "Worn" },
    },

    chainsword: {
      key: "chainsword",
      type: "weapon",
      name: "Chainsword",
      icon: "icons/items/knife.svg",
      photo: "icons/items_pics/Chainsword.png",
      quantity: 1,
      description: "Revs hot, bites deep. Loud — and everything on this ship can hear it.",
      sfx: "chainsword",
      sfxLabel: "REV THE CHAINSWORD",
      stats: { "Damage": "2d10", "Range": "Adjacent", "Condition": "Hungry" },
    },

    pulse_carbine: {
      key: "pulse_carbine",
      type: "weapon",
      name: "Pulse Carbine",
      icon: "icons/items/carbine.svg",
      photo: "icons/items_pics/Carbine_Rifle.png",
      quantity: 1,
      description: "Fires charged kinetic rounds. Accurate, reliable, kicks like a mule.",
      ammo: { current: 20, magCapacity: 20, spareMags: 2, magLabel: "Magazine", spareLabel: "Magazines" },
      fireModes: ["semi", "burst"],
      stats: { "Damage": "2d10 (Semi) / 3d10 (Burst)", "Range": "Long", "Condition": "Functional" },
    },

    light_armor: {
      key: "light_armor",
      type: "armor",
      name: "Light Military Armor",
      icon: "icons/items/armor.svg",
      photo: "icons/items_pics/LightMilitary.png",
      quantity: 1,
      description: "Ceramic plating over a flex underlayer. Won't stop everything. Stops enough.",
      stats: { "Armor Points": "2 AP", "Speed Penalty": "-1 Speed", "Condition": "Scuffed" },
    },

    leather_jacket: {
      key: "leather_jacket",
      type: "armor",
      name: "Leather Jacket",
      icon: "icons/items/armor.svg",
      photo: "icons/items_pics/LeatherJacket.png",
      quantity: 1,
      description: "Worn leather, a few old patches. Stops a little. Mostly attitude.",
      stats: { "Armor Points": "1 AP", "Speed Penalty": "None", "Condition": "Broken in" },
    },

    flashlight: {
      key: "flashlight",
      type: "tool",
      name: "Flashlight",
      icon: "icons/items/flashlight.svg",
      quantity: 1,
      description: "High-beam, long battery. The dark is everywhere out here.",
      consumable: { current: 12, max: 12, unit: "hours", perUse: 1, verb: "DRAIN", useLabel: "USE 1 HOUR", depletedMsg: "BATTERY DEAD" },
      stats: { "Beam": "High intensity", "Condition": "Functional" },
    },

    rope: {
      key: "rope",
      type: "tool",
      name: "Nylon Rope (20 ft)",
      icon: "icons/items/paracord.svg",
      quantity: 1,
      description: "Twenty feet of nylon line. You'll find a use for it.",
      stats: { "Length": "20 feet", "Rating": "Strong", "Condition": "Good" },
    },

    first_aid: {
      key: "first_aid",
      type: "medical",
      name: "First Aid Kit",
      icon: "icons/items/firstaid.svg",
      quantity: 1,
      description: "Bandages, sealant foam, a basic stimshot. Buys time.",
      consumable: { current: 3, max: 3, unit: "uses", perUse: 1, verb: "APPLY", useLabel: "USE — HEAL d5", depletedMsg: "KIT EMPTY" },
      stats: { "Heals": "Roll d5 — GM applies", "Contents": "Bandages, foam sealant, stimshot" },
      support: { die: "d5", self: true, ally: true },
    },

    combat_stim: {
      key: "combat_stim",
      type: "consumable",
      name: "Combat Stim",
      icon: "icons/items/stim.svg",
      quantity: 1,
      description: "One use. Keeps you moving when your body says stop. You'll feel it later.",
      consumable: { current: 1, max: 1, unit: "dose", perUse: 1, verb: "INJECT", useLabel: "INJECT STIM", depletedMsg: "STIM SPENT" },
      stats: { "Effect": "Ignore wounds, +1 Speed for 10 min", "Side Effect": "Stress +2 when it wears off" },
      support: { die: "d3", self: true, ally: true },
    },

    defib: {
      key: "defib",
      type: "medical",
      name: "Defibrillator",
      icon: "icons/items/firstaid.svg",
      quantity: 1,
      description: "Two paddles and a prayer. Jump-starts a downed crewmate.",
      consumable: { current: 2, max: 2, unit: "charges", perUse: 1, verb: "SHOCK", useLabel: "DEFIB", depletedMsg: "BATTERY DEAD" },
      stats: { "Use": "Revive a downed ally — roll d3, GM applies", "Note": "Cannot be used on yourself" },
      support: { die: "d3", self: false, ally: true, allyOnlyWhenDown: true },
    },

    comms: {
      key: "comms",
      type: "tool",
      name: "Comms Unit",
      icon: "icons/items/comms.svg",
      quantity: 1,
      description: "Short range radio. Works unless the ship doesn't want it to.",
      stats: { "Range": "Short (shipboard)", "Encryption": "Standard", "Battery": "24 hours", "Condition": "Functional" },
    },

    helmet: {
      key: "helmet",
      type: "armor",
      name: "Helmet",
      icon: "icons/items/helmet.svg",
      quantity: 1,
      description: "Sealed, reinforced. Built-in visor with basic HUD.",
      stats: { "Armor Points": "1 AP (Head)", "HUD": "Basic targeting, O2 readout", "Seal": "Vacuum-rated", "Condition": "Functional" },
    },

    rations: {
      key: "rations",
      type: "consumable",
      name: "Rations",
      icon: "icons/items/rations.svg",
      quantity: 3,
      description: "Three days of food bars. They taste like nothing on purpose.",
      consumable: { current: 3, max: 3, unit: "days", perUse: 1, verb: "EAT", useLabel: "CONSUME RATION", depletedMsg: "NO RATIONS LEFT" },
      stats: { "Nutrition": "1 day per unit", "Taste": "Intentionally absent" },
    },

    paracord: {
      key: "paracord",
      type: "tool",
      name: "Paracord",
      icon: "icons/items/paracord.svg",
      quantity: 1,
      description: "Fifty feet. Marines find a use for it every single time.",
      stats: { "Length": "50 feet", "Rating": "550 lb tensile", "Condition": "New" },
    },

  };

  // --- Loadout builder (unit-testable, shared with duo.js) ---
  // loadout = { weapon: "chainsword"|"revolver", armor: "light"|"leather" }
  // Returns an array of 5 deep-cloned catalog items, each with a unique id.
  window.buildLoadout = function (loadout) {
    loadout = loadout || {};
    var keys = [
      loadout.weapon === "chainsword" ? "chainsword" : "revolver",
      loadout.armor === "leather" ? "leather_jacket" : "light_armor",
      "flashlight", "rope", "first_aid",
    ];
    return keys.map(function (k) {
      var item = JSON.parse(JSON.stringify(window.ITEMS[k]));
      item.id = genId();
      return item;
    });
  };

}());
