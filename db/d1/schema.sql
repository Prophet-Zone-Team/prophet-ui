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

CREATE TABLE IF NOT EXISTS market_universe_snapshots (
  id TEXT PRIMARY KEY,
  source TEXT NOT NULL,
  provider TEXT NOT NULL,
  market_count INTEGER NOT NULL,
  tracked_market_count INTEGER NOT NULL,
  canonical_team_count INTEGER NOT NULL,
  total_volume REAL NOT NULL,
  volume_24h REAL NOT NULL,
  liquidity REAL NOT NULL,
  missing_team_ids TEXT NOT NULL,
  unmapped_market_titles TEXT NOT NULL,
  captured_at TEXT NOT NULL
) STRICT;

CREATE INDEX IF NOT EXISTS idx_market_universe_snapshots_source_time
ON market_universe_snapshots (source, captured_at);

CREATE TABLE IF NOT EXISTS news_articles (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  source TEXT,
  published_at TEXT,
  language TEXT,
  matched_team_ids TEXT NOT NULL,
  matched_keywords TEXT NOT NULL,
  snippet TEXT,
  collected_at TEXT NOT NULL
) STRICT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_news_articles_url
ON news_articles (url);

CREATE INDEX IF NOT EXISTS idx_news_articles_published
ON news_articles (published_at);

CREATE TABLE IF NOT EXISTS football_team_context (
  team_id TEXT PRIMARY KEY,
  profile_json TEXT NOT NULL,
  fixtures_json TEXT NOT NULL,
  collected_at TEXT NOT NULL
) STRICT;

CREATE INDEX IF NOT EXISTS idx_football_team_context_collected
ON football_team_context (collected_at);

CREATE TABLE IF NOT EXISTS bookmaker_odds (
  id TEXT PRIMARY KEY,
  team_id TEXT NOT NULL,
  bookmaker TEXT NOT NULL,
  decimal_odds REAL NOT NULL,
  implied_probability REAL NOT NULL,
  market_key TEXT,
  odds_updated_at TEXT,
  collected_at TEXT NOT NULL
) STRICT;

CREATE INDEX IF NOT EXISTS idx_bookmaker_odds_team_collected
ON bookmaker_odds (team_id, collected_at);

CREATE TABLE IF NOT EXISTS collection_runs (
  id TEXT PRIMARY KEY,
  source TEXT NOT NULL,
  collected_at TEXT NOT NULL,
  count INTEGER NOT NULL,
  status TEXT NOT NULL,
  errors_json TEXT
) STRICT;

CREATE INDEX IF NOT EXISTS idx_collection_runs_source_time
ON collection_runs (source, collected_at);
