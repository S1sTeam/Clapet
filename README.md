# 🐾 Clapet

**Clapet** is a fun desktop pet that lives right on your screen. It walks around, reacts to clicks, chats via AI, and brightens your day. Built with Electron.

<p align="center">
  <img src="build/icon.png" width="128" alt="Clapet logo">
</p>

[![Русская версия](README.ru.md)](README.ru.md)

---

## ✨ Features

- 🖥️ **Living pet** — walks across your screen, blinks, reacts to dragging
- 🎯 **Radial menu** — right-click opens a circular action menu
- 🤖 **AI chat** — press Ask to talk to an AI model
- 🚶 **Auto-walk** — the pet wanders around on its own (toggle on/off)
- 😴 **Moods** — Think, Happy, Sleep, Feed — each with unique animations
- ⚙️ **Settings** — choose AI provider, API key, model, proxy
- 🎨 **Fluent icons** — all icons in Microsoft Fluent UI style (SVG)
- 🟠 **Gruvbox dark theme** — warm dark orange design (#b54a30)
- 🔒 **Stealth Electron** — no Electron traces in userAgent, no F12/DevTools
- 📦 **Cross-platform** — Windows, Linux, macOS

---

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Launch
npm start
```

> **Note:** The `keyspy` native module requires build tools on first install. On Windows, run as admin. On Linux, install `build-essential`. On macOS, Xcode CLI tools are sufficient.

---

## 💻 Platform Support

| Platform | Status | Installer |
|----------|--------|-----------|
| Windows x64 | ✅ Full | `.exe` (NSIS) |
| Windows ARM64 | ✅ Full | `.exe` (NSIS) |
| Linux x64 | ✅ Full | `.AppImage`, `.deb` |
| macOS x64 | ✅ Full | `.dmg` |
| macOS ARM64 | ✅ Full | `.dmg` |

---

## 🏗️ Building

### Local build

```bash
npm run build
```

The output goes to `dist/`. Platform targets are configured in `package.json` → `"build"`.

### CI/CD (GitHub Actions)

Tag a version to trigger automated builds:

```bash
git tag v0.2.0
git push --tags
```

GitHub Actions builds all platforms in parallel. Download artifacts from the **Actions** tab → latest run → **Artifacts**.

---

## 🤖 AI Providers

Supported providers (configure in Settings ⚙️):

- **OpenAI** — GPT-4, GPT-4o, o1, o3
- **Anthropic** — Claude 3.5 Sonnet, Claude 3 Opus
- **Google Gemini** — Gemini 1.5 Pro, Gemini 2.0 Flash
- **Groq** — Llama 3, Mixtral (fast inference)
- **DeepSeek** — DeepSeek V2, DeepSeek Coder
- **Mistral** — Mistral Large, Mistral Small
- **OpenRouter** — unified access to 200+ models
- **Together AI** — open-source model hosting
- **Perplexity** — Sonar, Sonar Pro
- **xAI (Grok)** — Grok-2, Grok-mini
- **GitHub Models** — free tier via GitHub token
- **Custom** — any OpenAI-compatible API (e.g. local LLM)

Proxy support (HTTP/HTTPS/SOCKS) is built in.

---

## 🎮 Usage

### Pet Mode

The pet appears as a small 187×204 overlay window. Interact via:

| Action | Input |
|--------|-------|
| **Drag** | Click & hold anywhere on the pet, move mouse |
| **Radial menu** | Right-click on the pet |
| **Double-click** | Opens Settings panel |
| **Feed** | 🍪 button in radial menu (+10 XP, 5 min cooldown) |
| **Walk** | 🚶 toggle — pet wanders around the screen |
| **Ask** | 💬 type a question, pet responds via AI |
| **Sleep** | 😴 pet falls asleep with floating "Z" particles |

### Launcher

The main 876×574 launcher window has four tabs:

1. **Launch** — enter pet mode, splash screen preview
2. **Pet settings** — always-on-top, auto-walk, font size, particles
3. **AI** — provider, model, API key, custom endpoint
4. **Main settings** — accent color, proxy config, TTS, about

---

## 🎯 Experience System

- Each feed gives **+10 XP**
- Level formula: `XP_required(n) = 15 * n * (n + 1)`
  - Level 1: 30 XP, Level 2: 90 XP total, Level 3: 180 XP total...
- XP bar appears on feed with a smooth fill animation
- "+10" float text rises and fades out
- Heart particle burst on level-up

---

## 🛠️ Tech Stack

| Component | Technology |
|-----------|-----------|
| **Framework** | Electron 33 |
| **Language** | Vanilla JavaScript (no framework) |
| **Styles** | CSS (custom, no libraries) |
| **State** | LocalStorage persistence |
| **Key capture** | `keyspy` — global hotkeys |
| **Builder** | electron-builder 26 |
| **CI/CD** | GitHub Actions |
| **Platforms** | Windows x64/ARM64, Linux x64, macOS x64/ARM64 |

---

## 📁 Project Structure

```
clapet/
├── .github/
│   └── workflows/
│       └── build.yml         # CI/CD pipeline
├── build/
│   └── icon.png              # App icon
├── src/
│   ├── index.html             # Main page
│   ├── main.js                # Pet logic (renderer)
│   └── styles.css             # Styles
├── dist/                      # Build output (after npm run build)
├── main.js                    # Electron main process
├── package.json               # Config and dependencies
├── run.bat                    # One-click launch (Windows)
└── run-nogpu.bat              # Launch without GPU (Windows)
```

---

## ⚙️ Configuration

All settings are stored in `localStorage`. Key items:

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `pet_provider` | string | `openai` | Active AI provider |
| `pet_model` | string | — | Selected model |
| `pet_key` | string | — | API key |
| `pet_wander` | int | `0` | Auto-walk enabled |
| `pet_ontop` | int | `0` | Always-on-top |
| `pet_color` | string | `#b54a30` | Accent color |
| `pet_xp` | int | `0` | Experience points |
| `pet_level` | int | `1` | Current level |
| `particles_enabled` | int | `1` | Particle effects |
| `proxy_enabled` | int | `0` | Proxy enabled |
| `auto_think` | int | `1` | Random thoughts |
| `tts_enabled` | int | `0` | Text-to-speech |

---

## 📋 Roadmap

- [x] Cross-platform builds (Win/Linux/Mac)
- [x] AI provider integrations
- [x] XP/leveling system
- [x] Custom accent colors
- [ ] More animations and states
- [ ] Skins/themes
- [ ] Drag & drop files onto pet
- [ ] Sound effects
- [ ] Widget mode (weather, clock)

---

## 📜 License

MIT — do whatever you want.

---

## 👤 Author

**S1sTeam**

---

## ⚠️ Notes

- On rebuild (`npm run build`), make sure the previous Clapet process is closed — otherwise you'll get `EBUSY`. Use `taskkill /f /im Clapet.exe` on Windows.
- macOS builds are unsigned — Gatekeeper will show a warning. `xattr -dr com.apple.quarantine /Applications/Clapet.app` to bypass.
- Linux builds use `.AppImage` (portable) and `.deb` (Debian/Ubuntu). For other distros, use `--linux tar.gz` for a portable tarball.
