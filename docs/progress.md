# World Cup Prediction Terminal Progress

Last updated: 2026-05-13

## Priority Status

- Priority 1, Data Provider Architecture:
  completed. Mock, Polymarket, Kalshi, composite source, fallback behavior, D1 history, and unified `getWorldCupMarketData()` are implemented.
- Priority 2, Data Freshness and Source Disclosure:
  completed for the current product surface. Shared data banner, source disclosure, source-preserving links, and status metadata cover market, odds, news, and football context.
- Priority 3, Market Signal System:
  completed v2. Signals cover `heating_up`, `cooling_down`, `volume_spike`, `odds_mismatch`, `sentiment_driven`, `news_impact`, `overheated`, and `quiet_accumulation`.
- Priority 4, Bid Simulator:
  partially complete. The merged bid branch adds a mock/real order console, but the consumer learning simulator still needs price movement simulation and unrealized P/L. Real order mode should remain product-gated because the original project boundary is mock-only.
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
- The Odds API provider implemented:
  `THE_ODDS_API_KEY`, World Cup outright sport-key discovery, bookmaker implied probability summaries, unavailable/empty fallback, and odds status disclosure.
- System health endpoint implemented:
  `GET /api/system/health` reports market snapshot freshness plus news and football cache health.
- CI/Lint baseline implemented:
  `npm run lint`, ESLint flat config, and GitHub Actions workflow running install, lint, typecheck, and build.
- Production deployment exists at:
  [https://wc.dolla.market](https://wc.dolla.market)

## Production Check

Checked on 2026-05-13:

- Remote D1 `market_snapshots` is receiving cron data.
- Latest observed market snapshot timestamps:
  `2026-05-13T03:00Z` for composite, Kalshi, and Polymarket.
- Production `GET /api/system/health` returned `marketSnapshots.status: ok` with latest source age around 15 minutes.
- Production `GET /api/news/events` and `GET /api/football/context` returned 200 after redeploy.
- Remote D1 `news_articles` had 0 rows at the time of check.
- Remote D1 `football_team_context` had 0 rows at the time of check.
- Cloudflare secrets currently list `API_FOOTBALL_KEY` and `MARKET_COLLECTOR_SECRET`; `THE_ODDS_API_KEY` still needs to be added before bookmaker outright odds can go live.

## Pending

### Product Todo

- Configure `THE_ODDS_API_KEY` in Cloudflare and verify whether a World Cup winner outright market is currently open. If it is not open, the app will show odds as empty/unavailable without blocking market data.
- Calibrate `odds_mismatch` once real bookmaker outright odds are flowing.
- Upgrade Bid Simulator into a fuller learning tool:
  current probability, implied share price, estimated shares, max loss, simulated probability, estimated position value, and unrealized P/L.
- Add user-facing alert thresholds per watched team.
- Add persistent or server-side alerts if the product needs reminders outside the browser.
- Add clearer provider coverage notes when Polymarket or Kalshi return fewer World Cup markets.

### Operations Todo

- Redeploy latest `main` after future changes.
- Configure Cloudflare secrets:
  `THE_ODDS_API_KEY`, optional `THE_ODDS_API_WORLD_CUP_SPORT_KEY`, and optional `THE_ODDS_API_REGIONS`.
- Use `GET /api/system/health` after deploy to verify cron freshness without querying D1 manually.
- Add Cloudflare deploy automation if deployments should happen automatically from CI.
- Add cron failure alerts beyond console logging.
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
