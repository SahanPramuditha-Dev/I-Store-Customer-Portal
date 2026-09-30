// Provision only this bridge. Secrets never appear in argv or output.
// Usage: node --use-system-ca scripts/configure-pc-bridge.mjs <sender-directory> <store-ref>
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { randomBytes } from 'node:crypto';
import { spawnSync } from 'node:child_process';
const sender = resolve(process.argv[2] || '');
const store = process.argv[3];
if (!existsSync(join(sender, 'portal-bridge.js')) || !/^[a-z0-9_-]{1,80}$/.test(store || '')) throw new Error('Sender path and store reference required');
const privateDir = resolve('.bridge-private');
mkdirSync(privateDir, { recursive: true });
const configPath = join(privateDir, 'secrets.env');
const pcPath = join(sender, '.portal-bridge.env');
const wrangler = (...args) => spawnSync(process.execPath, ['--use-system-ca', 'node_modules/wrangler/bin/wrangler.js', ...args], { encoding: 'utf8' });
let secrets;
if (existsSync(configPath)) {
  secrets = JSON.parse(readFileSync(configPath, 'utf8'));
  if (secrets.PC_BRIDGE_STORE_REF !== store) throw new Error('Store changed; explicit reprovisioning required');
} else {
  const listing = wrangler('secret', 'list');
  if (listing.status !== 0) throw new Error('Could not check existing Worker secrets');
  const names = JSON.parse(listing.stdout).map(item => item.name);
  if (['PC_BRIDGE_TOKEN', 'DELIVERY_ENCRYPTION_KEY'].some(name => names.includes(name))) throw new Error('Remote bridge already provisioned; restore local configuration rather than rotate it');
  if (existsSync(pcPath)) throw new Error('PC bridge config already exists; do not overwrite');
  secrets = { PC_BRIDGE_TOKEN: randomBytes(32).toString('base64url'), DELIVERY_ENCRYPTION_KEY: randomBytes(32).toString('hex'), PC_BRIDGE_STORE_REF: store };
  writeFileSync(configPath, JSON.stringify(secrets), { flag: 'wx', mode: 0o600 });
}
const upload = spawnSync(process.execPath, ['--use-system-ca', 'node_modules/wrangler/bin/wrangler.js', 'secret', 'bulk'], { input: JSON.stringify(secrets), encoding: 'utf8' });
if (upload.status !== 0) throw new Error('Worker secret upload failed; saved local configuration retained for retry');
const pcConfig = `PORTAL_BRIDGE_URL=https://i-store-customer-portal-api.sahan-dev-tech.workers.dev\nPORTAL_BRIDGE_TOKEN=${secrets.PC_BRIDGE_TOKEN}\n`;
if (existsSync(pcPath) && readFileSync(pcPath, 'utf8') !== pcConfig) throw new Error('PC configuration differs; inspect before replacing');
if (!existsSync(pcPath)) writeFileSync(pcPath, pcConfig, { flag: 'wx', mode: 0o600 });
const response = await fetch('https://i-store-customer-portal-api.sahan-dev-tech.workers.dev/internal/delivery/claim', {
  method: 'POST', headers: { Authorization: `Bearer ${secrets.PC_BRIDGE_TOKEN}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ ready: false }), redirect: 'error', signal: AbortSignal.timeout(15000),
});
console.log(JSON.stringify({ configured: true, store, authenticatedCheckStatus: response.status, customerAccessEnabled: false }));
