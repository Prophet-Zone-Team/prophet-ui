# World Cup Prediction Terminal Progress

Last updated: 2026-05-14 00:42 CST

## Priority Status

- Priority 1, Data Provider Architecture:
  completed for the current Polymarket-only product surface. The app now uses a 48-team World Cup registry, hides Kalshi/composite, stores Polymarket team snapshots plus market-universe totals in D1/local history, and prefers fresh stored Polymarket snapshots before falling back to live provider reads.
- Priority 2, Data Freshness and Source Disclosure:
  completed for the current product surface. Shared data banner, source disclosure, source-preserving links, and status metadata cover market, odds, news, and football context.
- Priority 3, Market Signal System:
  completed v2. Signals cover `heating_up`, `cooling_down`, `volume_spike`, `odds_mismatch`, `sentiment_driven`, `news_impact`, `overheated`, and `quiet_accumulation`.
- Priority 4, Embedded User Trading:
  in progress. The product direction has moved to real user-owned Polymarket trading. The legacy `/api/bid/orders` server-wallet path is tombstoned and no longer reads deployment private keys or CLOB credentials. `/bid` is now a single-path user-owned trade ticket with wallet session, automatic Polymarket account/deposit-wallet derivation, account preparation, Polymarket Bridge deposit-address generation, wallet-initiated Polygon USDC deposit, Polymarket geoblock readiness, user L1 auth credential derivation, deposit-wallet approval signing/submission, CLOB balance/allowance sync, order-specific readiness checks, user order signing, final confirmation, open-order reads, and cancellation. The submit endpoint re-validates signed-order ownership, signature type 3, token funding requirements, and balance/allowance before posting to CLOB. Production broad release remains blocked until app-managed relayer credentials for first-time user deposit-wallet deployment/approvals, eligible-wallet validation, durable user session/credential storage, positions, order persistence, audit logging, and production hardening are complete.
- Priority 5, Daily Brief and Watchlist Alerts:
  completed for local/browser scope. `/brief`, Markdown export, and local watchlist alerts are implemented.

## Completed

- Homepage terminal/dashboard implemented with heatmap sorted by probability descending, 48/48 Polymarket World Cup market coverage, total market volume, 24h volume, and liquidity coverage metrics.
- Team detail page implemented with probability chart, market stats, odds comparison, related news, trade-ticket link, watchlist, and API-Football context.
- Feed page implemented from the shared market signal engine.
- Watchlist page implemented with local browser storage.
- Daily Brief page implemented with Markdown export.
- Read-only market providers implemented:
  Polymarket is the active product source. Kalshi/composite implementations remain hidden from the product surface, and mock fallback remains for development/error states.
- Historical D1 snapshot system implemented:
  schema, repository, collector, read API, collect API, OpenNext Worker cron, market-universe snapshots, and DB-first Polymarket page reads.
- GDELT news collection implemented:
  provider, D1 cache, signal collection route, and news impact mapping.
- API-Football context collection implemented:
  team profile, fixtures, squad, injuries, standings, fixture odds, D1 cache, and rotating collection batches.
- Signal collection run tracking implemented:
  D1 records the last GDELT/API-Football collection status, count, and errors for health checks.
- The Odds API provider implemented:
  `THE_ODDS_API_KEY`, `THE_ODDS_API_WORLD_CUP_SPORT_KEY`, `THE_ODDS_API_REGIONS`, World Cup outright sport-key discovery, bookmaker implied probability summaries, unavailable/empty fallback, and odds status disclosure.
- Cloudflare Worker runtime vars configured:
  `THE_ODDS_API_WORLD_CUP_SPORT_KEY=soccer_fifa_world_cup_winner` and `THE_ODDS_API_REGIONS=us,uk,eu`.
- System health endpoint implemented:
  `GET /api/system/health` reports market snapshot freshness plus news and football cache health.
- CI/Lint baseline implemented:
  `npm run lint`, ESLint flat config, and GitHub Actions workflow running install, lint, typecheck, and build.
- Latest local `main` commits have been pushed to GitHub.
- Product positioning updated:
  the trading direction is embedded real user trading through user-owned wallets, not server-wallet execution.
- Embedded user trading MVP implemented:
  legacy `/api/bid/orders` now returns a tombstone status for GET and `410` for POST, the server-wallet order client has been removed, `/api/trading/session`, `/api/trading/deposit`, `/api/trading/credentials`, `/api/trading/eligibility`, `/api/trading/readiness`, `/api/trading/approvals`, `/api/trading/balance-sync`, `/api/trading/orders`, `/api/trading/orders/open`, and `/api/trading/orders/cancel` are implemented, and `/bid` is a Trade Ticket with user-owned wallet/signing/order-management flow only. The visible setup is collapsed into `Prepare account`, which derives user CLOB credentials, generates a Polymarket Bridge deposit address, submits deposit-wallet approvals when needed, and syncs CLOB balance/allowance. The deposit panel now supports a user-confirmed Polygon USDC transfer from the connected wallet to the generated Bridge deposit address, then refreshes readiness after the transaction is observed. Session creation derives the deposit wallet from the connected wallet and can deploy it through the Polymarket relayer only when the configured relayer auth matches the connected wallet or app-managed Builder API credentials are configured. Readiness now checks the current ticket's token, side, cost, and size; submission re-checks signed-order ownership plus balance/allowance before CLOB post.
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
- Production `GET /api/bid/orders` returned `enabled:false`; after the next deploy this route should remain a tombstone while user order actions use `/api/trading/*`.

## Pending

### Product Todo

- Execute the embedded user trading plan in [EMBEDDED_TRADING_PLAN.md](/Users/joezhu/Sites/wc/docs/EMBEDDED_TRADING_PLAN.md).
- Continue hardening the user-owned trading flow:
  app-managed relayer credentials for first-time user setup, eligible-wallet production validation, durable login/session, encrypted or per-session credential handling, submitted order persistence/status, positions, audit logging, and production monitoring.
- Calibrate `odds_mismatch` once real bookmaker outright odds are flowing.
- Add user-configurable alert thresholds per watched team.
- Add persistent or server-side alerts if the product needs reminders outside the browser.
- Add clearer provider coverage notes when Polymarket or Kalshi return fewer World Cup markets.
- Add stronger empty states for unavailable GDELT/news context while the collector is rate-limited.

### Operations Todo

- Investigate current GDELT collection errors from `GET /api/system/health`; latest errors are HTTP 429 and request aborts.
- Choose the production user authentication/wallet stack beyond the current injected-wallet MVP.
- Decide whether user CLOB API credentials remain session-only or become encrypted and stored server-side.
- Validate the Polymarket geoblock flow from deploy regions and document behavior; local smoke test returned `blocked_region` for SG, and submit/cancel now block non-eligible sessions.
- Add secure storage and audit logging design for user-specific trading credentials.
- Use `GET /api/system/health` after deploy to verify cron freshness without querying D1 manually.
- Add Cloudflare deploy automation if deployments should happen automatically from CI.
- Add cron failure alerts beyond console logging.
- Add health coverage for The Odds API status so odds health is visible without scraping rendered pages.
- Decide whether `workers.dev` should remain disabled or be retained as an operational fallback.
- Decide on a historical backfill strategy beyond scheduled accumulation.
- Review whether [wrangler.toml.example](/Users/joezhu/Sites/wc/wrangler.toml.example) should be removed to avoid configuration drift.

## Active Production

- Primary app URL:
  [https://wc.dolla.market](https://wc.dolla.market)
- Workers fallback URL in docs:
  [https://world-cup-prediction-terminal.aidai524.workers.dev](https://world-cup-prediction-terminal.aidai524.workers.dev)
- Historical storage:
  Cloudflare D1 `world-cup-market-history`
- Snapshot cadence:
  `*/10 * * * *`
