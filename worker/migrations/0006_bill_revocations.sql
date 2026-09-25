-- Permanent deny records prevent delayed/offline uploads reviving old access.
CREATE TABLE portal_bill_revocations (
  store_ref TEXT NOT NULL,
  invoice_ref TEXT NOT NULL,
  source_version INTEGER NOT NULL,
  revoked_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(store_ref, invoice_ref)
);
