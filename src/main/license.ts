import { KeyMint } from 'keymint';

const CLIENT_API_KEY = process.env.KEYMINT_CLIENT_API_KEY || '';
const PRODUCT_ID = process.env.KEYMINT_PRODUCT_ID || '';

const client = new KeyMint(CLIENT_API_KEY);

export function getHostId(): string {
  return KeyMint.getOrCreateInstallationId();
}

export async function activateLicense(licenseKey: string): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    const result = await client.activateKey({
      productId: PRODUCT_ID,
      licenseKey,
      hostId: getHostId(),
    });

    if (result.code === 0) {
      return { success: true, message: result.message || 'License valid' };
    }
    return {
      success: false,
      message: result.message || 'Activation failed',
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Network error during activation',
    };
  }
}

export async function deactivateLicense(licenseKey: string): Promise<boolean> {
  try {
    const result = await client.deactivateKey({
      productId: PRODUCT_ID,
      licenseKey,
      hostId: getHostId(),
    });
    return result.code === 0;
  } catch {
    return false;
  }
}

export async function checkLicenseHealth(licenseKey: string): Promise<boolean> {
  try {
    const result = await client.activateKey({
      productId: PRODUCT_ID,
      licenseKey,
      hostId: getHostId(),
    });
    return result.code === 0;
  } catch {
    return false;
  }
}
