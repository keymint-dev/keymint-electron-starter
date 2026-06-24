import { machineIdSync } from 'node-machine-id';

const API_BASE = 'https://api.keymint.dev';
const CLIENT_API_KEY = process.env.KEYMINT_CLIENT_API_KEY || '';
const PRODUCT_ID = process.env.KEYMINT_PRODUCT_ID || '';

export function getHostId(): string {
  return machineIdSync();
}

export async function activateLicense(licenseKey: string): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    const response = await fetch(`${API_BASE}/key/activate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CLIENT_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        productId: PRODUCT_ID,
        licenseKey,
        hostId: getHostId(),
      }),
    });

    const result = await response.json();

    if (response.ok && result.code === 0) {
      return { success: true, message: result.message || 'License valid' };
    }
    return {
      success: false,
      message: result.message || `Activation failed (HTTP ${response.status})`,
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
    const response = await fetch(`${API_BASE}/key/deactivate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CLIENT_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        productId: PRODUCT_ID,
        licenseKey,
        hostId: getHostId(),
      }),
    });

    const result = await response.json();
    return response.ok && result.code === 0;
  } catch {
    return false;
  }
}

export async function checkLicenseHealth(licenseKey: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/key/activate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CLIENT_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        productId: PRODUCT_ID,
        licenseKey,
        hostId: getHostId(),
      }),
    });

    const result = await response.json();
    return response.ok && result.code === 0;
  } catch {
    return false;
  }
}
