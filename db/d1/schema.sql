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
