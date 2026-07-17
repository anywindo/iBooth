# iBooth

An open-source, desktop-first photobooth editor, capture booth, and final preview/export application. Built with React, Vite, and Electron.

## Development

Run the application locally during development:

```sh
# Run web interface (Vite)
npm run dev

# Run Electron desktop app (electron-vite)
npm run electron:dev
```

## Packaging & Distribution

This project uses `electron-builder` to compile macOS and Windows installers. Output files are placed in the `/release` directory.

### Build Locally
```sh
# Build for all platforms
npm run electron:dist

# Build for macOS only (DMG, ZIP)
npm run electron:dist:mac

# Build for Windows only (NSIS EXE)
npm run electron:dist:win
```

### Publish to GitHub Releases
To automatically upload binaries to a draft GitHub Release, export a Classic Personal Access Token with the `repo` scope and run:

```sh
export GITHUB_TOKEN="your_token_here"
npx electron-builder --mac --win --publish always
```

## Project Structure

- `src/` - React frontend application
  - `src/screens/` - Major views (Landing, Editor, Booth, Preview, Profile, Catalog)
  - `src/components/` - Shared UI components (InteractiveDots, AppShell, Modals)
  - `src/core/` - Canvas rendering engine, state store, and constants
- `electron/` - Desktop backend processes
  - `electron/main/` - Electron main process
  - `electron/preload/` - Context isolation IPC bridge
  - `electron/services/` - Native system integrations (e.g., native printer service)
- `styles.css` - Global theming and desktop-first styling
- `electron-builder.yml` - Packaging and auto-update configuration

The final photostrip is rendered through `src/core/canvas-renderer.js`, ensuring that booth previews and exported outputs share exactly the same visual rendering path.
