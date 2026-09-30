CREATE TABLE portal_bridge_presence (
  store_ref TEXT PRIMARY KEY,
  ready INTEGER NOT NULL CHECK (ready IN (0, 1)),
  last_seen INTEGER NOT NULL
);
