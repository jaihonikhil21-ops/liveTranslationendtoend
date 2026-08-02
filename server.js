/**
 * Live Translation Relay Server
 * ══════════════════════════════
 * Run:  node server.js
 * Then: speaker opens http://localhost:3000/speaker
 *       listeners open http://YOUR-LAPTOP-IP:3000
 *
 * Find your laptop IP:
 *   Mac/Linux:  ifconfig | grep "inet " | grep -v 127
 *   Windows:    ipconfig | findstr IPv4
 */

const http = require('http');
const fs   = require('fs');
const path = require('path');
const { WebSocketServer } = require('ws');

const PORT = 3000;

// ── HTTP server — serves speaker.html and listener.html ─────────────────
const httpServer = http.createServer((req, res) => {
  let filePath;

  if (req.url === '/' || req.url === '/listen' || req.url === '/listener') {
    filePath = path.join(__dirname, 'listener.html');
  } else if (req.url === '/speaker') {
    filePath = path.join(__dirname, 'speaker.html');
  } else if (req.url === '/status') {
    // JSON status endpoint
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      listeners: listeners.size,
      speakerConnected: !!speaker,
      uptime: Math.floor(process.uptime())
    }));
    return;
  } else {
    res.writeHead(404);
    res.end('Not found');
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('File not found: ' + filePath);
      return;
    }
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(data);
  });
});

// ── WebSocket server ────────────────────────────────────────────────────
const wss = new WebSocketServer({ server: httpServer });

let speaker   = null;         // the one broadcasting
const listeners = new Set();  // all phones listening

wss.on('connection', (ws, req) => {
  const ip   = req.socket.remoteAddress;
  const role = req.url === '/ws/speaker' ? 'speaker' : 'listener';

  console.log(`[+] ${role.toUpperCase()} connected from ${ip}`);

  if (role === 'speaker') {
    // Only one speaker at a time
    if (speaker) {
      speaker.close(1000, 'Replaced by new speaker');
    }
    speaker = ws;
    broadcastStatus();

    ws.on('message', (data, isBinary) => {
      // Speaker sends two types of messages:
      //   1. Binary (ArrayBuffer) = audio chunk (WAV/PCM) → relay to all listeners
      //   2. Text (JSON)          = translation text       → relay to all listeners
      if (isBinary) {
        // Relay audio to all listeners
        listeners.forEach(listener => {
          if (listener.readyState === 1) {
            listener.send(data, { binary: true });
          }
        });
      } else {
        // Text message (translation, status, etc.)
        try {
          const msg = JSON.parse(data);
          // Broadcast to all listeners
          const out = JSON.stringify(msg);
          listeners.forEach(listener => {
            if (listener.readyState === 1) listener.send(out);
          });
          if (msg.type === 'translation') {
            process.stdout.write(`  📝 ${msg.text}\n`);
          }
        } catch (e) {
          // Raw text
          listeners.forEach(l => { if (l.readyState === 1) l.send(data); });
        }
      }
    });

    ws.on('close', () => {
      console.log('[-] Speaker disconnected');
      speaker = null;
      // Tell all listeners speaker is gone
      broadcast({ type: 'speaker_disconnected' });
      broadcastStatus();
    });

    ws.on('error', err => console.error('Speaker WS error:', err.message));

  } else {
    // Listener
    listeners.add(ws);
    broadcastStatus();

    // Tell this listener current state
    ws.send(JSON.stringify({
      type: 'connected',
      speakerActive: !!speaker,
      listenerCount: listeners.size
    }));

    ws.on('close', () => {
      listeners.delete(ws);
      console.log(`[-] Listener disconnected (${listeners.size} remaining)`);
      broadcastStatus();
    });

    ws.on('error', err => {
      listeners.delete(ws);
    });
  }
});

function broadcast(msg) {
  const data = JSON.stringify(msg);
  listeners.forEach(l => { if (l.readyState === 1) l.send(data); });
  if (speaker && speaker.readyState === 1) speaker.send(data);
}

function broadcastStatus() {
  const status = {
    type: 'status',
    listeners: listeners.size,
    speakerActive: !!speaker
  };
  const data = JSON.stringify(status);
  listeners.forEach(l => { if (l.readyState === 1) l.send(data); });
  if (speaker && speaker.readyState === 1) speaker.send(data);
  console.log(`  👥 ${listeners.size} listener(s) | Speaker: ${speaker ? '🟢 ON' : '🔴 OFF'}`);
}

// ── Start ───────────────────────────────────────────────────────────────
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log('\n╔══════════════════════════════════════════════╗');
  console.log('║   Live Translation Server — RUNNING           ║');
  console.log('╠══════════════════════════════════════════════╣');
  console.log(`║  Speaker:   http://localhost:${PORT}/speaker        ║`);
  console.log(`║  Listeners: http://YOUR-IP:${PORT}              ║`);
  console.log('╠══════════════════════════════════════════════╣');
  console.log('║  Find your IP:                                ║');
  console.log('║  Mac/Linux: ifconfig | grep "inet "           ║');
  console.log('║  Windows:   ipconfig | findstr IPv4           ║');
  console.log('╚══════════════════════════════════════════════╝\n');
});
