CREATE TABLE portal_bills (
  receipt_id TEXT PRIMARY KEY REFERENCES portal_receipts(id) ON DELETE CASCADE,
  store_ref TEXT NOT NULL,
  customer_ref TEXT NOT NULL,
  invoice_ref TEXT NOT NULL,
  source_version INTEGER NOT NULL,
  encrypted_data TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(store_ref, invoice_ref)
);
CREATE INDEX portal_bills_customer ON portal_bills(store_ref, customer_ref, updated_at DESC);
