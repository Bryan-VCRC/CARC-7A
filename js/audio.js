/* ============================================
   CARC-7A — UI Sound Effects
   Industrial / horror sci-fi tones via Web Audio API
   ============================================ */

(function () {
  "use strict";

  let ctx = null;

  function ensureContext() {
    if (ctx) {
      // Browsers open the context "suspended" until a user gesture; nudge it
      // back to running on every call so deferred sounds aren't silently lost.
      if (ctx.state === "suspended" && ctx.resume) ctx.resume();
      return true;
    }
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      if (ctx.state === "suspended" && ctx.resume) ctx.resume();
      return true;
    } catch (e) {
      return false;
    }
  }

  const VOL = 0.1;

  // Utility: white noise burst
  function noiseBuffer(duration) {
    const len = ctx.sampleRate * duration;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buf;
  }

  // --- Tab switch: harsh metallic click ---
  function playTab() {
    if (!ensureContext()) return;
    const t = ctx.currentTime;

    // Short noise burst — like a relay switching
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer(0.03);
    const noiseGain = ctx.createGain();
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = "bandpass";
    noiseFilter.frequency.value = 3000;
    noiseFilter.Q.value = 2;
    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noiseGain.gain.setValueAtTime(VOL * 1.2, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
    noise.start(t);
    noise.stop(t + 0.04);

    // Low thud underneath
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(90, t);
    osc.frequency.exponentialRampToValueAtTime(40, t + 0.06);
    gain.gain.setValueAtTime(VOL * 0.8, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.07);
    osc.start(t);
    osc.stop(t + 0.07);
  }

  // --- Select: dry mechanical latch ---
  function playSelect() {
    if (!ensureContext()) return;
    const t = ctx.currentTime;

    // Tiny filtered click
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer(0.015);
    const filter = ctx.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.value = 2000;
    const gain = ctx.createGain();
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    gain.gain.setValueAtTime(VOL * 0.5, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.02);
    noise.start(t);
    noise.stop(t + 0.025);

    // Faint low resonance
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.connect(oscGain);
    oscGain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.value = 55;
    oscGain.gain.setValueAtTime(VOL * 0.3, t);
    oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
    osc.start(t);
    osc.stop(t + 0.05);
  }

  // --- Back: low descending drone blip ---
  function playBack() {
    if (!ensureContext()) return;
    const t = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(120, t);
    osc.frequency.exponentialRampToValueAtTime(35, t + 0.12);
    gain.gain.setValueAtTime(VOL * 0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
    osc.start(t);
    osc.stop(t + 0.15);
  }

  // --- Filter change: static crackle ---
  function playFilter() {
    if (!ensureContext()) return;
    const t = ctx.currentTime;

    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer(0.06);
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(1500, t);
    filter.frequency.exponentialRampToValueAtTime(4000, t + 0.04);
    filter.Q.value = 1;
    const gain = ctx.createGain();
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    gain.gain.setValueAtTime(VOL * 0.5, t);
    gain.gain.setValueAtTime(VOL * 0.3, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
    noise.start(t);
    noise.stop(t + 0.07);
  }

  // --- Boot tick: CRT-style electrical tick ---
  function playTick() {
    if (!ensureContext()) return;
    const t = ctx.currentTime;

    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer(0.008);
    const filter = ctx.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.value = 4000 + Math.random() * 2000;
    const gain = ctx.createGain();
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    gain.gain.setValueAtTime(VOL * 0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.012);
    noise.start(t);
    noise.stop(t + 0.015);
  }

  // --- Boot complete: low power-up drone ---
  function playBootDone() {
    if (!ensureContext()) return;
    const t = ctx.currentTime;

    // Deep rumble rising
    const osc1 = ctx.createOscillator();
    const g1 = ctx.createGain();
    osc1.connect(g1);
    g1.connect(ctx.destination);
    osc1.type = "sawtooth";
    osc1.frequency.setValueAtTime(30, t);
    osc1.frequency.exponentialRampToValueAtTime(80, t + 0.5);
    g1.gain.setValueAtTime(0, t);
    g1.gain.linearRampToValueAtTime(VOL * 0.6, t + 0.15);
    g1.gain.setValueAtTime(VOL * 0.6, t + 0.35);
    g1.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
    osc1.start(t);
    osc1.stop(t + 0.6);

    // Dissonant harmonic on top
    const osc2 = ctx.createOscillator();
    const g2 = ctx.createGain();
    osc2.connect(g2);
    g2.connect(ctx.destination);
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(55, t + 0.1);
    osc2.frequency.linearRampToValueAtTime(110, t + 0.5);
    g2.gain.setValueAtTime(0, t);
    g2.gain.linearRampToValueAtTime(VOL * 0.3, t + 0.2);
    g2.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
    osc2.start(t);
    osc2.stop(t + 0.65);

    // Static wash over it
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer(0.5);
    const nf = ctx.createBiquadFilter();
    nf.type = "lowpass";
    nf.frequency.value = 800;
    const ng = ctx.createGain();
    noise.connect(nf);
    nf.connect(ng);
    ng.connect(ctx.destination);
    ng.gain.setValueAtTime(0, t);
    ng.gain.linearRampToValueAtTime(VOL * 0.15, t + 0.1);
    ng.gain.exponentialRampToValueAtTime(0.001, t + 0.55);
    noise.start(t);
    noise.stop(t + 0.6);
  }

  // --- Single gunshot: sharp crack + low thump ---
  function playGunshot() {
    if (!ensureContext()) return;
    if (playSample("gunshot", 0.9)) return; // real recording when available
    const t = ctx.currentTime;

    // Sharp transient crack
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer(0.04);
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 2500;
    bp.Q.value = 0.8;
    const ng = ctx.createGain();
    noise.connect(bp);
    bp.connect(ng);
    ng.connect(ctx.destination);
    ng.gain.setValueAtTime(VOL * 2.5, t);
    ng.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
    noise.start(t);
    noise.stop(t + 0.07);

    // Low body thump
    const osc = ctx.createOscillator();
    const og = ctx.createGain();
    osc.connect(og);
    og.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(120, t);
    osc.frequency.exponentialRampToValueAtTime(30, t + 0.1);
    og.gain.setValueAtTime(VOL * 1.5, t);
    og.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
    osc.start(t);
    osc.stop(t + 0.13);
  }

  // --- Burst fire: rapid shots (count matches rounds spent) ---
  function playBurst(count) {
    if (!ensureContext()) return;
    if (playSample("burst", 0.9)) return; // real recording when available
    const n = count || 3;
    const t = ctx.currentTime;
    for (let i = 0; i < n; i++) {
      const offset = i * 0.07;

      const noise = ctx.createBufferSource();
      noise.buffer = noiseBuffer(0.03);
      const bp = ctx.createBiquadFilter();
      bp.type = "bandpass";
      bp.frequency.value = 2800 + i * 200;
      bp.Q.value = 0.7;
      const ng = ctx.createGain();
      noise.connect(bp);
      bp.connect(ng);
      ng.connect(ctx.destination);
      ng.gain.setValueAtTime(VOL * 2.2, t + offset);
      ng.gain.exponentialRampToValueAtTime(0.001, t + offset + 0.05);
      noise.start(t + offset);
      noise.stop(t + offset + 0.06);

      const osc = ctx.createOscillator();
      const og = ctx.createGain();
      osc.connect(og);
      og.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(100, t + offset);
      osc.frequency.exponentialRampToValueAtTime(25, t + offset + 0.08);
      og.gain.setValueAtTime(VOL * 1.2, t + offset);
      og.gain.exponentialRampToValueAtTime(0.001, t + offset + 0.09);
      osc.start(t + offset);
      osc.stop(t + offset + 0.1);
    }
  }

  // --- Reload: heavy magazine clunk + slide rack ---
  function playReload() {
    if (!ensureContext()) return;
    if (playSample("reload", 0.9)) return; // real recording when available
    const t = ctx.currentTime;

    // Magazine drop — low thud
    const osc1 = ctx.createOscillator();
    const g1 = ctx.createGain();
    osc1.connect(g1);
    g1.connect(ctx.destination);
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(70, t);
    osc1.frequency.exponentialRampToValueAtTime(25, t + 0.08);
    g1.gain.setValueAtTime(VOL * 1.0, t);
    g1.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
    osc1.start(t);
    osc1.stop(t + 0.11);

    // Magazine insert — metallic click
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer(0.025);
    const hp = ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 3500;
    const ng = ctx.createGain();
    noise.connect(hp);
    hp.connect(ng);
    ng.connect(ctx.destination);
    ng.gain.setValueAtTime(0, t);
    ng.gain.setValueAtTime(VOL * 1.5, t + 0.15);
    ng.gain.exponentialRampToValueAtTime(0.001, t + 0.19);
    noise.start(t);
    noise.stop(t + 0.2);

    // Slide rack — noise sweep
    const noise2 = ctx.createBufferSource();
    noise2.buffer = noiseBuffer(0.06);
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.setValueAtTime(1500, t + 0.25);
    bp.frequency.linearRampToValueAtTime(4000, t + 0.32);
    bp.Q.value = 1.5;
    const ng2 = ctx.createGain();
    noise2.connect(bp);
    bp.connect(ng2);
    ng2.connect(ctx.destination);
    ng2.gain.setValueAtTime(0, t);
    ng2.gain.setValueAtTime(VOL * 1.0, t + 0.25);
    ng2.gain.exponentialRampToValueAtTime(0.001, t + 0.33);
    noise2.start(t);
    noise2.stop(t + 0.35);
  }

  // --- Dry fire: empty click ---
  function playEmpty() {
    if (!ensureContext()) return;
    if (playSample("empty", 0.8)) return; // real recording when available
    const t = ctx.currentTime;

    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer(0.01);
    const hp = ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 5000;
    const g = ctx.createGain();
    noise.connect(hp);
    hp.connect(g);
    g.connect(ctx.destination);
    g.gain.setValueAtTime(VOL * 0.6, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.025);
    noise.start(t);
    noise.stop(t + 0.03);
  }

  // --- Consumable use: pressurized hiss + confirmation blip ---
  function playUse() {
    if (!ensureContext()) return;
    const t = ctx.currentTime;

    // Short pressurized hiss
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer(0.08);
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.setValueAtTime(5000, t);
    bp.frequency.exponentialRampToValueAtTime(1500, t + 0.07);
    bp.Q.value = 0.5;
    const ng = ctx.createGain();
    noise.connect(bp);
    bp.connect(ng);
    ng.connect(ctx.destination);
    ng.gain.setValueAtTime(VOL * 0.8, t);
    ng.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
    noise.start(t);
    noise.stop(t + 0.09);

    // Low confirmation tone
    const osc = ctx.createOscillator();
    const og = ctx.createGain();
    osc.connect(og);
    og.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.value = 65;
    og.gain.setValueAtTime(0, t);
    og.gain.setValueAtTime(VOL * 0.5, t + 0.1);
    og.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
    osc.start(t);
    osc.stop(t + 0.22);
  }

  // --- Preloaded audio samples for fear/panic ---
  const samples = {};

  function preloadSample(name, url) {
    fetch(url)
      .then(function (r) { return r.arrayBuffer(); })
      .then(function (buf) {
        // Lazy-decode: store the raw buffer, decode on first use
        samples[name] = { raw: buf, decoded: null };
      })
      .catch(function () {});
  }

  // Returns true if a sample for `name` exists (and was scheduled/decoding),
  // false if there's nothing loaded yet — letting callers fall back to a
  // synthesized tone while files are still being fetched.
  function playSample(name, volume) {
    if (!ensureContext()) return false;
    var s = samples[name];
    if (!s) return false;

    function play(buffer) {
      var src = ctx.createBufferSource();
      src.buffer = buffer;
      var gain = ctx.createGain();
      gain.gain.value = volume || 0.5;
      src.connect(gain);
      gain.connect(ctx.destination);
      src.start();
    }

    if (s.decoded) {
      play(s.decoded);
    } else if (s.raw) {
      ctx.decodeAudioData(s.raw.slice(0), function (decoded) {
        s.decoded = decoded;
        s.raw = null;
        play(decoded);
      });
    }
    return true;
  }

  // Preload fear/panic sounds
  preloadSample("alert", "data/media/375975__glitchedtones__sci-fi-alert-03.wav");
  preloadSample("error", "data/media/176238__melissapons__sci-fi_short_error.wav");

  // Preload recorded gameplay sounds (fall back to synthesized tones until loaded)
  preloadSample("gunshot", "data/media/soundeffects/revolver_shot.wav");
  preloadSample("burst", "data/media/soundeffects/rifle_burst.wav");
  preloadSample("reload", "data/media/soundeffects/revolver_reload.wav");
  preloadSample("empty", "data/media/soundeffects/gun_empty.wav");
  preloadSample("heal", "data/media/soundeffects/heal.mp3");
  preloadSample("eat", "data/media/soundeffects/eating.aiff");
  preloadSample("rifleReload", "data/media/soundeffects/rifle_reload.wav");
  preloadSample("rifleShot", "data/media/soundeffects/rifle_singleshot.wav");

  // --- Rifle reload: mag-fed weapons (falls back to the revolver reload) ---
  function playRifleReload() { if (!playSample("rifleReload", 0.9)) playReload(); }

  // --- Rifle single shot: mag-fed weapons (falls back to the revolver shot) ---
  function playRifleShot() { if (!playSample("rifleShot", 0.9)) playGunshot(); }

  // --- Radio static: Silent Hill-style comms bed (toggle on/off, loops) ---
  preloadSample("radioStatic", "data/media/soundeffects/radio_static.mp3");
  function playRadioStatic() { playSample("radioStatic", 0.7); } // one-shot (kept for misc use)

  var staticSrc = null;
  var staticWanted = false;
  function startRadioStaticLoop() {
    if (!ensureContext() || staticSrc) return;
    var s = samples["radioStatic"];
    if (!s) return;
    function play(buffer) {
      if (staticSrc || !staticWanted) return;
      var src = ctx.createBufferSource();
      src.buffer = buffer;
      src.loop = true;
      var g = ctx.createGain();
      g.gain.value = 0.5;
      src.connect(g);
      g.connect(ctx.destination);
      src.start();
      staticSrc = { src: src, gain: g };
    }
    if (s.decoded) play(s.decoded);
    else if (s.raw) ctx.decodeAudioData(s.raw.slice(0), function (d) { s.decoded = d; s.raw = null; play(d); });
  }
  function stopRadioStaticLoop() {
    if (!staticSrc) return;
    try { staticSrc.src.stop(); staticSrc.src.disconnect(); staticSrc.gain.disconnect(); } catch (e) {}
    staticSrc = null;
  }
  // Returns true if it's now ON, false if now OFF.
  function toggleRadioStatic() {
    if (staticSrc || staticWanted) { staticWanted = false; stopRadioStaticLoop(); return false; }
    staticWanted = true; startRadioStaticLoop(); return true;
  }
  // Explicit on/off (for sustained GM toggle).
  function setRadioStatic(on) {
    if (on) { staticWanted = true; startRadioStaticLoop(); }
    else { staticWanted = false; stopRadioStaticLoop(); }
  }

  // --- Low-health heartbeat (loops quietly while a crew member is at 1 HP) ---
  preloadSample("heartbeat", "data/media/soundeffects/lowhealth_heartbeat.mp3");
  var heartSrc = null;
  var heartWanted = false;
  function startHeartbeatLoop() {
    if (!ensureContext() || heartSrc) return;
    var s = samples["heartbeat"];
    if (!s) return;
    function play(buffer) {
      if (heartSrc || !heartWanted) return;
      var src = ctx.createBufferSource();
      src.buffer = buffer;
      src.loop = true;
      var g = ctx.createGain();
      g.gain.value = 0.3; // lower than usual so it isn't grating
      src.connect(g);
      g.connect(ctx.destination);
      src.start();
      heartSrc = { src: src, gain: g };
    }
    if (s.decoded) play(s.decoded);
    else if (s.raw) ctx.decodeAudioData(s.raw.slice(0), function (d) { s.decoded = d; s.raw = null; play(d); });
  }
  function stopHeartbeatLoop() {
    if (!heartSrc) return;
    try { heartSrc.src.stop(); heartSrc.src.disconnect(); heartSrc.gain.disconnect(); } catch (e) {}
    heartSrc = null;
  }
  function setHeartbeat(on) {
    if (on) { heartWanted = true; startHeartbeatLoop(); }
    else { heartWanted = false; stopHeartbeatLoop(); }
  }

  // --- Radio switch: short click/squelch (recovered-note cue) ---
  preloadSample("radioSwitch", "data/media/soundeffects/radio_switch.wav");
  function playRadioSwitch() { if (!playSample("radioSwitch", 0.6)) playFilter(); }

  // --- Heal: medkit recording (falls back to the generic use blip) ---
  function playHeal() { if (!playSample("heal", 0.8)) playUse(); }

  // --- Eat: consumable recording (falls back to the generic use blip) ---
  function playEat() { if (!playSample("eat", 0.8)) playUse(); }

  // --- Fear start: plays the alert sample ---
  function playFearStart() {
    playSample("alert", 0.6);
  }

  // --- Panic hit: plays the error sample ---
  function playPanicHit() {
    playSample("error", 0.7);
  }

  window.SFX = {
    tab: playTab,
    select: playSelect,
    back: playBack,
    filter: playFilter,
    tick: playTick,
    bootDone: playBootDone,
    gunshot: playGunshot,
    burst: playBurst,
    reload: playReload,
    empty: playEmpty,
    use: playUse,
    reloadRifle: playRifleReload,
    shotRifle: playRifleShot,
    radioStatic: playRadioStatic,
    radioStaticToggle: toggleRadioStatic,
    radioStaticSet: setRadioStatic,
    heartbeat: setHeartbeat,
    radioSwitch: playRadioSwitch,
    heal: playHeal,
    eat: playEat,
    fearStart: playFearStart,
    panicHit: playPanicHit,
    ensureContext: ensureContext,
    _ctx: function () { return ctx; },
  };
})();
