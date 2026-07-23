# 🐾 Clapet v1.0.0

**Clapet** is a cute, intelligent virtual desktop pet that lives right on your screen. It wanders around, blinks naturally, speaks via ElevenLabs neural TTS, interacts with AI models, and levels up as you feed it cookies.

Now migrated to **Tauri 2.0 + React** for ultra-lightweight performance (~25 MB RAM) and maximum security.

[![Русская версия](README.ru.md)](README.ru.md)

---

## ✨ What's New in v1.0.0

- 🚀 **Tauri 2.0 Engine** — Blazing fast startup, tiny memory footprint (~25MB RAM vs 200MB+ in Electron).
- 🎙️ **ElevenLabs Neural Voice (TTS)** — Optional professional neural voice speech synthesis for thoughts and AI responses.
- 🌐 **Full i18n Localization** — Instant one-click toggle between **English (EN)** and **Russian (RU)** across all UI elements, pet thoughts, and AI prompts.
- 🐾 **Dedicated Pet Customization** — Tailor pet color, opacity (20%–100%), breathing speed, breathing amplitude, and walk speed.
- 🎨 **Fluid Physics Animations** — Elastic bouncing, lifelike breathing squish/stretch, realistic leg stepping, thinking head-tilt, and cozy sleep Zzz.
- 📈 **Leveling System & Animated XP Bar** — Earn +10 XP per cookie feed. Features a progressive level curve (30, 60, 120, 240... XP) with an auto-hiding gradient XP bar.
- 🔍 **Live Search in Launcher** — Real-time instant filtering across all settings tabs as you type.
- 🛡️ **DevTools & Shortcut Protection** — Completely disables F12, F5, Ctrl+R, Ctrl+Shift+I/J/C, and default browser context menus.
- 🌐 **Built-in Proxy Support** — Configure HTTP, HTTPS, or SOCKS5 proxies with live connection testing and persistent storage.
- 🤖 **Multi-Provider AI Engine** — Support for OpenAI, OpenRouter, DeepSeek, Groq, Ollama (local LLMs), and Custom endpoints.

---

## 💻 Cross-Platform Support

Clapet v1.0.0 is automatically compiled for all desktop platforms via GitHub Actions:

| Platform | Installer / Package | Status |
|----------|--------------------|--------|
| **Windows** (x64) | `.exe` (NSIS), `.msi` | ✅ Stable |
| **macOS** (Apple Silicon M1/M2/M3) | `.dmg`, `.app` | ✅ Stable |
| **macOS** (Intel x64) | `.dmg`, `.app` | ✅ Stable |
| **Linux** (Ubuntu / Debian / Arch) | `.AppImage`, `.deb` | ✅ Stable |

---

## 🚀 Quick Start (Development)

### Requirements

- [Node.js](https://nodejs.org/) (v18+)
- [Rust](https://www.rust-lang.org/) (stable toolchain)

### Installation & Launch

```bash
# Clone the repository
git clone https://github.com/S1sTeam/Clapet.git
cd Clapet/clapet-tauri

# Install dependencies
npm install

# Run in dev mode (Vite + Tauri)
npm run tauri dev
```

### Production Build

To compile a production binary for your current OS:

```bash
npm run tauri build
```

---

## 🎮 How to Interact

- **Right Click (PKM)** on Pet: Opens the circular Radial Action Menu (Feed, Sleep/Wake, Walk/Stop, Ask AI, Settings ⚙️).
- **Left Click Drag**: Pick up and drag the pet anywhere on your screen.
- **Feeding**: Feed cookies (15 min cooldown). Each cookie yields +10 XP with particle effects.
- **Ask AI**: Type your prompt and press **Enter** to receive instant cute responses with TTS speech.

---

## 📜 License

MIT License © 2026 Clapet Team.
