# 🎵 Musix

<p align="center">
<img src="README-img.gif" alt="Musix Screenshot">
</p>

A lightweight desktop music player built with Tauri and React!  
**Musix** provides a beautiful, minimalist interface for playing your music with advanced features.

## ✨ Features

- 🎧 **Elegant Music Player**: Play your favorite music with a sleek, modern interface.
- 📂 **Music Library Management**: Organize and browse your music collection with ease.
- 🎚️ **Built-in Equalizer**: Customize your sound with the integrated equalizer.
- 🔄 **Queue Management**: Create, shuffle, and manage your playback queue.
- 🎯 **Miniview Mode**: Compact floating player that stays out of your way.

## 📂 Directory Structure

```
🌟 Musix/
├── 📦 public/                     # Public assets
│
├── 🧩 src/                        # React frontend source
│   ├── components/                # UI components
│   │   ├── Player/                # Music player components
│   │   ├── Splash/                # App splash screen
│   │   ├── Sidebar/               # Navigation sidebar
│   │   ├── Directory/             # Music directory browser
│   │   ├── Equalizer/             # Audio equalizer
│   │   └── Miniview/              # Minimized player view
│   │
│   ├── context/                   # React context providers
│   ├── hooks/                     # Custom React hooks
│   ├── utils/                     # Utility functions
│   ├── App.jsx                    # Main application component
│   ├── App.css                    # Application styles
│   ├── main.jsx                   # Entry point
│   └── index.css                  # Global styles
│
├── 🦀 src-tauri/                  # Tauri backend
│   ├── src/                       # Rust source code
│   ├── Cargo.toml                 # Rust dependencies
│   └── tauri.conf.json            # Tauri configuration
│
├── README.md                      # Project documentation
├── package.json                   # JavaScript dependencies
├── vite.config.js                 # Vite configuration
└── index.html                     # HTML entry point
```

---

## 📄 Getting Started

Follow these steps to set up Musix on your system:

### 1️⃣ Clone the Repository

Clone or pull the latest version of the code:
```bash
git clone https://github.com/yashthorat7/musix.git
```

### 2️⃣ Install Dependencies

Install the necessary JavaScript packages:
```bash
npm install
```

### 3️⃣ Install Rust and Tauri

Make sure you have Rust installed for the Tauri backend:
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

## 🛠️ How to Run

### For Development

Run the development server:
```bash
npm run tauri dev
```

### For Building

Build the application:
```bash
npm run tauri build
```

---

## 🎮 Application Features

- 💿 **Music Playback**: Plays various audio formats with high-quality sound.
- 🎚 **Equalizer**: Fine-tune your listening experience with preset or custom EQ settings.
- 🔍 **Music Browser**: Find and organize your music files easily.
- 🖱️ **Drag & Drop**: Simply drag your music files into the player.
- 🖼️ **Always-on-Top Mode**: Keep the player visible while you work on other tasks.
- 📱 **Compact Design**: Small footprint with minimal memory usage.

## 📋 Requirements

- 🖥️ **OS**: Windows, macOS, or Linux
- 🧰 **Build Requirements**: 
  - Node.js (version 16 or higher)
  - Rust (edition 2021 or newer)
  - System dependencies required by Tauri

## ❤️ Developed By

👨‍💻 **Yash Thorat**  
Feel free to suggest improvements, or report issues!

⭐ Don't forget to **star** this repository if you find it useful!
