# PC WhatsApp delivery bridge

Implementation uses the existing `I Store Website/whatsapp_service/server.js` process.
`install-startup.ps1` registers startup at Windows sign-in for the current user.
It does not pair WhatsApp automatically; a phone QR scan is required.
No inbound ports, tunnel, Meta account, or VPS are required by this bridge.

Worker configuration:
- `PC_BRIDGE_STORE_REF`: exact trusted POS store identifier (single-store deployment).
- `PC_BRIDGE_TOKEN`: random secret of at least 32 characters; separate from POS receipt API key.
- `DELIVERY_ENCRYPTION_KEY`: 32 random bytes encoded as 64 hex characters, stored as a Worker secret.
- Existing receipt, OTP, session, POS authentication and Turnstile secrets remain required.

PC `whatsapp_service/.portal-bridge.env` configuration (never commit actual values):
- `PORTAL_BRIDGE_URL=https://i-store-customer-portal-api.sahan-dev-tech.workers.dev`
- `PORTAL_BRIDGE_TOKEN`: same secret as Worker.

After applying migration 0003, configure both sides, start the existing WhatsApp
service, and pair it using the existing POS QR screen. Polling starts with the
sender and stops with it. When disconnected, it reports offline without claiming jobs.

The cloud stores registered phones and queued code payloads with AES-GCM;
authentication hashes remain separate. Browser input cannot select the recipient.
Claims are atomic and store-scoped. A claimed job is never dispatched again,
including after a crash or ambiguous send. The customer must request a new code
if that delivery is lost. Acknowledgments are retryable and cannot revive expired
codes. Payloads are cleared on acknowledgment; expired payloads are purged daily.
Encryption-key rotation needs re-encryption of retained receipt phone values.

Queued is not delivered: request returns HTTP 202, and verification only accepts
codes acknowledged as sent. No handset delivery guarantee is implied.

## Zero-new-subscription configuration

- Idle polling: 30 seconds, at most 2,880 calls/day before active jobs and retries.
- Connection failures: exponential backoff, up to five minutes.
- Presence writes: at most once per minute while readiness is unchanged.
- OTP cap: 100/store/day, plus existing per-phone/IP/receipt limits.
- Authenticated bill-sync cap: 2,000 calls/store/day, including retries. Oversized
  payloads and permanent validation/identity failures go to the local review queue.
- Invoice copies are encrypted in D1, not uploaded as stored PDFs. PDF saving uses
  the browser print dialog. POS originals are never deleted by cloud cleanup.
- Static UI and API use the same Worker domain, avoiding additional hosting and
  cross-site cookies. Build with `npm run build:cloud` in the portal root before deploy.
- Do not upgrade Cloudflare or enable paid add-ons. The account plan must be
  verified in the dashboard: CLI credentials cannot read subscriptions (403).
- Free-tier exhaustion means temporary service unavailability, not a reason to
  automatically upgrade. Electricity/internet and any existing plans are separate.

## POS integration

`backend/.portal-sync.env` contains the opt-in Cloudflare configuration; it is
ignored by git and loaded by backend app config. `CLOUDFLARE_PORTAL_ENABLED=false`
keeps current POS behavior unchanged until release. The store identifier must
match actual POS settings (this PC's settings resolve to `i-store`).
New checkout events use the existing local outbox with idempotent versioned
uploads. A one-minute background job revisits 50 local invoices (rotating keyset
pages), queues only changed snapshots, and sends at most 10 queued jobs per run.
This covers historical bills, payments, edits, cancellations, partial/full refunds,
and soft deletions without uploading unchanged bills. Larger shops take longer
to complete one pass; changes are not promised to be instantaneous.
`CLOUDFLARE_PORTAL_ORGANIZATION_ID` is required and `CLOUDFLARE_PORTAL_BRANCH_ID`
can optionally narrow the scope. Never guess these values or merge tenants.
Unscoped legacy records and hard-deleted rows are not automatically published.
Phone/customer/invoice identity changes revoke old access, sessions, and queued
OTPs. Permanent cloud deny records prevent delayed uploads restoring access.
Re-issuing a revoked bill requires staff review; it is not an automatic transfer.
The POS print-center A4/thermal pipeline and ModernRetail/BoxedDetailed React
templates now use server-issued receipt links only. QR SVGs are generated locally,
not through a third-party image service. A QR is omitted until reconciliation has
recorded the bill/customer identity and a matching outbox entry exists; it is also
omitted for revoked, changed-identity, unscoped, or dead-letter records. Reprint
after reconciliation if a newly completed sale has no QR yet. These POS source
changes require the updated POS build; physical scanning/printing still needs a
live test after activation.

The cloud build offers receipt-link OTP login, latest 50 customer bills, and print
/ Save PDF. It uses HttpOnly cookies; no customer data or session token is persisted
in browser storage. Legacy Vercel/Supabase routes are not replaced by this deploy.

Before public release: confirm Workers Free plan; configure a real Turnstile
widget for the Worker hostname and action `portal_otp_request`; scan WhatsApp QR;
test one authorized real phone; confirm the live POS database/tenant mapping and
checkout integration; only then enable POS Cloudflare mode and PORTAL_ENABLED.

The sender now reports bridge connectivity to POS status, with an on-screen
warning when the cloud/sender is unavailable. A local watchdog makes up to three
reconnect attempts for a stalled connection, but never resets a QR-pairing state.
The Windows runner restarts only its own crashed child, with bounded backoff.
No cloud monitoring subscription, SMS fallback, or paid notification is configured.
