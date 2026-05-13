# World Cup Prediction Terminal Progress

Last updated: 2026-05-13 12:05 CST

## Priority Status

- Priority 1, Data Provider Architecture:
  completed. Mock, Polymarket, Kalshi, composite source, fallback behavior, D1 history, and unified `getWorldCupMarketData()` are implemented.
- Priority 2, Data Freshness and Source Disclosure:
  completed for the current product surface. Shared data banner, source disclosure, source-preserving links, and status metadata cover market, odds, news, and football context.
- Priority 3, Market Signal System:
  completed v2. Signals cover `heating_up`, `cooling_down`, `volume_spike`, `odds_mismatch`, `sentiment_driven`, `news_impact`, `overheated`, and `quiet_accumulation`.
- Priority 4, Bid Simulator:
  partially complete. The merged bid branch adds a mock/real order console, and production real order submission is explicitly disabled with `ENABLE_REAL_POLYMARKET_ORDERS=false`. The consumer learning simulator still needs price movement simulation and unrealized P/L. Real order mode should remain product-gated because the original project boundary is mock-only.
- Priority 5, Daily Brief and Watchlist Alerts:
  completed for local/browser scope. `/brief`, Markdown export, and local watchlist alerts are implemented.

## Completed

- Homepage terminal/dashboard implemented with heatmap sorted by probability descending.
- Team detail page implemented with probability chart, market stats, odds comparison, related news, mock bid, watchlist, and API-Football context.
- Feed page implemented from the shared market signal engine.
- Watchlist page implemented with local browser storage.
- Daily Brief page implemented with Markdown export.
- Read-only market providers implemented:
  Polymarket, Kalshi, composite, and mock fallback.
- Historical D1 snapshot system implemented:
  schema, repository, collector, read API, collect API, and OpenNext Worker cron.
- GDELT news collection implemented:
  provider, D1 cache, signal collection route, and news impact mapping.
- API-Football context collection implemented:
  team profile, fixtures, squad, injuries, standings, fixture odds, D1 cache, and rotating collection batches.
- Signal collection run tracking implemented:
  D1 records the last GDELT/API-Football collection status, count, and errors for health checks.
- The Odds API provider implemented:
  `THE_ODDS_API_KEY`, `THE_ODDS_API_WORLD_CUP_SPORT_KEY`, `THE_ODDS_API_REGIONS`, World Cup outright sport-key discovery, bookmaker implied probability summaries, unavailable/empty fallback, and odds status disclosure.
- Cloudflare Worker runtime vars configured:
  `THE_ODDS_API_WORLD_CUP_SPORT_KEY=soccer_fifa_world_cup_winner`, `THE_ODDS_API_REGIONS=us,uk,eu`, and `ENABLE_REAL_POLYMARKET_ORDERS=false`.
- System health endpoint implemented:
  `GET /api/system/health` reports market snapshot freshness plus news and football cache health.
- CI/Lint baseline implemented:
  `npm run lint`, ESLint flat config, and GitHub Actions workflow running install, lint, typecheck, and build.
- Latest local `main` commits have been pushed to GitHub.
- Production deployment exists at:
  [https://wc.dolla.market](https://wc.dolla.market)

## Production Check

Checked on 2026-05-13:

- Remote D1 `market_snapshots` is receiving cron data.
- Latest observed market snapshot timestamps:
  `2026-05-13T04:00Z` to `2026-05-13T04:01Z` for composite, Kalshi, and Polymarket.
- Production `GET /api/system/health` returned `marketSnapshots.status: ok` with latest source age around 3 minutes.
- Production homepage and team detail returned `Live Composite data / 5 bookmaker prices`, confirming The Odds API is configured and serving bookmaker prices.
- Remote D1 `news_articles` still had 0 rows; GDELT collection is returning HTTP 429 and timeout errors and remains the main data issue.
- Remote D1 `football_team_context` is filling; the latest health check showed 17 cached teams and an ok API-Football collection run.
- Cloudflare secrets currently list `API_FOOTBALL_KEY`, `MARKET_COLLECTOR_SECRET`, and `THE_ODDS_API_KEY`.
- Production `GET /api/bid/orders` returned `enabled:false`; real Polymarket order submission is disabled.

## Pending

### Product Todo

- Calibrate `odds_mismatch` once real bookmaker outright odds are flowing.
- Upgrade Bid Simulator into a fuller learning tool:
  current probability, implied share price, estimated shares, max loss, simulated probability, estimated position value, and unrealized P/L.
- Review the merged bid page against product boundaries. Keep real order mode disabled unless the product explicitly moves beyond mock/education.
- Add user-configurable alert thresholds per watched team.
- Add persistent or server-side alerts if the product needs reminders outside the browser.
- Add clearer provider coverage notes when Polymarket or Kalshi return fewer World Cup markets.
- Add stronger empty states for unavailable GDELT/news context while the collector is rate-limited.

### Operations Todo

- Investigate current GDELT collection errors from `GET /api/system/health`; latest errors are HTTP 429 and request aborts.
- Use `GET /api/system/health` after deploy to verify cron freshness without querying D1 manually.
- Add Cloudflare deploy automation if deployments should happen automatically from CI.
- Add cron failure alerts beyond console logging.
- Add health coverage for The Odds API status so odds health is visible without scraping rendered pages.
- Decide whether `workers.dev` should remain disabled or be retained as an operational fallback.
- Decide on a historical backfill strategy beyond scheduled accumulation.
- Review whether [wrangler.toml.example](/Users/joe/Sites/Polycup/wrangler.toml.example) should be removed to avoid configuration drift.

## Active Production

- Primary app URL:
  [https://wc.dolla.market](https://wc.dolla.market)
- Workers fallback URL in docs:
  [https://world-cup-prediction-terminal.aidai524.workers.dev](https://world-cup-prediction-terminal.aidai524.workers.dev)
- Historical storage:
  Cloudflare D1 `world-cup-market-history`
- Snapshot cadence:
  `*/10 * * * *`
