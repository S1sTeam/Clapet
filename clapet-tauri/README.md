# 🐾 Clapet v1.0.0 (BUILD #2)

**Clapet** is a cute, intelligent, ultra-lightweight virtual desktop pet built with **Tauri 2.0 + React + TypeScript**. It lives directly on your screen, tracks your cursor with smooth 60 FPS LERP physics, reacts to your PC music with dance parties, wakes up furiously red when shaken, and offers personalized AI conversations with custom system prompts!

---

## 📦 Downloads (v1.0.0 BUILD #2)

| Platform | Architecture | File Link |
| --- | --- | --- |
| 🪟 **Windows** | x64 Setup | [Clapet_1.0.0_x64-setup.exe](https://github.com/S1sTeam/Clapet/releases/download/v1.0.0/Clapet_1.0.0_x64-setup.exe) |
| 🪟 **Windows** | x64 MSI (English) | [Clapet_1.0.0_x64_en-US.msi](https://github.com/S1sTeam/Clapet/releases/download/v1.0.0/Clapet_1.0.0_x64_en-US.msi) |
| 🪟 **Windows** | x64 MSI (Русский) | [Clapet_1.0.0_x64_ru-RU.msi](https://github.com/S1sTeam/Clapet/releases/download/v1.0.0/Clapet_1.0.0_x64_ru-RU.msi) |
| 🍏 **macOS** | Apple Silicon (ARM64) | [Clapet_1.0.0_aarch64.dmg](https://github.com/S1sTeam/Clapet/releases/download/v1.0.0/Clapet_1.0.0_aarch64.dmg) |
| 🍏 **macOS** | App Bundle | [Clapet_aarch64.app.tar.gz](https://github.com/S1sTeam/Clapet/releases/download/v1.0.0/Clapet_aarch64.app.tar.gz) |
| 🐧 **Linux** | x64 AppImage | [Clapet_1.0.0_amd64.AppImage](https://github.com/S1sTeam/Clapet/releases/download/v1.0.0/Clapet_1.0.0_amd64.AppImage) |
| 🐧 **Linux** | x64 DEB | [Clapet_1.0.0_amd64.deb](https://github.com/S1sTeam/Clapet/releases/download/v1.0.0/Clapet_1.0.0_amd64.deb) |
| 🐧 **Linux** | x64 RPM | [Clapet-1.0.0-1.x86_64.rpm](https://github.com/S1sTeam/Clapet/releases/download/v1.0.0/Clapet-1.0.0-1.x86_64.rpm) |

---

## ✨ Features & What's New in BUILD #2

- ⚡ **Shake to Wake Mechanics** — Clapet sleeps peacefully on his side. To wake him up, grab and shake him violently with your mouse! He pops up in a **furious red rage** (`#ff2222`) with steam, anger particles, and funny grumpy remarks, before cooling down after 3.5 seconds!
- 🎧 **Smart PC Audio Music Detector & Dance Party** — Clapet automatically detects genuine music playing on your PC (SoundCloud, Spotify, YouTube Music, VK, AIMP, MP3/FLAC) and starts grooving (`state-dancing`) with musical notes, sparkles, and hearts! *Intelligently skips ads and regular spoken videos.*
- 🤖 **Custom System Instruction (System Prompt)** — Full freedom to override Clapet's personality! Instruct him to be your assistant, speak in a custom tone, or obey your custom rules via the AI settings tab.
- 🤪 **Nihmadev 3000 Freak Easter Egg** — Type `Нихма` or `Nihma` into the AI chat to trigger a 12-second crazy glitched freak mode with derpy misaligned eyes, sticking tongue 👅, and hilarious voice remarks!
- 📐 **Dynamic Adaptive Window & 60 FPS LERP Eye Tracking** — Zero invisible hitbox blocking; window expands dynamically for thought bubbles and shrinks to 185x195px compact size when idling.
- 🎨 **Clean Vector SVG Particles** — Crisp vector icons for stars, sparkles, hearts, cookies, fire, and musical notes.
- 🎭 **Rich Sub-Variant Animations** — Dynamic spontaneous idle behaviors every 25 seconds (looking around, wiggling paws, yawning, bouncing), 3 sleeping poses (on side, curled, flat), and lively eating hops.
- 🔒 **Ultra-Low Memory Footprint (~30–60 MB RAM)** — V8 memory capping & optimized WebView2 IPC keep RAM usage super light permanently.
- 🎙️ **ElevenLabs Neural Voice (TTS)** — Optional professional neural voice speech synthesis for thoughts and AI responses.
- 🌐 **Full i18n Localization** — Instant one-click toggle between **English (EN)** and **Russian (RU)** across all UI elements, pet thoughts, and AI prompts.

---

## 🚀 How to Run & Build Locally

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
# Compile optimized executable
npm run tauri build
```

---

## 📄 License
Created with ❤️ by **S1sTeam / Clapet**.
