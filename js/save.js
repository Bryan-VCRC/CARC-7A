/* ============================================
   CARC-7A — Save System
   Persists game state to localStorage
   ============================================ */

(function () {
  "use strict";

  const SAVE_KEY = "carc7a_save";

  function save() {
    const state = {
      version: 1,
      timestamp: Date.now(),
      player: {
        hp: PLAYER_STATS.hp,
        hpMax: PLAYER_STATS.hpMax,
        wounds: PLAYER_STATS.wounds,
        woundsMax: PLAYER_STATS.woundsMax,
        stress: PLAYER_STATS.stress,
        stressMax: PLAYER_STATS.stressMax,
        woundLog: PLAYER_STATS.woundLog || [],
      },
      inventory: INVENTORY_ITEMS.map(function (item) {
        const entry = { id: item.id, quantity: item.quantity };
        if (item.ammo) {
          entry.ammo = {
            current: item.ammo.current,
            spareMags: item.ammo.spareMags,
          };
        }
        if (item.consumable) {
          entry.consumable = {
            current: item.consumable.current,
            max: item.consumable.max,
          };
        }
        return entry;
      }),
    };

    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    } catch (e) {
      // Storage full or unavailable — fail silently
    }
  }

  function load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return false;

      const state = JSON.parse(raw);
      if (!state || !state.inventory) return false;

      // Restore player stats
      if (state.player && typeof PLAYER_STATS !== "undefined") {
        var keys = ["hp", "hpMax", "wounds", "woundsMax", "stress", "stressMax"];
        keys.forEach(function (k) {
          if (state.player[k] !== undefined) PLAYER_STATS[k] = state.player[k];
        });
        if (Array.isArray(state.player.woundLog)) {
          PLAYER_STATS.woundLog = state.player.woundLog;
        }
      }

      state.inventory.forEach(function (saved) {
        const item = INVENTORY_ITEMS.find(function (i) {
          return i.id === saved.id;
        });
        if (!item) return;

        if (saved.quantity !== undefined) {
          item.quantity = saved.quantity;
        }
        if (saved.ammo && item.ammo) {
          item.ammo.current = saved.ammo.current;
          item.ammo.spareMags = saved.ammo.spareMags;
        }
        if (saved.consumable && item.consumable) {
          item.consumable.current = saved.consumable.current;
          if (saved.consumable.max !== undefined) {
            item.consumable.max = saved.consumable.max;
          }
        }
      });

      return true;
    } catch (e) {
      return false;
    }
  }

  function clearSave() {
    localStorage.removeItem(SAVE_KEY);
  }

  function hasSave() {
    return localStorage.getItem(SAVE_KEY) !== null;
  }

  window.SaveSystem = {
    save: save,
    load: load,
    clear: clearSave,
    hasSave: hasSave,
  };
})();
