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

CREATE TABLE IF NOT EXISTS user_trading_orders (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  wallet_address TEXT NOT NULL,
  funder_address TEXT,
  clob_order_id TEXT,
  status TEXT NOT NULL,
  market_id TEXT,
  token_id TEXT NOT NULL,
  team_id TEXT NOT NULL,
  outcome TEXT NOT NULL,
  side TEXT NOT NULL,
  order_type TEXT NOT NULL,
  limit_price REAL NOT NULL,
  size REAL NOT NULL,
  estimated_cost REAL NOT NULL,
  estimated_total_cost REAL,
  estimated_proceeds REAL,
  potential_outcome REAL NOT NULL,
  preview_json TEXT NOT NULL,
  response_json TEXT,
  submitted_at TEXT,
  updated_at TEXT NOT NULL,
  error TEXT
) STRICT;

CREATE INDEX IF NOT EXISTS idx_user_trading_orders_user_time
ON user_trading_orders (user_id, updated_at);

CREATE INDEX IF NOT EXISTS idx_user_trading_orders_clob
ON user_trading_orders (clob_order_id);

CREATE TABLE IF NOT EXISTS user_trading_audit_events (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  wallet_address TEXT NOT NULL,
  event_type TEXT NOT NULL,
  order_id TEXT,
  clob_order_id TEXT,
  detail_json TEXT,
  created_at TEXT NOT NULL
) STRICT;

CREATE INDEX IF NOT EXISTS idx_user_trading_audit_user_time
ON user_trading_audit_events (user_id, created_at);

CREATE TABLE IF NOT EXISTS user_favourites (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  wallet_address TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  created_at TEXT NOT NULL
) STRICT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_favourites_unique
ON user_favourites (user_id, entity_type, entity_id);

CREATE INDEX IF NOT EXISTS idx_user_favourites_user_time
ON user_favourites (user_id, created_at);
