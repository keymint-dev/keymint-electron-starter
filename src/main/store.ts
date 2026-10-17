import Store from 'electron-store';

export interface LicenseStore {
  licenseKey?: string;
  activated?: boolean;
}

export const store = new Store<LicenseStore>({
  name: 'license',
  encryptionKey: 'electron-license-starter',
});

export function clearLicense(): void {
  store.delete('licenseKey');
  store.delete('activated');
}
