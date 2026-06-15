const http = require("http");
const fs = require("fs");
const path = require("path");
const { WebSocketServer } = require("ws");
const wiz = require("./wiz");

const PORT = process.env.PORT || 3000;

// --- Static file server ---
const MIME = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "application/javascript",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".wav": "audio/wav",
  ".mp3": "audio/mpeg",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

const server = http.createServer((req, res) => {
  let filePath = path.join(__dirname, req.url === "/" ? "index.html" : req.url);

  // Prevent directory traversal
  if (!filePath.startsWith(__dirname)) {
    res.writeHead(403);
    return res.end();
  }

  const ext = path.extname(filePath).toLowerCase();

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      return res.end("Not found");
    }
    res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream" });
    res.end(data);
  });
});

// --- WebSocket relay ---
const wss = new WebSocketServer({ server });
const clients = new Set();

wss.on("connection", (ws) => {
  const client = { ws, role: null };
  clients.add(client);

  ws.on("message", (raw) => {
    let msg;
    try {
      msg = JSON.parse(raw);
    } catch {
      return;
    }

    // First message identifies the client role
    if (msg._role) {
      client.role = msg._role;
      return;
    }

    // Drive WiZ light ambience off Fear / Panic events (best-effort)
    wiz.handle(msg);

    // Broadcast to all OTHER connected clients
    for (const c of clients) {
      if (c !== client && c.ws.readyState === 1) {
        c.ws.send(raw.toString());
      }
    }
  });

  ws.on("close", () => {
    clients.delete(client);
  });
});

server.listen(PORT, "0.0.0.0", () => {
  // Show LAN IP for easy phone access
  const nets = require("os").networkInterfaces();
  let lanIP = "localhost";
  for (const iface of Object.values(nets)) {
    for (const addr of iface) {
      if (addr.family === "IPv4" && !addr.internal) {
        lanIP = addr.address;
        break;
      }
    }
  }
  console.log(`\n  CARC-7A server running:\n`);
  console.log(`  Local:   http://localhost:${PORT}`);
  console.log(`  Network: http://${lanIP}:${PORT}`);
  console.log(`  Admin:   http://${lanIP}:${PORT}/admin.html\n`);
  wiz.start();
});
