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

## Current rollout status (30 September 2026)

The Vercel frontend and Worker are reachable. The Worker is in staging with `customerAccessEnabled: false`. The licensing production mapping table has zero rows, so no branch is approved for rollout. The private ERP proxy contract is not implemented. These conditions prevent a verified live customer flow.

## License

See [LICENSE](LICENSE).
