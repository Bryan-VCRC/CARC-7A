/* ============================================
   CARC-7A — WiZ bulb finder
   Run:  node find-bulbs.js
   Broadcasts AND unicast-sweeps every address on your local subnet(s) with
   WiZ's getPilot, then prints the IPs of anything that answers — plus a
   ready-to-paste WIZ_BULBS line for the server.
   ============================================ */

const dgram = require("dgram");
const os = require("os");

const PORT = 38899;
const probe = Buffer.from(JSON.stringify({ method: "getPilot", params: {} }));
const found = new Map(); // ip -> mac (if known)

const sock = dgram.createSocket("udp4");
sock.on("error", () => {});
sock.on("message", (buf, rinfo) => {
  if (!rinfo || !rinfo.address) return;
  let mac = "";
  try { mac = (JSON.parse(buf.toString()).result || {}).mac || ""; } catch (e) {}
  if (!found.has(rinfo.address)) found.set(rinfo.address, mac);
});

// Collect local IPv4 subnets (address + /24 base).
function subnets() {
  const nets = [];
  const ifaces = os.networkInterfaces();
  Object.keys(ifaces).forEach((name) => {
    ifaces[name].forEach((a) => {
      if (a.family === "IPv4" && !a.internal && a.address) {
        const base = a.address.split(".").slice(0, 3).join(".");
        const bcast = base + ".255";
        if (!nets.find((n) => n.base === base)) nets.push({ base, bcast, self: a.address });
      }
    });
  });
  return nets;
}

sock.bind(() => {
  try { sock.setBroadcast(true); } catch (e) {}
  const nets = subnets();
  if (!nets.length) {
    console.log("No network interface found. Are you on Wi-Fi?");
    process.exit(1);
  }
  console.log("Scanning for WiZ bulbs on: " + nets.map((n) => n.base + ".0/24").join(", "));
  console.log("(this takes ~4 seconds)\n");

  nets.forEach((n) => {
    // global + directed broadcast
    try { sock.send(probe, PORT, "255.255.255.255"); } catch (e) {}
    try { sock.send(probe, PORT, n.bcast); } catch (e) {}
    // unicast sweep every host .1 - .254
    for (let i = 1; i <= 254; i++) {
      try { sock.send(probe, PORT, n.base + "." + i); } catch (e) {}
    }
  });

  setTimeout(() => {
    console.log("");
    if (found.size === 0) {
      console.log("No bulbs answered.");
      console.log("- Make sure each bulb is on Wi-Fi (not just Bluetooth) in the WiZ app.");
      console.log("- Make sure THIS computer is on the same Wi-Fi network as the bulbs.");
      console.log("- Confirm 'local communication' is on in the WiZ app.");
    } else {
      console.log("Found " + found.size + " bulb(s):");
      const ips = [];
      for (const [ip, mac] of found) {
        console.log("  " + ip + (mac ? "   (" + mac + ")" : ""));
        ips.push(ip);
      }
      console.log("\nStart the server with these pinned:\n");
      console.log("  WIZ_BULBS=" + ips.join(",") + " node server.js");
    }
    sock.close();
    process.exit(0);
  }, 4000);
});
