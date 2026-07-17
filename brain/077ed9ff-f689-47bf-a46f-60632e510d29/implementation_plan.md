# Fix Cloudflare Turnstile in Electron Architecture

To completely eliminate the crashes, grey screens, and verification failures caused by Turnstile in Electron, we must enforce secure, standard web environments that Cloudflare explicitly supports.

## Background Context
Turnstile fails in Electron primarily due to:
1. **Insecure Origins (`file://`)**: Cloudflare aggressively blocks Turnstile execution on non-HTTP/HTTPS origins. This prevents it from working in production Electron bundles.
2. **IPC Conflicts with `webSecurity: false`**: Turnstile injects a cross-origin iframe (`challenges.cloudflare.com`) which executes WebRTC STUN requests to check IP legitimacy. When Chromium's `webSecurity` is disabled (a common workaround to load local images), this cross-origin WebRTC interaction violates internal Site Isolation assumptions, triggering an unrecoverable `bad_message.cc:29` IPC crash that kills the renderer.
3. **Modified User-Agents**: Stripping the `Electron/` string from the User-Agent was a hacky attempt to bypass bot detection, but Cloudflare's behavioral analysis detects this anomaly, causing Turnstile to silently fail or refuse validation.

## Proposed Changes

We will restructure the Electron main process to load the application using a **local HTTP server** in production, enabling strict `webSecurity: true`, and eliminating all hacky command-line flags.

### 1. `electron/main/index.js`
- **Remove all Workarounds**: Delete the modified `userAgentFallback`, `disable-site-isolation-trials`, and `webrtc-ip-handling-policy` flags.
- **Secure Defaults**: Enforce `sandbox: true`, `contextIsolation: true`, `nodeIntegration: false`, and `webSecurity: true` on the `BrowserWindow`.
- **Local HTTP Server (Production)**: Implement a lightweight, built-in Node.js `http.createServer` that serves the production `renderer` static files over `http://127.0.0.1:PORT`. 
- **Local Media Endpoint**: Add a specific endpoint to the local HTTP server (e.g., `http://127.0.0.1:PORT/local-media?path=...`) to securely serve local user images (like uploaded templates) without needing `webSecurity: false` or `file://` protocols.

### 2. `electron/services/fileStorage.js`
- **Update Frame Paths**: Modify `importFrame` to return the absolute local file path (or a relative identifier) instead of `file://${destPath}`. The frontend will request this through the new local HTTP server's `/local-media` endpoint.

### 3. `index.html` (CSP)
- **Add Content Security Policy**: Implement a strict `<meta http-equiv="Content-Security-Policy">` that allows `script-src`, `frame-src`, and `connect-src` to `https://challenges.cloudflare.com`, preventing Turnstile from being blocked while maintaining overall app security.

### 4. `src/store/authStore.js` & `AuthScreen/AuthModal`
- **Verify Integration**: Ensure the frontend correctly parses the `captchaToken` and passes it to the backend. No structural changes are needed here, as the previous integration is correct, but we will confirm all validation flows properly.

## User Review Required
> [!WARNING]
> By moving to a local HTTP server in production, you will need to add `127.0.0.1` and `localhost` to your Cloudflare Turnstile dashboard's allowed domains for this to work in both development and production. (You should have already done this for local development).

## Verification Plan
### Manual Verification
1. Run `npm run electron:dev`.
2. Ensure the Turnstile widget renders correctly.
3. Verify that the app does **not** crash (`Terminating renderer for bad IPC message`).
4. Ensure uploaded templates (local images) load correctly on the canvas via the new local HTTP server endpoint.
