import { KeyMint } from 'keymint';

const CLIENT_API_KEY = process.env.KEYMINT_CLIENT_API_KEY || '';
const PRODUCT_ID = process.env.KEYMINT_PRODUCT_ID || '';
// Optional; defaults to https://api.keymint.dev.
const BASE_URL = process.env.KEYMINT_BASE_URL || undefined;

const CONFIG_ERROR =
  'Keymint is not configured: set KEYMINT_CLIENT_API_KEY and KEYMINT_PRODUCT_ID in .env';

// Created on first use so a missing key shows a message instead of
// crashing the app at startup (the SDK constructor throws on an empty key).
let client: KeyMint | null = null;
function getClient(): KeyMint | null {
  if (!CLIENT_API_KEY || !PRODUCT_ID) return null;
  client ??= new KeyMint(CLIENT_API_KEY, BASE_URL);
  return client;
}

export function getHostId(): string {
  return KeyMint.getOrCreateInstallationId();
}

/**
 * The SDK throws on any non-2xx response. 401 (invalid, expired, blocked or
 * not allowed on this device), 402 (vendor subscription lapsed), 403
 * (activation limit reached) and 404 (product deleted or deactivated, or the
 * license removed) mean the license was rejected. Anything else — no
 * response, 429, 5xx — is transient and must not log the user out.
 */
function isRejected(error: unknown): boolean {
  const status = (error as { status?: number } | null)?.status;
  return status === 401 || status === 402 || status === 403 || status === 404;
}

function errorMessage(error: unknown, fallback: string): string {
  const message = (error as { message?: string } | null)?.message;
  return message || fallback;
}

export async function activateLicense(licenseKey: string): Promise<{
  success: boolean;
  message: string;
}> {
  const sdk = getClient();
  if (!sdk) return { success: false, message: CONFIG_ERROR };

  try {
    const result = await sdk.activateKey({
      productId: PRODUCT_ID,
      licenseKey,
      hostId: getHostId(),
    });
    return { success: true, message: result.message || 'License valid' };
  } catch (error) {
    return {
      success: false,
      message: isRejected(error)
        ? errorMessage(error, 'License rejected')
        : 'Could not reach the licensing server. Check your connection and try again.',
    };
  }
}

export async function deactivateLicense(licenseKey: string): Promise<boolean> {
  const sdk = getClient();
  if (!sdk) return false;

  try {
    await sdk.deactivateKey({
      productId: PRODUCT_ID,
      licenseKey,
      hostId: getHostId(),
    });
    return true;
  } catch {
    return false;
  }
}

export type LicenseHealth = 'valid' | 'rejected' | 'unknown';

/**
 * Re-validates a stored license. Re-activating on the same device does not
 * use another seat. Returns 'unknown' when the server can't be reached, so
 * callers keep the cached state instead of locking the user out offline.
 */
export async function checkLicenseHealth(licenseKey: string): Promise<LicenseHealth> {
  const sdk = getClient();
  if (!sdk) return 'unknown';

  try {
    await sdk.activateKey({
      productId: PRODUCT_ID,
      licenseKey,
      hostId: getHostId(),
    });
    return 'valid';
  } catch (error) {
    return isRejected(error) ? 'rejected' : 'unknown';
  }
}
