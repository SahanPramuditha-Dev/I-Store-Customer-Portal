ALTER TABLE portal_receipts ADD COLUMN encrypted_phone TEXT;
CREATE TABLE portal_delivery_jobs (
  id TEXT PRIMARY KEY REFERENCES otp_requests(id) ON DELETE CASCADE,
  store_ref TEXT NOT NULL,
  payload TEXT,
  claim_token TEXT,
  claimed_at TEXT,
  completed_at TEXT,
  expires_at TEXT NOT NULL
);
CREATE INDEX delivery_pending ON portal_delivery_jobs(store_ref, claimed_at, expires_at);
