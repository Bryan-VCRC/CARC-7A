/* ============================================
   CARC-7A — User-added stories
   Stories added through the in-app authoring screen live in localStorage
   (small narrative data only; images are dropped into data/stories/<id>/).
   On load, this merges them into window.STORIES so the launcher, the player
   terminal, and the GM console all see them. Must load AFTER js/stories.js.
   ============================================ */

(function () {
  "use strict";

  var KEY = "carc7a_user_stories";

  function readAll() {
    try { return JSON.parse(localStorage.getItem(KEY) || "{}") || {}; }
    catch (e) { return {}; }
  }
  function writeAll(map) {
    try { localStorage.setItem(KEY, JSON.stringify(map)); return true; }
    catch (e) { return false; }
  }

  window.STORIES = window.STORIES || {};
  // Snapshot the built-in ids (everything present before user stories merge in)
  // so the authoring screen can refuse to clobber a shipped story id.
  if (!window.BUILTIN_STORY_IDS) {
    window.BUILTIN_STORY_IDS = Object.keys(window.STORIES);
  }

  window.UserStories = {
    list: function () { return readAll(); },
    isUser: function (id) {
      return Object.prototype.hasOwnProperty.call(readAll(), id);
    },
    add: function (id, story) {
      var map = readAll();
      map[id] = story;
      if (!writeAll(map)) return false;
      window.STORIES[id] = story; // live, no reload needed
      return true;
    },
    remove: function (id) {
      var map = readAll();
      if (!Object.prototype.hasOwnProperty.call(map, id)) return false;
      delete map[id];
      writeAll(map);
      // Only drop it from the live registry if it's not a shipped story.
      if ((window.BUILTIN_STORY_IDS || []).indexOf(id) < 0) delete window.STORIES[id];
      return true;
    }
  };

  // Merge stored stories into the live registry at load.
  var stored = readAll();
  Object.keys(stored).forEach(function (id) { window.STORIES[id] = stored[id]; });
})();
