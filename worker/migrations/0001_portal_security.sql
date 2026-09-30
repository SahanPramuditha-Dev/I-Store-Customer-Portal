-- Security and portal-workflow data only. The POS remains the source of truth
-- for accounting invoices, customer records, stock, and warranty data.

CREATE TABLE IF NOT EXISTS portal_receipts (
  id TEXT PRIMARY KEY,
  receipt_token_hash TEXT NOT NULL UNIQUE,
  customer_ref TEXT NOT NULL,
  phone_hash TEXT NOT NULL,
  invoice_ref TEXT NOT NULL,
  store_ref TEXT NOT NULL,
  store_name TEXT NOT NULL,
  masked_phone TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at TEXT NOT NULL,
  revoked_at TEXT,
  pos_sync_reference TEXT
);

CREATE INDEX IF NOT EXISTS idx_portal_receipts_customer
  ON portal_receipts (customer_ref, store_ref, expires_at);
CREATE INDEX IF NOT EXISTS idx_portal_receipts_invoice
  ON portal_receipts (invoice_ref, store_ref);

CREATE TABLE IF NOT EXISTS otp_requests (
  id TEXT PRIMARY KEY,
  receipt_id TEXT NOT NULL REFERENCES portal_receipts(id) ON DELETE CASCADE,
  phone_hash TEXT NOT NULL,
  otp_hash TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at TEXT NOT NULL,
  attempt_count INTEGER NOT NULL DEFAULT 0 CHECK (attempt_count >= 0 AND attempt_count <= 5),
  resend_count INTEGER NOT NULL DEFAULT 0 CHECK (resend_count >= 0 AND resend_count <= 3),
  verified_at TEXT,
  status TEXT NOT NULL CHECK (status IN ('pending', 'sent', 'delivered', 'verified', 'expired', 'failed', 'blocked')),
  ip_hash TEXT NOT NULL,
  user_agent_hash TEXT NOT NULL,
  provider_message_id TEXT,
  failure_reason TEXT
);

CREATE INDEX IF NOT EXISTS idx_otp_receipt_active
  ON otp_requests (receipt_id, status, expires_at);
CREATE INDEX IF NOT EXISTS idx_otp_phone_created
  ON otp_requests (phone_hash, created_at);

CREATE TABLE IF NOT EXISTS portal_sessions (
  id TEXT PRIMARY KEY,
  session_token_hash TEXT NOT NULL UNIQUE,
  customer_ref TEXT NOT NULL,
  receipt_id TEXT NOT NULL REFERENCES portal_receipts(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at TEXT NOT NULL,
  last_activity_at TEXT NOT NULL,
  revoked_at TEXT,
  ip_hash TEXT NOT NULL,
  user_agent_hash TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_portal_sessions_token
  ON portal_sessions (session_token_hash, expires_at);
CREATE INDEX IF NOT EXISTS idx_portal_sessions_customer
  ON portal_sessions (customer_ref, expires_at);

CREATE TABLE IF NOT EXISTS portal_audit_logs (
  id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  customer_ref TEXT,
  receipt_id TEXT,
  session_id TEXT,
  ip_hash TEXT,
  user_agent_hash TEXT,
  metadata_json TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (receipt_id) REFERENCES portal_receipts(id) ON DELETE SET NULL,
  FOREIGN KEY (session_id) REFERENCES portal_sessions(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_portal_audit_event_created
  ON portal_audit_logs (event_type, created_at);
CREATE INDEX IF NOT EXISTS idx_portal_audit_receipt_created
  ON portal_audit_logs (receipt_id, created_at);

-- The Worker stores only request-state metadata for portal-created workflows.
-- Full repair, warranty, appointment, and invoice records stay in the POS.
CREATE TABLE IF NOT EXISTS portal_action_links (
  id TEXT PRIMARY KEY,
  action_type TEXT NOT NULL CHECK (action_type IN ('warranty_claim', 'repair', 'appointment', 'feedback')),
  customer_ref TEXT NOT NULL,
  receipt_id TEXT NOT NULL REFERENCES portal_receipts(id) ON DELETE CASCADE,
  pos_reference TEXT,
  status TEXT NOT NULL DEFAULT 'submitted',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_portal_action_links_customer
  ON portal_action_links (customer_ref, action_type, created_at);
