/* ============================================
   CARC-7A — WiZ Light Ambience
   Drives WiZ bulbs over the local network (UDP, port 38899) in
   reaction to the GM's Fear / Panic commands. No hub, no cloud.

   Wiring: server.js requires this and calls wiz.handle(msg) for every
   relayed message. Fully best-effort — if no bulbs are present, every
   call is a harmless no-op and the game is unaffected.

   Setup:
     - In the WiZ app, make sure each bulb has "Allow local communication"
       enabled (default on recent firmware).
     - Bulbs are auto-discovered via UDP broadcast on startup and every
       60s. To pin them instead, set WIZ_BULBS="192.168.1.50,192.168.1.51".
   ============================================ */

const dgram = require("dgram");
const os = require("os");

const WIZ_PORT = 38899;
const BROADCAST_ADDR = "255.255.255.255";

// Build the list of broadcast targets to probe: the global broadcast plus each
// local interface's directed broadcast (e.g. 192.168.1.255). macOS frequently
// drops/global-misroutes 255.255.255.255, so the directed address is what
// actually reaches the bulbs on multi-interface machines.
function broadcastAddrs() {
  var addrs = [BROADCAST_ADDR];
  try {
    var ifaces = os.networkInterfaces();
    Object.keys(ifaces).forEach(function (name) {
      ifaces[name].forEach(function (a) {
        if (a.family === "IPv4" && !a.internal && a.address && a.netmask) {
          var ip = a.address.split(".").map(Number);
          var mask = a.netmask.split(".").map(Number);
          var bc = ip.map(function (o, i) { return (o & mask[i]) | (~mask[i] & 255); });
          addrs.push(bc.join("."));
        }
      });
    });
  } catch (e) {}
  return addrs;
}

// Restore color when fear ends / after a panic effect settles (warm white, full brightness).
const RESTORE = { r: 255, g: 170, b: 90, dimming: 100 };

// Strobe tuning. interval is the ms between on/off flips — WiZ bulbs realistically
// bottom out around 70-90ms (faster than that drops UDP frames / looks ragged).
// flashes = number of light pulses before settling back to RESTORE.
const STROBE = { flashes: 4, interval: 80, color: { r: 255, g: 0, b: 0, dimming: 100 } };

// Rapid-strobe / failing-light flicker: irregular on/off gaps so it reads as an
// inconsistent flicker rather than a steady strobe.
const FLICKER = { pulses: 9, minGap: 35, maxGap: 150, on: { r: 255, g: 240, b: 210, dimming: 100 } };

const sock = dgram.createSocket("udp4");
const bulbs = new Set();        // discovered (or configured) bulb IPs
let configured = false;         // true when IPs come from WIZ_BULBS (skip discovery)
let activeTimers = [];          // pending setTimeout/setInterval handles for panic effects

sock.on("error", () => {});     // never let a socket error crash the server

// Collect responders to our broadcast getPilot during discovery.
sock.on("message", (_buf, rinfo) => {
  if (!configured && rinfo && rinfo.address && !bulbs.has(rinfo.address)) {
    bulbs.add(rinfo.address);
    console.log("  WiZ:     found bulb " + rinfo.address);
  }
});

function sendTo(ip, payload) {
  const pkt = Buffer.from(JSON.stringify(payload));
  try { sock.send(pkt, WIZ_PORT, ip); } catch {}
}

// setPilot to every known bulb. params per WiZ local API:
//   state: bool | r,g,b: 0-255 | dimming: 10-100 | temp: 2200-6500 (kelvin)
function setAll(params) {
  for (const ip of bulbs) sendTo(ip, { method: "setPilot", params });
}

function clearEffects() {
  for (const t of activeTimers) { clearTimeout(t); clearInterval(t); }
  activeTimers = [];
}

// Bulb fade in/out time (ms) via setUserConfig. We zero it for crisp strobes
// and restore it so fear/blackout/reboot keep their smooth transitions.
const DEFAULT_FADE = 250;
let currentFade = null;
function setFade(ms) {
  if (currentFade === ms) return;
  currentFade = ms;
  for (const ip of bulbs) sendTo(ip, { method: "setUserConfig", params: { fadeIn: ms, fadeOut: ms } });
}

function restoreFade() { if (!NO_FADE) setFade(DEFAULT_FADE); }

// Continuous red strobe — runs until stopped (fade off for crisp snaps).
function strobeLoop() {
  setFade(0);
  let on = false;
  const t = setInterval(() => {
    on = !on;
    setAll(on ? { state: true, ...STROBE.color } : { state: false });
  }, STROBE.interval);
  activeTimers.push(t);
}

// Continuous failing-light flicker — runs until stopped.
function flickerLoop() {
  setFade(0);
  const t = setInterval(() => {
    setAll(Math.random() < 0.45 ? { state: false } : { state: true, ...FLICKER.on });
  }, 80);
  activeTimers.push(t);
}

// Bring the bulbs back to full warm white and stop any running effect.
function lightsOn() {
  clearEffects();
  restoreFade();
  setAll({ state: true, ...RESTORE });
}

// --- Map game events to light behavior ---
// Sustained effects run until turned off: panic carries { on: true/false }.
// "lights-on" is the master all-clear back to full white.
function handle(msg) {
  if (!msg || !msg.type) return;

  if (msg.type === "lights-on") { lightsOn(); return; }

  if (msg.type === "fear") {
    clearEffects();
    if (msg.active) {
      setAll({ state: true, r: 255, g: 0, b: 0, dimming: 100 }); // full-bright red, held
    } else {
      restoreFade();
      setAll({ state: true, ...RESTORE });
    }
    return;
  }

  if (msg.type === "panic") {
    if (msg.action === "static" || msg.action === "alarm") return; // audio-only; lights unaffected
    const on = msg.on !== false; // default true (back-compat)
    clearEffects();
    if (!on) { lightsOn(); return; } // toggled off -> back to white

    switch (msg.action) {
      case "glitch": strobeLoop(); break;                 // red strobe until stopped
      case "flicker": flickerLoop(); break;               // failing-light flicker until stopped
      case "blackout": setAll({ state: false }); break;   // dark until stopped
      case "corrupt": setAll({ state: true, r: 255, g: 0, b: 110, dimming: 100 }); break; // magenta until stopped
      case "reboot": // one-shot: power down, slow warm fade back up
        setAll({ state: false });
        activeTimers.push(setTimeout(() => { restoreFade(); setAll({ state: true, ...RESTORE }); }, 3000));
        break;
    }
  }
}

// --- Discovery ---
function discover() {
  if (configured) return;
  const probe = Buffer.from(JSON.stringify({ method: "getPilot", params: {} }));
  broadcastAddrs().forEach(function (addr) {
    try { sock.send(probe, WIZ_PORT, addr); } catch (e) {}
  });
}

// Opt-in: try to disable the bulb's built-in fade for a crisper strobe.
// WIZ_NO_FADE=1 enables it. This writes a persistent setting to the bulb
// (firmware-dependent — not all models honor it). Best-effort; reversible via
// the WiZ app or by sending non-zero values.
const NO_FADE = /^(1|true|yes)$/i.test(process.env.WIZ_NO_FADE || "");

function applyNoFade() {
  if (!NO_FADE) return;
  setFade(0);
  console.log("  WiZ:     fade disabled (WIZ_NO_FADE) — crisper everything");
}

// The crew's WiZ bulbs. WIZ_BULBS env overrides; otherwise these are used
// (discovery is skipped so only these bulbs are ever driven). Pin them with
// DHCP reservations in the router so the addresses don't drift.
const DEFAULT_BULBS = ["192.168.50.96", "192.168.50.138", "192.168.50.28"];

function start() {
  const fromEnv = (process.env.WIZ_BULBS || "").split(",").map(s => s.trim()).filter(Boolean);
  const list = fromEnv.length ? fromEnv : DEFAULT_BULBS;
  if (list.length) {
    configured = true;
    list.forEach(ip => bulbs.add(ip));
    console.log(`  WiZ:     ${list.length} bulb(s) configured: ${list.join(", ")}`);
    applyNoFade();
    return;
  }
  sock.bind(() => {
    try { sock.setBroadcast(true); } catch {}
    discover();
    setInterval(discover, 60000).unref?.();
    setTimeout(() => {
      console.log(`  WiZ:     ${bulbs.size} bulb(s) discovered${bulbs.size ? ": " + [...bulbs].join(", ") : " (will keep scanning)"}`);
      applyNoFade();
    }, 1500);
  });
}

module.exports = { start, handle };
