╔══════════════════════════════════════════════════════════╗
║   LIVE HINDI → CZECH TRANSLATION — LOCAL WiFi SETUP      ║
╚══════════════════════════════════════════════════════════╝

REQUIREMENTS
────────────
• Node.js installed on the speaker's laptop
  Download: https://nodejs.org (LTS version)
• Everyone on the same WiFi network
• Soniox API key: console.soniox.com

SETUP (one time only)
─────────────────────
1. Open terminal / command prompt
2. cd into this folder
3. Run:  npm install
   (installs the 'ws' WebSocket library — ~2 seconds)

START THE SERVER (every time)
──────────────────────────────
1. Run:  node server.js
2. You'll see:
     Speaker:   http://localhost:3000/speaker
     Listeners: http://YOUR-IP:3000

3. Find your laptop's IP address:
     Mac/Linux:  ifconfig | grep "inet " | grep -v 127
     Windows:    ipconfig | findstr IPv4
   It will look like 192.168.1.42 or 10.0.0.5

HOW TO USE
──────────
SPEAKER (the person speaking Hindi):
  • Open http://localhost:3000/speaker on the laptop
  • Enter Soniox API key
  • Click "Start Broadcasting"
  • Speak in Hindi — Czech translation plays locally
    AND is sent to all listeners automatically

LISTENERS (up to 20 phones):
  • Connect phone to the same WiFi
  • Open http://192.168.1.42:3000  (use your laptop's actual IP)
  • Tap "Enable Audio" (required on phones)
  • Wait for speaker to start — you'll hear Czech automatically
  • Czech text also appears on screen

WHAT EACH PERSON SEES
──────────────────────
Speaker screen:
  • Live Hindi transcript
  • Live Czech translation
  • Number of listeners connected
  • URL to share with listeners

Listener screen:
  • Large Czech text (live)
  • Small Hindi source text below
  • LIVE indicator when broadcast is active
  • Volume slider

FLOW
────
Hindi speech → Soniox STT → Czech text → Soniox TTS
     → Czech audio chunks
         ├── plays on speaker's laptop
         └── broadcasts over WiFi → all listener phones

LATENCY
───────
Approx 0.8–1.2 seconds end to end. Normal for live interpretation.

TROUBLESHOOTING
───────────────
• Listeners can't connect → Make sure they're on same WiFi
  and using the correct IP (not localhost)
• No audio on phone → Tap "Enable Audio" button first
  (browsers require a tap before playing audio)
• "Microphone denied" → Allow mic permission in browser
• Soniox error → Check API key is correct and has credits
