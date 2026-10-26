import { ipcMain } from 'electron';
import {
  activateLicense,
  deactivateLicense,
  getHostId,
} from './license';
import { checkOfflineLicense, MAX_LICENSE_FILE_LENGTH, OfflineCheck } from './offline';
import { store, clearLicense, clearOfflineLicense } from './store';
import { licenseEvents } from './events';

/** Re-verifies the stored .lic file, if any, and advances lastTrustedAt. */
export function verifyStoredOffline(): OfflineCheck | null {
  const contents = store.get('offlineLicense');
  if (!contents) return null;
  const result = checkOfflineLicense(contents, getHostId(), store.get('lastTrustedAt'));
  if (result.ok) store.set('lastTrustedAt', result.trustedAt);
  return result;
}

ipcMain.handle('license:activate', async (_event, licenseKey: string) => {
  const result = await activateLicense(licenseKey);
  if (result.success) {
    store.set('licenseKey', licenseKey);
    store.set('activated', true);
    licenseEvents.emit('activated');
  }
  return result;
});

ipcMain.handle('license:importOffline', (_event, contents: unknown) => {
  if (typeof contents !== 'string' || contents.length > MAX_LICENSE_FILE_LENGTH) {
    return { success: false, message: 'This is not a valid offline license file for this app.' };
  }
  const result = checkOfflineLicense(contents, getHostId(), store.get('lastTrustedAt'));
  if (!result.ok) return { success: false, message: result.message };

  store.set('offlineLicense', contents);
  store.set('lastTrustedAt', result.trustedAt);
  licenseEvents.emit('activated');
  return {
    success: true,
    message: `Offline license valid until ${result.license.expiresAt.toLocaleDateString()}`,
  };
});

ipcMain.handle('license:getStatus', () => {
  if (store.get('activated') !== true) {
    const offline = verifyStoredOffline();
    if (offline?.ok) {
      return {
        activated: true,
        mode: 'offline',
        licenseKey: maskKey(offline.license.licenseKey),
        expiresAt: offline.license.expiresAt.toISOString(),
      };
    }
    if (offline) return { activated: false, licenseKey: null, offlineError: offline.message };
  }
  return {
    activated: store.get('activated') === true,
    mode: 'online',
    licenseKey: store.get('licenseKey')
      ? maskKey(store.get('licenseKey')!)
      : null,
  };
});

ipcMain.handle('license:deactivate', async () => {
  const key = store.get('licenseKey');
  if (!key) {
    // Offline licenses aren't tracked by the server; just forget the file.
    if (!store.get('offlineLicense')) return { success: false, message: 'No license found' };
    clearOfflineLicense();
    return { success: true, message: 'Offline license removed' };
  }

  const success = await deactivateLicense(key);
  if (success) clearLicense();
  return { success, message: success ? 'Deactivated' : 'Failed' };
});

function maskKey(key: string): string {
  if (key.length <= 8) return '••••';
  return key.substring(0, 4) + '••••' + key.substring(key.length - 4);
}
