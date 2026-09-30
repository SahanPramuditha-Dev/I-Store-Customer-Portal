# Customer portal API

This folder is the dedicated Cloudflare Worker backend for the customer portal.

## Phase 1: local setup

1. Run `npm install` from this folder.
2. Run `npm run dev`.
3. Open `http://localhost:8787/health`.

The expected response is a JSON health result with an `X-Request-Id` header.

## Phase 2: D1 schema

Create the D1 database, put its id into `wrangler.toml`, then apply the migration:

```powershell
node node_modules\wrangler\bin\wrangler.js d1 create i-store-customer-portal
node node_modules\wrangler\bin\wrangler.js d1 migrations apply i-store-customer-portal --local
```

`migrations/0001_portal_security.sql` stores only portal security and workflow metadata. POS invoice and customer data are intentionally not duplicated into D1.

## Phase 3: POS receipt tokens and QR lookup

The POS calls `POST /internal/receipts` with its `X-POS-API-Key` and customer/receipt data. The Worker returns one opaque token and a URL in the form `/r/<token>` for QR generation. It stores only an HMAC hash of that token.

Set `POS_SHARED_SECRET` and `RECEIPT_TOKEN_SECRET` with `wrangler secret put` before using these endpoints. The public `GET /r/<token>` endpoint returns only the store name, masked number, and verification requirement.

## Phase 4: Turnstile

Create a Turnstile widget in Cloudflare, configure the portal Pages domain and local development host, then set its private secret with:

```powershell
node node_modules\wrangler\bin\wrangler.js secret put TURNSTILE_SECRET_KEY
```

The public site key belongs in the portal frontend only. The private secret remains in the Worker. `services/turnstile.ts` validates the browser token and expected `portal_otp_request` action; Phase 5 calls it before every OTP request.

## Phases 5–16: protected portal API

The Worker now provides OTP, session, bills, warranty, repair, appointment, feedback, audit, and monitoring-ready routes. Set the Worker secrets listed in `wrangler.toml`; no secret belongs in the browser.

The POS must expose a private portal API that accepts the Worker bearer token plus `X-Portal-Customer-Ref` and `X-Portal-Receipt-Id`, and must enforce ownership before returning or changing any record. This makes the POS the source of truth while the Worker owns customer verification and authorization.

Before production, configure the exact Cloudflare Pages origin in `src/index.ts`, apply D1 migrations, create the KV namespace, deploy to a staging Worker, and exercise the failure scenarios in the supplied security brief.

## Retention and production checks

A daily Worker cron removes OTPs and expired/revoked sessions after 30 days and audit logs after 365 days. It never touches POS invoice records.

Use [SECURITY_TEST_PLAN.md](SECURITY_TEST_PLAN.md) for the staging verification run before production deployment.
