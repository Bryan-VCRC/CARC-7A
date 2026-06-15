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

const WIZ_PORT = 38899;
const BROADCAST_ADDR = "255.255.255.255";

// Restore color when fear ends / after a panic effect settles (warm white).
const RESTORE = { r: 255, g: 170, b: 90, dimming: 80 };

const sock = dgram.createSocket("udp4");
const bulbs = new Set();        // discovered (or configured) bulb IPs
let configured = false;         // true when IPs come from WIZ_BULBS (skip discovery)
let activeTimers = [];          // pending setTimeout/setInterval handles for panic effects

sock.on("error", () => {});     // never let a socket error crash the server

// Collect responders to our broadcast getPilot during discovery.
sock.on("message", (_buf, rinfo) => {
  if (!configured && rinfo && rinfo.address) bulbs.add(rinfo.address);
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

// --- Map game events to light behavior ---
function handle(msg) {
  if (!msg || !msg.type) return;

  if (msg.type === "fear") {
    clearEffects();
    if (msg.active) {
      setAll({ state: true, r: 120, g: 0, b: 0, dimming: 25 }); // sickly dim red
    } else {
      setAll({ state: true, ...RESTORE });                      // warm restore
    }
    return;
  }

  if (msg.type === "panic") {
    clearEffects();
    switch (msg.action) {
      case "glitch": { // rapid red strobe, then settle
        let n = 0;
        const t = setInterval(() => {
          setAll(n++ % 2 ? { state: false } : { state: true, r: 255, g: 0, b: 0, dimming: 100 });
          if (n > 6) { clearInterval(t); setAll({ state: true, ...RESTORE }); }
        }, 90);
        activeTimers.push(t);
        break;
      }
      case "blackout": { // cut to black, then a hard red snap
        setAll({ state: false });
        activeTimers.push(setTimeout(() => setAll({ state: true, r: 255, g: 0, b: 0, dimming: 100 }), 1500));
        break;
      }
      case "corrupt": // glitchy magenta hold
        setAll({ state: true, r: 180, g: 0, b: 80, dimming: 50 });
        break;
      case "reboot": // power down, slow warm fade back up
        setAll({ state: false });
        activeTimers.push(setTimeout(() => setAll({ state: true, ...RESTORE }), 3000));
        break;
    }
  }
}

// --- Discovery ---
function discover() {
  if (configured) return;
  const probe = Buffer.from(JSON.stringify({ method: "getPilot", params: {} }));
  try { sock.send(probe, WIZ_PORT, BROADCAST_ADDR); } catch {}
}

function start() {
  const fromEnv = (process.env.WIZ_BULBS || "").split(",").map(s => s.trim()).filter(Boolean);
  if (fromEnv.length) {
    configured = true;
    fromEnv.forEach(ip => bulbs.add(ip));
    console.log(`  WiZ:     ${fromEnv.length} bulb(s) configured: ${fromEnv.join(", ")}`);
    return;
  }
  sock.bind(() => {
    try { sock.setBroadcast(true); } catch {}
    discover();
    setInterval(discover, 60000).unref?.();
    setTimeout(() => {
      console.log(`  WiZ:     ${bulbs.size} bulb(s) discovered${bulbs.size ? ": " + [...bulbs].join(", ") : " (will keep scanning)"}`);
    }, 1500);
  });
}

module.exports = { start, handle };
