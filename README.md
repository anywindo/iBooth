# Photobooth Desktop

Desktop-first photobooth editor, capture booth, and final preview/export app.

## Run

```sh
npm start
```

Open `http://localhost:4173/editor`.

## Structure

- `app.js` is the browser entry point.
- `src/main.js` handles route selection and screen mounting.
- `src/components/` holds shared UI components.
- `src/core/` holds shared constants, DOM utilities, state/storage, and canvas rendering.
- `src/screens/` holds feature screens: editor, booth, and preview.
- `styles.css` holds the desktop-first application styling.

The final photostrip is rendered through `src/core/canvas-renderer.js`, so booth previews and exported preview output share the same rendering path.
