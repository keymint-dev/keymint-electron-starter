import { app, BrowserWindow } from 'electron';
import * as path from 'path';
import './ipc';

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

app.whenReady().then(() => {
  // Always show activation dialog — the renderer checks stored state
  createActivationWindow();
});

app.on('window-all-closed', () => {
  // The activation window opens first; when main closes, quit
  if (mainWindow) {
    mainWindow = null;
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createActivationWindow();
  }
});

export { createMainWindow, createActivationWindow };
