# Keymint Electron Starter

A ready-to-use Electron app with Keymint license activation, machine binding, and health checks pre-configured.

## Quick Start

```bash
npm install
cp .env.example .env   # then fill in your keys
npm run dev
```

## Configuration

Copy `.env.example` to `.env` and set:

| Variable | Description |
|---|---|
| `KEYMINT_CLIENT_API_KEY` | Client API key from [Keymint Dashboard](https://app.keymint.dev) |
| `KEYMINT_PRODUCT_ID` | Your product ID |
| `KEYMINT_BASE_URL` | Optional. API base URL, defaults to `https://api.keymint.dev` |
| `KEYMINT_PUBLIC_KEY` | Optional. Public key PEM for [offline licenses](#offline-licenses) |

`.env` is loaded with `dotenv` when the app starts. If the variables are missing, the activation dialog says so instead of the app crashing.

## What's Included

- **Activation dialog** — prompts the user for a license key on first launch
- **Machine binding** — locks the license to a stable installation ID from `KeyMint.getOrCreateInstallationId()`
- **Encrypted storage** — stores license state in `electron-store` with encryption
- **Preload bridge** — secure IPC via `contextBridge` (no `nodeIntegration`)
- **Health checks** — re-validates the license on launch and every 24 hours. A rejected license (revoked, expired, over its device limit) returns the user to activation; if the server can't be reached, the app keeps working with the cached state

## Offline Licenses

For machines without internet access, the user can import a `.lic` file instead of entering a key ("Import offline license" in the activation dialog). The app verifies it locally with the SDK's `verifyOfflineLicense`.

1. **Public key**: copy the PEM from **Developer → Public Keys** in the dashboard into `KEYMINT_PUBLIC_KEY` (quoted multi-line value, or line breaks written as `\n`). It's a public key, safe to ship.
2. **The `.lic` file**: create it in the dashboard (a license's activations → **Create offline license**) or from your backend with the SDK's `signKey` (admin API key; never call it from the app). Sign it for the machine's installation ID, the same `hostId` used for online activation (`~/.keymint/installation-id`).
3. The file must match `KEYMINT_PRODUCT_ID` and this machine. When it expires, the user imports a newly signed file.

The file is kept in the encrypted store and re-checked on launch and every 24 hours. Expiry is checked against the later of the system clock and the last time a check succeeded, so setting the clock back doesn't extend it. Online activation works as before; offline is an extra path.

## Project Structure

```
src/
├── main/
│   ├── index.ts       # App lifecycle, window management
│   ├── ipc.ts         # IPC handlers (activate, importOffline, deactivate, getStatus)
│   ├── license.ts     # Keymint API calls, health check, machine ID
│   ├── offline.ts     # Offline .lic verification
│   ├── store.ts       # Encrypted license state (electron-store)
│   └── events.ts      # Activation event from IPC to the window manager
├── preload/
│   └── index.ts       # contextBridge exposing licenseAPI
└── renderer/
    ├── activation.html  # License key input dialog
    └── app.html         # Main app (shown after activation)
```

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Build + run in development |
| `npm run build` | TypeScript compile only |
| `npm test` | Build + unit tests for offline verification |
| `npm run package` | Build distributable via electron-builder |
