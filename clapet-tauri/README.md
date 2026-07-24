# 🐾 Clapet v1.0.0 (BUILD #2)

**Clapet** is a cute, intelligent, ultra-lightweight virtual desktop pet built with **Tauri 2.0 + React + TypeScript**. It lives directly on your screen, tracks your cursor with smooth 60 FPS LERP physics, reacts to your PC music with dance parties, wakes up furiously red when shaken, and offers personalized AI conversations with custom system prompts!

---

## ✨ Features & What's New in BUILD #2

- ⚡ **Shake to Wake Mechanics** — Clapet sleeps peacefully on his side. To wake him up, grab and shake him with your mouse! He pops up in a **furious red rage** (`#ff2222`) with steam, anger particles, and funny grumpy remarks, before cooling down after 3.5 seconds!
- 🎧 **Smart Music Detector & Dance Party** — Clapet automatically detects genuine music playing on your PC (SoundCloud, Spotify, YouTube Music, VK, AIMP, MP3/FLAC files) and starts grooving (`state-dancing`) with musical notes, sparkles, and hearts! *Intelligently skips ads and regular spoken videos.*
- 🤖 **Custom System Instruction (System Prompt)** — Full freedom to override Clapet's personality! Instruct him to be your assistant, speak in a custom tone, or obey your custom rules via the AI settings tab.
- 👁️ **Butter-Smooth 60 FPS LERP Eye Tracking** — Upgraded from choppy intervals to 60 FPS `requestAnimationFrame` linear interpolation for silky-smooth eye movements.
- 🎨 **Clean Vector SVG Particles** — Replaced plain text emojis with sharp, crisp SVG vector icons for stars, sparkles, hearts, cookies, fire, and musical notes.
- 🎭 **Rich Sub-Variant Animations** — Dynamic spontaneous idle behaviors every 25 seconds (looking around, wiggling paws, yawning, bouncing), 3 sleeping poses (on side, curled, flat), and lively eating hops.
- 🔒 **Ultra-Low Memory Footprint (~30–60 MB RAM)** — V8 memory capping & optimized WebView2 IPC keep RAM usage super light permanently.
- 🎙️ **ElevenLabs Neural Voice (TTS)** — Optional professional neural voice speech synthesis for thoughts and AI responses.
- 🌐 **Full i18n Localization** — Instant one-click toggle between **English (EN)** and **Russian (RU)** across all UI elements, pet thoughts, and AI prompts.
- 🛡️ **Built-in Proxy & Multi-Model AI** — Support for OpenAI, OpenRouter, DeepSeek, Groq, Ollama (local LLMs), and SOCKS5/HTTP proxies.

---

## 🚀 How to Run & Build

### Prerequisites
- Node.js (v18+)
- Rust & Cargo (Latest Stable)

### Development
```bash
# Install dependencies
npm install

# Run in development mode (with Hot Reload & Tauri IPC)
npm run tauri dev
```

### Build Production Binary
```bash
# Compile optimized Windows executable
npm run tauri build
```

---

## 📄 License
Created with ❤️ by **S1sTeam / Clapet**.
