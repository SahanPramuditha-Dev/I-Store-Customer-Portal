# Security test plan

Run these against staging before production deployment. Every failing request must return a structured error and request ID without customer details.

1. Change one character in a receipt token: `GET /r/<token>` returns `valid: false`.
2. Expire and revoke receipts in D1: both cannot request OTP.
3. Submit no/invalid Turnstile token: OTP request is rejected.
4. Request more than five OTPs per receipt/phone per hour and more than ten per IP per hour: requests are rate limited.
5. Verify a wrong code five times: the OTP is blocked; a used/expired code cannot create a session.
6. Remove, alter, expire, or revoke the session cookie: every `/api/portal/*` route returns `SESSION_EXPIRED`.
7. Request another customer's bill, repair, warranty, or appointment ID: the POS portal API must return no record because the Worker supplies the verified customer reference.
8. Send malformed JSON, SQL-like strings, and XSS strings to every write route: validation fails safely and no unescaped value is rendered by the frontend.
9. Simulate Meta WhatsApp and POS outages: return `DELIVERY_FAILED` or `PORTAL_DATA_UNAVAILABLE` with an `X-Request-Id`.
10. Confirm audit events exist for receipt opens, OTP outcomes, session creation/revocation, and protected resource actions.
