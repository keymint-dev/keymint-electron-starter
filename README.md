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

## What's Included

- **Activation dialog** — prompts the user for a license key on first launch
- **Machine binding** — locks the license to the device via `node-machine-id`
- **Encrypted storage** — stores license state in `electron-store` with encryption
- **Preload bridge** — secure IPC via `contextBridge` (no `nodeIntegration`)
- **Health checks** — re-validates the license on subsequent launches

## Project Structure

```
src/
├── main/
│   ├── index.ts       # App lifecycle, window management
│   ├── ipc.ts         # IPC handlers (activate, deactivate, getStatus)
│   └── license.ts     # Keymint API calls + machine ID
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
