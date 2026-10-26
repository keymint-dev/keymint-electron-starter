// Tests the offline license glue (dist/main/offline.js) with a throwaway
// Ed25519 key, signing .lic files the way the Keymint server does.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash, generateKeyPairSync, sign } from 'node:crypto';
import { createRequire } from 'node:module';

const { checkOfflineLicense } = createRequire(import.meta.url)('../dist/main/offline.js');

const { publicKey, privateKey } = generateKeyPairSync('ed25519');
const config = { publicKey: publicKey.export({ type: 'spki', format: 'pem' }), productId: 'prod_1' };
const kid = createHash('sha256').update(publicKey.export({ type: 'spki', format: 'der' })).digest('base64url');
const now = Math.floor(Date.now() / 1000);

function lic(claims = {}) {
  const enc = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
  const payload = { productId: 'prod_1', machineCode: 'machine-1', type: 'offline', iat: now, exp: now + 86400, sub: 'KM-TEST', ...claims };
  const input = `${enc({ alg: 'EdDSA', kid })}.${enc(payload)}`;
  const signedKey = `${input}.${sign(null, Buffer.from(input), privateKey).toString('base64url')}`;
  return JSON.stringify({ signedDate: new Date().toISOString(), signedKey, keyId: kid });
}

test('accepts a valid file and returns expiry and trusted time', () => {
  const result = checkOfflineLicense(lic(), 'machine-1', 0, config);
  assert.equal(result.ok, true);
  assert.equal(result.license.licenseKey, 'KM-TEST');
  assert.equal(result.license.expiresAt.getTime(), (now + 86400) * 1000);
  assert.ok(result.trustedAt >= now * 1000);
});

test('uses lastTrustedAt when the clock is behind it', () => {
  const later = (now + 2 * 86400) * 1000;
  const result = checkOfflineLicense(lic(), 'machine-1', later, config);
  assert.equal(result.ok, false);
  assert.match(result.message, /expired/);
});

test('explains expired, wrong machine and wrong product', () => {
  assert.match(checkOfflineLicense(lic({ exp: now - 3600 }), 'machine-1', 0, config).message, /expired.*newly signed/);
  assert.match(checkOfflineLicense(lic(), 'machine-2', 0, config).message, /different machine/);
  assert.match(checkOfflineLicense(lic({ productId: 'prod_2' }), 'machine-1', 0, config).message, /different product/);
});

test('rejects tampered or garbage files as invalid', () => {
  const tampered = lic().replace(/"signedKey":"([^.]+)\.([^.]+)/, (_m, h, p) => `"signedKey":"${h}.${p}x`);
  for (const input of [tampered, 'not a license', '{}']) {
    assert.match(checkOfflineLicense(input, 'machine-1', 0, config).message, /not a valid offline license/);
  }
});

test('reports missing or bad configuration', () => {
  assert.match(checkOfflineLicense(lic(), 'machine-1', 0, { publicKey: '', productId: 'prod_1' }).message, /not configured/);
  assert.match(checkOfflineLicense(lic(), 'machine-1', 0, { publicKey: 'nope', productId: 'prod_1' }).message, /misconfigured/);
});
