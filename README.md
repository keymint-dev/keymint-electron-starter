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

`.env` is loaded with `dotenv` when the app starts. If the variables are missing, the activation dialog says so instead of the app crashing.

## What's Included

- **Activation dialog** — prompts the user for a license key on first launch
- **Machine binding** — locks the license to a stable installation ID from `KeyMint.getOrCreateInstallationId()`
- **Encrypted storage** — stores license state in `electron-store` with encryption
- **Preload bridge** — secure IPC via `contextBridge` (no `nodeIntegration`)
- **Health checks** — re-validates the license on launch and every 24 hours. A rejected license (revoked, expired, over its device limit) returns the user to activation; if the server can't be reached, the app keeps working with the cached state

## Project Structure

```
src/
├── main/
│   ├── index.ts       # App lifecycle, window management
│   ├── ipc.ts         # IPC handlers (activate, deactivate, getStatus)
│   ├── license.ts     # Keymint API calls, health check, machine ID
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
| `npm run package` | Build distributable via electron-builder |
