import { ipcMain } from 'electron';
import Store from 'electron-store';
import {
  activateLicense,
  deactivateLicense,
} from './license';

interface LicenseStore {
  licenseKey?: string;
  activated?: boolean;
}

const store = new Store<LicenseStore>({
  name: 'license',
  encryptionKey: 'electron-license-starter',
});

ipcMain.handle('license:activate', async (_event, licenseKey: string) => {
  const result = await activateLicense(licenseKey);
  if (result.success) {
    store.set('licenseKey', licenseKey);
    store.set('activated', true);
  }
  return result;
});

ipcMain.handle('license:getStatus', () => {
  return {
    activated: store.get('activated') === true,
    licenseKey: store.get('licenseKey')
      ? maskKey(store.get('licenseKey')!)
      : null,
  };
});

ipcMain.handle('license:deactivate', async () => {
  const key = store.get('licenseKey');
  if (!key) return { success: false, message: 'No license found' };

  const success = await deactivateLicense(key);
  if (success) {
    store.delete('licenseKey');
    store.delete('activated');
  }
  return { success, message: success ? 'Deactivated' : 'Failed' };
});

function maskKey(key: string): string {
  if (key.length <= 8) return '••••';
  return key.substring(0, 4) + '••••' + key.substring(key.length - 4);
}
