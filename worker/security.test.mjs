import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';

function fixture() {
  const db = new DatabaseSync(':memory:');
  db.exec(readFileSync(new URL('./migrations/0001_portal_security.sql', import.meta.url), 'utf8'));
  db.exec(readFileSync(new URL('./migrations/0002_rate_limits.sql', import.meta.url), 'utf8'));
  db.exec(`INSERT INTO portal_receipts (id, receipt_token_hash, customer_ref, phone_hash, invoice_ref, store_ref, store_name, masked_phone, expires_at) VALUES ('r', 'hash', 'c', 'ph', 'i', 's', 'Store', '***42', datetime('now', '+1 day'));
    INSERT INTO otp_requests (id, receipt_id, phone_hash, otp_hash, expires_at, status, ip_hash, user_agent_hash) VALUES ('o', 'r', 'ph', 'oh', datetime('now', '+5 minutes'), 'sent', 'ip', 'ua');`);
  return db;
}
const auth = readFileSync(new URL('./src/routes/auth.ts', import.meta.url), 'utf8');
const queries = [...auth.matchAll(/prepare\("([^"]+)"\)/g)].map(match => match[1]);
const fail = queries.find(query => query.includes('attempt_count = attempt_count + 1'));
const consume = queries.find(query => query.includes("SET status = 'verified'"));

test('five wrong attempts block a code; further attempts cannot change it', () => {
  const db = fixture();
  for (let count = 1; count <= 5; count++) assert.equal(db.prepare(fail).get('o').attempt_count, count);
  assert.equal(db.prepare(fail).get('o'), undefined);
  assert.equal(db.prepare(consume).get('o'), undefined);
  db.close();
});
test('a code can be consumed exactly once after a wrong attempt', () => {
  const db = fixture();
  db.prepare(fail).get('o');
  assert.equal(db.prepare(consume).get('o').id, 'o');
  assert.equal(db.prepare(consume).get('o'), undefined);
  db.close();
});
test('expired codes cannot be consumed', () => {
  const db = fixture();
  db.exec("UPDATE otp_requests SET expires_at = datetime('now', '-1 second')");
  assert.equal(db.prepare(consume).get('o'), undefined);
  db.close();
});
test('rate counter rejects over-limit requests and resets only after expiry', () => {
  const db = fixture();
  const source = readFileSync(new URL('./src/services/rateLimit.ts', import.meta.url), 'utf8');
  const query = source.match(/prepare\(`([\s\S]*?)`\)/)[1];
  const stmt = db.prepare(query);
  for (let count = 1; count <= 5; count++) assert.equal(stmt.get('key', 3700, 100, 100, 100, 5).count, count);
  assert.equal(stmt.get('key', 3701, 101, 101, 101, 5), undefined);
  assert.equal(stmt.get('key', 7400, 3800, 3800, 3800, 5).count, 1);
  db.close();
});
