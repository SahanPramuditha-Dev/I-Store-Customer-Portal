// Provision missing backend keys without displaying or rotating existing secrets.
// Usage: node --use-system-ca scripts/configure-portal.mjs <POS backend directory>
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { randomBytes } from 'node:crypto';
import { spawnSync } from 'node:child_process';
const backend = resolve(process.argv[2] || '');
if (!existsSync(join(backend,'app/services/cloudflare_portal_sync.py'))) throw new Error('Expected POS backend directory');
const file = resolve('.bridge-private/secrets.env');
const secrets = JSON.parse(readFileSync(file,'utf8'));
const run = args => spawnSync(process.execPath,['--use-system-ca','node_modules/wrangler/bin/wrangler.js',...args],{encoding:'utf8'});
const listed = run(['secret','list']);
if(listed.status !== 0) throw new Error('Could not inspect configured secret names');
const existing = JSON.parse(listed.stdout).map(x=>x.name);
const store = process.argv[3];
if (store && store !== secrets.PC_BRIDGE_STORE_REF) {
  if (!/^[a-z0-9_-]{1,80}$/.test(store)) throw new Error('Invalid store reference');
  const inspected = run(['d1','execute','PORTAL_DB','--remote','--json','--command','SELECT COUNT(*) AS count FROM portal_receipts']);
  if (inspected.status !== 0 || JSON.parse(inspected.stdout)[0].results[0].count !== 0) throw new Error('Cannot change store mapping with existing receipts');
  secrets.PC_BRIDGE_STORE_REF = store;
}
for(const name of ['POS_SHARED_SECRET','RECEIPT_TOKEN_SECRET','OTP_HMAC_SECRET','SESSION_SECRET']) {
  if(!secrets[name]) {
    if(existing.includes(name)) throw new Error(`Restore the existing ${name}; refusing to rotate it`);
    secrets[name]=randomBytes(32).toString('base64url');
  }
}
writeFileSync(file,JSON.stringify(secrets),{mode:0o600});
const result = spawnSync(process.execPath,['--use-system-ca','node_modules/wrangler/bin/wrangler.js','secret','bulk'],{input:JSON.stringify(secrets),encoding:'utf8'});
if(result.status !== 0) throw new Error('Secret upload failed; local keys retained for retry');
const pcFile=join(backend,'.portal-sync.env');
if(!existsSync(pcFile)) writeFileSync(pcFile,`# Enable only after store mapping and real-device test pass.\nCLOUDFLARE_PORTAL_ENABLED=false\nCLOUDFLARE_PORTAL_URL=https://i-store-customer-portal-api.sahan-dev-tech.workers.dev\nCLOUDFLARE_PORTAL_STORE_REF=${secrets.PC_BRIDGE_STORE_REF}\nCLOUDFLARE_POS_API_KEY=${secrets.POS_SHARED_SECRET}\nCLOUDFLARE_RECEIPT_LINK_KEY=${randomBytes(32).toString('base64url')}\n`,{flag:'wx',mode:0o600});
if (store) {
  const config = readFileSync(pcFile,'utf8');
  if (!/^CLOUDFLARE_PORTAL_ENABLED=false$/m.test(config)) throw new Error('Stop active POS sync before changing store mapping');
  writeFileSync(pcFile,config.replace(/^CLOUDFLARE_PORTAL_STORE_REF=.*$/m,`CLOUDFLARE_PORTAL_STORE_REF=${store}`),{mode:0o600});
}
console.log('Backend keys provisioned. POS Cloudflare mode remains disabled pending end-to-end approval.');
