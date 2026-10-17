// Load .env before anything reads process.env (license.ts reads it on import).
import 'dotenv/config';
import { app, BrowserWindow } from 'electron';
import * as path from 'path';
import './ipc';
import { checkLicenseHealth } from './license';
import { store, clearLicense } from './store';
import { licenseEvents } from './events';

const HEALTH_CHECK_INTERVAL_MS = 24 * 60 * 60 * 1000;

let mainWindow: BrowserWindow | null = null;
let activationWindow: BrowserWindow | null = null;

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  mainWindow.loadFile(path.join(__dirname, '../renderer/app.html'));
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function createActivationWindow() {
  activationWindow = new BrowserWindow({
    width: 480,
    height: 360,
    resizable: false,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  activationWindow.loadFile(path.join(__dirname, '../renderer/activation.html'));

  activationWindow.on('closed', () => {
    activationWindow = null;
  });
}

// Open the app before the activation dialog closes itself, so closing the
// dialog never leaves zero windows (which quits the app on Windows/Linux).
licenseEvents.on('activated', () => {
  if (!mainWindow) createMainWindow();
});

// A rejected license (revoked, expired, over its device limit) sends the user
// back to activation. Network failures keep the cached state.
async function revalidate(): Promise<boolean> {
  const licenseKey = store.get('licenseKey');
  if (!licenseKey || store.get('activated') !== true) return false;

  if ((await checkLicenseHealth(licenseKey)) === 'rejected') {
    clearLicense();
    return false;
  }
  return true;
}

app.whenReady().then(async () => {
  if (await revalidate()) {
    createMainWindow();
  } else {
    createActivationWindow();
  }

  setInterval(async () => {
    if (!(await revalidate()) && mainWindow) {
      mainWindow.close();
      createActivationWindow();
    }
  }, HEALTH_CHECK_INTERVAL_MS);
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    if (store.get('activated') === true) {
      createMainWindow();
    } else {
      createActivationWindow();
    }
  }
});

export { createMainWindow, createActivationWindow };
