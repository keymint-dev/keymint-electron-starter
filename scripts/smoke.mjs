// Smoke test: exercises the starter's license helpers (backed by the
// keymint npm SDK) end to end against the test workspace, then cleans up.
// Required env: KEYMINT_TEST_ADMIN_API_KEY, KEYMINT_TEST_CLIENT_API_KEY,
// KEYMINT_TEST_PRODUCT_ID. Skips quietly when absent (PR runs).
import { randomUUID } from 'crypto';

const adminKey = process.env.KEYMINT_TEST_ADMIN_API_KEY;
const clientKey = process.env.KEYMINT_TEST_CLIENT_API_KEY;
const productId = process.env.KEYMINT_TEST_PRODUCT_ID;
const baseUrl = process.env.KEYMINT_TEST_BASE_URL || 'https://api.keymint.dev';

if (!adminKey || !clientKey || !productId) {
  console.log('smoke: credentials not set, skipping');
  process.exit(0);
}

const { KeyMint } = await import('keymint');
const admin = new KeyMint(adminKey, baseUrl);
const runId = randomUUID().replaceAll('-', '');
const hostId = `smoke-electron-${runId}`;
let licenseKey = null;

function assert(cond, label, extra = '') {
  console.log(`${cond ? 'PASS' : 'FAIL'} ${label} ${extra}`);
  if (!cond) process.exitCode = 1;
}

try {
  const created = await admin.createKey({
    productId,
    maxActivations: '2',
    metadata: { purpose: 'electron-starter-smoke', runId },
  });
  licenseKey = created.key;
  assert(!!licenseKey, 'create');

  const client = new KeyMint(clientKey, baseUrl);
  const activation = await client.activateKey({ productId, licenseKey, hostId });
  assert(activation.code === 0, 'activate');

  const health = await client.activateKey({ productId, licenseKey, hostId });
  assert(health.code === 0, 'health re-activation');

  const deactivated = await client.deactivateKey({ productId, licenseKey, hostId });
  assert(deactivated.devicesRemoved === 1, 'deactivate', JSON.stringify(deactivated.devicesRemoved));
} finally {
  if (licenseKey) {
    try {
      await admin.blockKey({ productId, licenseKey });
      console.log('PASS cleanup-block');
    } catch (e) {
      console.log('FAIL cleanup-block', e?.message || e);
      process.exitCode = 1;
    }
  }
}
