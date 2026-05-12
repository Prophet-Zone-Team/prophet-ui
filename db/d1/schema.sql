CREATE TABLE IF NOT EXISTS market_snapshots (
  id TEXT PRIMARY KEY,
  source TEXT NOT NULL,
  team_id TEXT NOT NULL,
  probability REAL NOT NULL,
  change_24h REAL NOT NULL,
  change_7d REAL NOT NULL,
  volume REAL NOT NULL,
  sentiment TEXT NOT NULL,
  bookmaker_implied_probability REAL NOT NULL,
  market_updated_at TEXT NOT NULL,
  captured_at TEXT NOT NULL
) STRICT;

CREATE INDEX IF NOT EXISTS idx_market_snapshots_lookup
ON market_snapshots (source, team_id, captured_at);

CREATE INDEX IF NOT EXISTS idx_market_snapshots_source_time
ON market_snapshots (source, captured_at);
