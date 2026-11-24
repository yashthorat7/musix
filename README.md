# 🎵 Musix

<p align="center">
  <img src="README-img.gif" alt="Musix Demo" width="340" />
</p>

<p align="center">
  <strong>A modern, lightweight vinyl-aesthetic desktop music player built with Tauri 2 & React.</strong>
</p>

<p align="center">
  <a href="#-features">Features</a> •
  <a href="#-windows-global-shortcuts">Shortcuts</a> •
  <a href="#-installation--setup">Setup & Installation</a> •
  <a href="#-building-the-installer">Installer</a> •
  <a href="#-architecture">Architecture</a>
</p>

---

## ✨ Features

- 🎧 **Vinyl Disc Aesthetic**: Rotating disc animation, sleek tone arm, minimalist player controls, and dynamic palette generation.
- 🧠 **Persistent Memory**:
  - Automatically remembers your **queue & playlist** across launches.
  - Restores your **currently playing song** and exact **seek timestamp**.
  - Persists your customized **volume level** and **audio equalizer levels**.
- ⌨️ **Windows Global Shortcut (`Alt+Shift+M` or `Ctrl+Alt+M`)**:
  - Summon, focus, or toggle the music player from anywhere in Windows — even while inside full-screen games, code editors, or browser tabs.
  - Full hardware **Media Key support** (`Play/Pause`, `Next Track`, `Previous Track`).
- 🎛️ **Real Web Audio Equalizer**:
  - Live 4-band equalizer powered by Web Audio API BiquadFilterNodes:
    - **Bass** (100 Hz LowShelf, ±12 dB)
    - **Mids** (1 kHz Peaking, ±12 dB)
    - **Treble** (3.5 kHz Peaking, ±12 dB)
    - **Air** (10 kHz HighShelf, ±12 dB)
  - Instant reset button to quickly return to flat neutral (0 dB) sound profile.
- 🎵 **Multi-Format Audio Support**:
  - Plays `.mp3`, `.wav`, `.flac`, `.ogg`, `.m4a`, `.aac`, `.opus`, and `.wma`.
  - Automatic ID3v2 and native audio tag metadata parser with embedded album artwork extraction.
- 🪟 **System Tray Companion (Taskbar-Free)**:
  - Lives cleanly in your Windows system tray without cluttering the taskbar.
  - Left-click tray icon to instantly toggle/summon the player.
  - Right-click tray menu for quick Play/Pause, Track Skip, and Exit.
- 📂 **Interactive Queue & Directory**:
  - Drag and drop single or multiple audio files.
  - Click any track directly in the playlist to jump to it.
  - Shuffle and remove tracks with immediate queue recalculation.
- 🎯 **Miniview & Floating Window Experience**:
  - Shrink the player into an ultra-compact 96x96 px floating vinyl widget.
  - Smooth hardware-accelerated window dragging (`startDragging`) anywhere on the desktop.
  - Dual minimize controls: minimize to Windows Taskbar (`-`) or shrink to compact Miniview (`⤓`).
  - Click to maximize/restore from Miniview back to full player (256x256 px).
  - Double-click the marquee title bar to toggle Miniview / Fullview.
  - Spot-on spawn positioning above the Windows Taskbar with position memory across restarts.

---

## ⌨️ Windows Global & In-App Shortcuts

| Scope      | Shortcut                         | Action                                                     |
| :--------- | :------------------------------- | :--------------------------------------------------------- |
| **Global** | `Alt + Shift + M` / `Ctrl+Alt+M` | **Summon / Focus / Toggle Musix** from anywhere in Windows |
| **Global** | `MediaPlayPause`                 | Play / Pause current track                                 |
| **Global** | `MediaTrackNext`                 | Skip to next track                                         |
| **Global** | `MediaTrackPrevious`             | Return to previous track                                   |
| **In-App** | `Space`                          | Play / Pause                                               |
| **In-App** | `←` / `→`                        | Seek backward / forward 5 seconds                          |
| **In-App** | `↑` / `↓`                        | Volume up / down (5% increments)                           |
| **In-App** | `M`                              | Mute / Unmute                                              |
| **In-App** | `N`                              | Next track in queue                                        |
| **In-App** | `P`                              | Previous track                                             |
| **In-App** | `D`                              | Open / Close Queue Directory                               |
| **In-App** | `E`                              | Open / Close Equalizer                                     |

---

## 🛠️ Installation & Setup

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- [Rust](https://www.rust-lang.org/tools/install) (latest stable)
- WebView2 (pre-installed on Windows 10/11)

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/yashthorat7/musix.git
cd musix
```

### 2️⃣ Install Dependencies

```bash
npm install
```

### 3️⃣ Run in Development Mode

```bash
npm run tauri dev
```

---

## 📦 Building the Windows Installer

Musix produces a production-grade **NSIS installer (`.exe`)** with Start Menu & Desktop shortcuts, uninstaller, and Windows audio file associations:

### Option A: One-Click Script (Recommended)

Simply double-click or run:

```bash
scripts\build-installer.bat
```

### Option B: Using npm

```bash
# 1. Build production NSIS installer
npm run build:installer

# 2. Register Windows shortcut key (Ctrl+Alt+M)
npm run setup:shortcut
```

The completed installer will be output to:

```
installer/musix_0.1.0_x64-setup.exe
```

(or `src-tauri/target/release/bundle/nsis/musix_0.1.0_x64-setup.exe`)

When installed, Windows will register Musix in the Start Menu, create a Desktop shortcut with the `Ctrl+Alt+M` hotkey, and associate audio files with Musix.

---

## 📂 Project Structure

```
🌟 Musix/
├── 🧩 src/
│   ├── components/
│   │   ├── Player/            # Vinyl disc, tone arm, progress bar, controller
│   │   ├── Directory/         # Queue browser & track selector
│   │   ├── Equalizer/         # Web Audio API 4-band EQ & presets
│   │   ├── Miniview/          # Compact 96x96 floating player
│   │   ├── Sidebar/           # Sliding tray, volume slider, navigation
│   │   └── Splash/            # Startup splash screen
│   ├── context/
│   │   └── AudioContext.jsx   # Master state, event listeners & keyboard dispatcher
│   ├── hooks/
│   │   ├── useAudioPlayer.js       # Playback controls & throttled progress persistence
│   │   ├── useWebAudioEqualizer.js # Web Audio API BiquadFilterNodes
│   │   ├── useFileDrop.js          # Multi-format drag & drop
│   │   └── useMetadata.js          # Metadata invoke bridge
│   ├── utils/
│   │   ├── storage.js         # Persistent localStorage memory manager
│   │   ├── songQueue.js       # State machine queue manager
│   │   └── audioFormats.js    # Audio extension filters & title sanitizers
│   └── App.jsx
│
├── 🦀 src-tauri/
│   ├── src/
│   │   ├── lib.rs             # Tray icon, global shortcuts, metadata extractor
│   │   └── main.rs            # Entry point
│   ├── Cargo.toml             # Symphonia, audiotags, tauri plugins
│   └── tauri.conf.json        # Window specs, NSIS installer, file associations
│
├── 📜 scripts/
│   ├── build-installer.bat    # Automated one-click installer builder
│   └── create-shortcut.ps1    # Configures Windows hotkey (Ctrl+Alt+M) on .lnk
└── README.md
```

---

## ❤️ Credits & Author

👨‍💻 **Yash Thorat**

- GitHub: [@yashthorat7](https://github.com/yashthorat7)

⭐ If you enjoy Musix, don't forget to **star** the repository!
