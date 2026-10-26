import { verifyOfflineLicense, OfflineLicenseError, OfflineLicense } from 'keymint';

// PEM from Developer → Public Keys. In .env, use a quoted multi-line value or
// write the line breaks as \n.
const PUBLIC_KEY = (process.env.KEYMINT_PUBLIC_KEY || '').replace(/\\n/g, '\n').trim();
const PRODUCT_ID = process.env.KEYMINT_PRODUCT_ID || '';

export const MAX_LICENSE_FILE_LENGTH = 64 * 1024;

export type OfflineCheck =
  | { ok: true; license: OfflineLicense; trustedAt: number }
  | { ok: false; message: string };

const MESSAGES: Partial<Record<OfflineLicenseError['code'], string>> = {
  expired: 'This offline license has expired. Get a newly signed .lic file from the vendor while online.',
  wrong_machine: 'This offline license was issued for a different machine.',
  wrong_product: 'This offline license is for a different product.',
};

/**
 * Verifies a .lic file for this product and machine. Checks expiry against
 * max(system time, lastTrustedAt) so setting the clock back doesn't revive an
 * expired file; the returned trustedAt is the new value to store.
 */
export function checkOfflineLicense(
  contents: string,
  machineCode: string,
  lastTrustedAt = 0,
  config = { publicKey: PUBLIC_KEY, productId: PRODUCT_ID },
): OfflineCheck {
  if (!config.publicKey || !config.productId) {
    return { ok: false, message: 'Offline licenses are not configured: set KEYMINT_PUBLIC_KEY and KEYMINT_PRODUCT_ID in .env' };
  }
  const trustedAt = Math.max(Date.now(), lastTrustedAt);
  try {
    const license = verifyOfflineLicense(contents, {
      publicKeys: [config.publicKey],
      productId: config.productId,
      machineCode,
      now: new Date(trustedAt),
    });
    return { ok: true, license, trustedAt };
  } catch (error) {
    if (error instanceof OfflineLicenseError) {
      return { ok: false, message: MESSAGES[error.code] ?? 'This is not a valid offline license file for this app.' };
    }
    // Bad options, e.g. KEYMINT_PUBLIC_KEY isn't an Ed25519 public key PEM.
    return { ok: false, message: `Offline licenses are misconfigured: ${(error as Error).message}` };
  }
}
