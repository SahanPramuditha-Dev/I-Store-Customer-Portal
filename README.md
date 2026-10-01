# I-Store Customer Portal

The protected customer bill flow uses a Vercel web frontend and a Cloudflare Worker API. Vercel forwards `/api/*` to the Worker. The Worker stores encrypted bill snapshots and receipt/session metadata in D1, validates the receipt and WhatsApp OTP, and allows authenticated customers to read only their own synced bills.

The older Supabase-backed invoice, warranty, and repair pages remain in this repository for migration. They are not the verified customer flow. Do not rely on their direct lookup paths for production customer access.

## Development and checks

Use Node.js 22 or later. From the repository root:

```bash
npm ci
npm run build:cloud
cd worker
npm ci
npm run check
npm test
```

The Worker can be run locally with `npm run dev` from `worker`. Apply the D1 migrations and provide local secrets first; see [worker/README.md](worker/README.md).

## Production release

1. Merge and deploy the frontend only after CI and its Vercel preview pass. Confirm that `GET /api/config` returns JSON through the assigned production domain. The production domain is `https://i-store-customer-portal-one.vercel.app`.
2. Deploy the Worker with D1 migrations and its store, receipt, OTP, session, delivery, and Turnstile secrets. The D1 bill flow can operate without `POS_API_BASE_URL` and `POS_PORTAL_API_TOKEN`; ERP proxy routes return 503 until both are configured and the private ERP API enforces customer ownership.
3. Verify that the licensing shop maps to the real ERP organization and branch. The mapping must be unique and active. The POS sender and bill outbox must use that exact store reference.
4. Test one receipt → OTP delivery → session → private bill read, then cross-customer denial, expiry, revocation, and offline sender behavior with non-production customer data.
5. Set `PORTAL_ORIGIN` to the browser-facing Vercel origin and enable `PORTAL_ENABLED` only after the preceding checks pass.

`GET /health` exposes `customerAccessEnabled`; HTTP 200 alone does not mean the customer flow is enabled. Keep customer access disabled if the mapping or delivery route is unverified.

## Current rollout status (1 October 2026)

The Vercel frontend and Worker are reachable. The Worker is deployed in staging with `customerAccessEnabled: false` and the correct Vercel origin. The real desktop `IPOINT` tenant database was verified against licensing shop 9 (`IPOINT-KT`); an inactive mapping now identifies organization 1, branch 1, and Worker store `i-store`. The connected Neon database is a separate, empty ERP environment. The desktop has no sales and the WhatsApp bridge remains offline.

The ERP private API and customer service forms now support warranty/repair records, appointment requests and changes, feedback, and requests for repair, warranty claim, or bill resend. Staff review these in the ERP customer portal settings inbox. A saved request is pending review, not proof of a confirmed appointment or WhatsApp delivery. Bill downloads are JSON attachments; browser Print / Save PDF remains available for D1 snapshots.

Before configuring optional services, apply ERP migration `20261001_0023`. Set the same `POS_PORTAL_API_TOKEN` on both sides and an HTTPS `POS_API_BASE_URL` that reaches the receipt-generating ERP database. ERP `CLOUDFLARE_RECEIPT_IDENTITY_KEY` must exactly match Worker `RECEIPT_TOKEN_SECRET`. Store/customer HMAC input uses digits without `+`, and HMAC output is SHA-256 hex. The proxy forwards receipt/store identity from D1, rejects redirects, limits request size/rate, and times out unavailable ERP connections. The service panel stays hidden until the proxy is configured.

Mapping activation, a connected WhatsApp sender, and a real receipt/OTP verification remain required before customer access is enabled.

## License

See [LICENSE](LICENSE).
