<div align="center">
  <img src="public/favicon.png" width="120" alt="iBooth Logo" />
  <h1>iBooth</h1>
  <p><b>A modern, open-source desktop photobooth software built for creators and events.</b></p>
  
  [![Made with React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](#)
  [![Made with Electron](https://img.shields.io/badge/Electron-191970?style=for-the-badge&logo=Electron&logoColor=white)](#)
  [![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)](#)
</div>

---

## ✨ Features

iBooth combines a live camera capture booth, a visual template editor, and native hardware integration into a single, cohesive desktop application.

* 📸 **Live Capture Booth**: A highly responsive, full-screen camera booth interface with countdowns and shutter effects.
* 🎨 **Visual Template Editor**: Drag-and-drop elements, apply filters, and design custom photostrips without leaving the app.
* 🖨️ **Instant Hardware Printing**: Native integration with operating system printer services for zero-latency physical printing.
* ☁️ **Cloud Sync & Catalog**: Secure authentication via Supabase with ReCAPTCHA. Save, browse, and sync your photostrip templates to the cloud.
* 🌗 **Dynamic Themes**: Beautiful, desktop-first UI with seamless Dark and Light mode support.

## 🚀 Download & Install

You don't need to build from source to use iBooth! We provide pre-compiled installers for macOS and Windows.

1. Go to the [**Releases**](https://github.com/anywindo/iBooth/releases/) page.
2. Download the installer for your operating system:
   * **Mac (Apple Silicon)**: `iBooth-x.x.x-mac-arm64.dmg`
   * **Mac (Intel)**: `iBooth-x.x.x-mac-x64.dmg`
   * **Windows**: `iBooth-x.x.x-win-x64.exe`
3. Run the installer and launch the app!

*(Note: On macOS, if you receive an "unidentified developer" warning, **Right-Click -> Open** the app to bypass Gatekeeper).*

---

## 🛠️ Local Development

Want to contribute or build your own version of iBooth? The project is built with **React 19**, **Vite**, and **Electron**.

### Prerequisites
* Node.js (v18+)
* Git

### Setup
```bash
# 1. Clone the repository
git clone https://github.com/anywindo/iBooth.git
cd iBooth

# 2. Install dependencies
npm install

# 3. Start the development servers
# Terminal 1: Run the web interface (Vite)
npm run dev

# Terminal 2: Run the Electron desktop app wrapping Vite
npm run electron:dev
```

### Packaging for Release
We use `electron-builder` to compile macOS and Windows binaries.
```bash
# Build for macOS (DMG, ZIP)
npm run electron:dist:mac

# Build for Windows (NSIS EXE)
npm run electron:dist:win
```

## 📂 Architecture

iBooth's architecture isolates the frontend UI from the desktop operating system context for security and performance.

* `src/` - The React frontend application.
  * `src/screens/` - Major views (Landing, Editor, Booth, Preview, Profile).
  * `src/core/` - Canvas rendering engine (`canvas-renderer.js`), state store, and constants.
* `electron/` - Desktop backend processes.
  * `electron/main/` - Electron main process and window management.
  * `electron/preload/` - Context isolation IPC bridge.
  * `electron/services/` - Native system integrations (e.g., native printer service).
* `electron-builder.yml` - Packaging and auto-update configuration.

## 📄 License & Credits

* iBooth is Open Source. 
* See the [Contributors](https://github.com/anywindo/iBooth/graphs/contributors) page for the wonderful people helping build this project.
