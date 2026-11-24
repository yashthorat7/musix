# 🎵 Musix

<p align="center">
  <img src="README-img.gif" alt="Musix Demo" width="340" />
</p>

<p align="center">
  <strong>A modern, lightweight vinyl-aesthetic desktop music player built with Tauri 2 & React.</strong>
</p>

<p align="center">
  <a href="#-features">Features</a> •
  <a href="#-windows-global--in-app-shortcuts">Shortcuts</a> •
  <a href="#-installation--setup">Setup & Installation</a> •
  <a href="#-building-the-windows-installer">Installer</a> •
  <a href="#-project-structure">Architecture</a>
</p>

---

## ✨ Features

- 🎧 **Vinyl Disc Aesthetic**: Rotating disc animation synced to playback, sleek tone arm, minimalist player controls, and marquee track title.
- 🧠 **Persistent Memory**:
  - Automatically remembers your **queue & playlist** across launches.
  - Restores your **last selected track** and **window position** on startup.
  - Persists your customized **volume level** and **audio equalizer levels**.
- ⌨️ **Windows Global Shortcuts (`Alt+Shift+M` or `Ctrl+Alt+M`)**:
  - Summon, focus, or hide the music player from anywhere in Windows — even while inside full-screen games, code editors, or browser tabs.
  - Full hardware **Media Key support** (`Play/Pause`, `Next Track`, `Previous Track`).
- 🎛️ **Real Web Audio Equalizer**:
  - Live 4-band equalizer powered by Web Audio API `BiquadFilterNode`s:
    - **Bass** (100 Hz LowShelf, ±12 dB)
    - **Mids** (1 kHz Peaking, Q = 1.0, ±12 dB)
    - **Treble** (3.5 kHz Peaking, Q = 1.0, ±12 dB)
    - **Air** (10 kHz HighShelf, ±12 dB)
  - Instant reset button to quickly return to a flat neutral (0 dB) sound profile.
- 🎵 **Multi-Format Audio & Cover Art Support**:
  - Plays `.mp3`, `.wav`, `.flac`, `.ogg`, `.m4a`, `.aac`, `.opus`, and `.wma`.
  - Native Rust metadata extraction (`audiotags`, `id3`, and `symphonia` for duration) with embedded album artwork extraction.
  - Automatic **online cover art fallback** via the iTunes Search API (cached in IndexedDB for 48 hours) when local embedded artwork is missing.
- 🪟 **System Tray Companion (Taskbar-Free)**:
  - Runs cleanly in your Windows system tray (`skipTaskbar: true`) without cluttering the taskbar, with single-instance support and Windows autostart on install.
  - Left-click the tray icon to toggle/focus the player; closing the window hides it to the tray.
  - Right-click tray menu for **Show / Focus Musix**, **Play / Pause**, **Next Track**, **Previous Track**, and **Quit Musix**.
- 📂 **Interactive Queue & Directory**:
  - Drag and drop single or multiple audio files onto the player, or add tracks via the native file picker.
  - Click any track in the queue to jump to it, or drag-and-drop items to reorder the queue.
  - Shuffle and remove tracks with immediate queue persistence.
- 🎯 **Miniview & Floating Window Experience**:
  - Shrink the player into an ultra-compact 96x96 px floating vinyl widget, and click it to restore back to the full 256x256 px player.
  - Smooth window dragging anywhere on the desktop, anchored above the Windows taskbar by default with position memory across restarts.

---

## ⌨️ Windows Global & In-App Shortcuts

| Scope      | Shortcut                          | Action                                                     |
| :--------- | :-------------------------------- | :--------------------------------------------------------- |
| **Global** | `Alt + Shift + M` / `Ctrl+Alt+M`  | **Summon / Focus / Hide Musix** from anywhere in Windows   |
| **Global** | `MediaPlayPause`                  | Play / Pause current track                                 |
| **Global** | `MediaTrackNext`                  | Skip to next track                                         |
| **Global** | `MediaTrackPrevious`              | Return to previous track                                   |
| **In-App** | `Space`                           | Play / Pause                                               |
| **In-App** | `←` / `→`                         | Seek backward / forward 5 seconds                          |
| **In-App** | `↑` / `↓`                         | Volume up / down (5% increments)                           |
| **In-App** | `M`                               | Mute / Unmute (toggles between 0% and 70%)                 |
| **In-App** | `N`                               | Next track in queue                                        |
| **In-App** | `P`                               | Previous track (restarts track if > 3s elapsed)            |

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

Musix produces an **NSIS installer (`.exe`)** with Windows autostart registration, uninstaller, and audio file associations (`.mp3`, `.wav`, `.flac`, `.ogg`, `.m4a`, `.aac`):

### Option A: One-Click Script (Recommended)

Double-click `scripts\build-installer.bat` or run:

```bash
npm run build:setup
```

This builds the frontend, compiles the NSIS installer, and packages a portable zip in `installer/`:
- `installer/musix_0.1.0_x64-setup.exe`
- `installer/musix-portable.zip`

### Option B: Using npm

```bash
npm run build:installer
```

The completed installer will be output to:

```
src-tauri/target/release/bundle/nsis/musix_0.1.0_x64-setup.exe
```

---

## 📂 Project Structure

```
🌟 Musix/
├── 🧩 src/
│   ├── components/
│   │   ├── Player/            # Vinyl disc, tone arm, progress bar, controller, title
│   │   ├── Directory/         # Queue browser, drag-to-reorder & track selector
│   │   ├── Equalizer/         # Web Audio API 4-band EQ & reset
│   │   ├── Miniview/          # Compact 96x96 floating player
│   │   ├── Sidebar/           # Sliding tray, volume slider, miniview trigger, navigation
│   │   └── Splash/            # Startup splash screen
│   ├── context/
│   │   └── AudioContext.jsx   # Master state, Tauri event listeners & keyboard dispatcher
│   ├── hooks/
│   │   ├── useAudioPlayer.js       # Playback controls & audio element lifecycle
│   │   ├── useDiscRotation.js      # Vinyl disc rotation animation synced to playback
│   │   ├── useFileDrop.js          # Multi-format drag & drop
│   │   ├── useMetadata.js          # Metadata invoke bridge
│   │   ├── usePlayer.js            # Player view helpers & close-to-tray action
│   │   └── useWebAudioEqualizer.js # Web Audio API BiquadFilterNodes
│   ├── utils/
│   │   ├── audioFormats.js    # Audio extension filters & title sanitizers
│   │   ├── formatTime.js      # Time formatting helpers
│   │   ├── onlineCoverArt.js  # iTunes Search API cover art fallback & IndexedDB cache
│   │   ├── songQueue.js       # Queue state machine
│   │   └── storage.js         # Persistent localStorage state manager
│   └── App.jsx
│
├── 🦀 src-tauri/
│   ├── src/
│   │   ├── lib.rs             # Tray icon, global shortcuts, window styling, metadata extractor
│   │   └── main.rs            # Entry point
│   ├── capabilities/          # Tauri permission capabilities
│   ├── nsis/
│   │   └── hooks.nsh          # NSIS post-install autostart & WebView2Loader hooks
│   ├── Cargo.toml             # Symphonia, audiotags, id3, rfd, tauri plugins
│   └── tauri.conf.json        # Window specs, NSIS installer, file associations
│
├── 📜 scripts/
│   └── build-installer.bat    # Automated installer & portable zip builder
└── README.md
```

---

## ❤️ Credits & Author

👨‍💻 **Yash Thorat**

- GitHub: [@yashthorat7](https://github.com/yashthorat7)

⭐ If you enjoy Musix, don't forget to **star** the repository!
