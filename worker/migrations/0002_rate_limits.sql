CREATE TABLE portal_rate_limits (
  key TEXT PRIMARY KEY,
  count INTEGER NOT NULL CHECK (count > 0),
  expires_at INTEGER NOT NULL
);
CREATE INDEX idx_rate_limits_expiry ON portal_rate_limits(expires_at);
