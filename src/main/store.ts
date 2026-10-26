import Store from 'electron-store';

export interface LicenseStore {
  licenseKey?: string;
  activated?: boolean;
  /** Contents of an imported .lic file. */
  offlineLicense?: string;
  /** Latest time (ms) a license check trusted; guards offline expiry against clock rollback. */
  lastTrustedAt?: number;
}

export const store = new Store<LicenseStore>({
  name: 'license',
  encryptionKey: 'electron-license-starter',
});

export function clearLicense(): void {
  store.delete('licenseKey');
  store.delete('activated');
}

// Keeps lastTrustedAt, so re-importing an old file can't use a rolled-back clock.
export function clearOfflineLicense(): void {
  store.delete('offlineLicense');
}
