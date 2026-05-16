# World Cup Prediction Terminal Progress

Last updated: 2026-05-16 10:07 CST

## Priority Status

- Priority 1, Data Provider Architecture:
  completed for the current Polymarket-only product surface. The app now uses a 48-team World Cup registry, hides Kalshi/composite from the user-facing UI, stores Polymarket team snapshots plus market-universe totals in D1/local history, and prefers fresh stored Polymarket snapshots before falling back to live provider reads. Remaining cleanup: `GET /api/system/health` still includes stale historical Kalshi/composite rows and should filter health to enabled sources.
- Priority 2, Data Freshness and Source Disclosure:
  mostly completed for the current product surface. Shared data banner, source disclosure, source-preserving links, and status metadata cover market, odds, news, and football context. Remaining work: health should report The Odds API status explicitly, and GDELT/news empty or rate-limited states need clearer product copy.
- Priority 3, Market Signal System:
  completed v2. Signals cover `heating_up`, `cooling_down`, `volume_spike`, `odds_mismatch`, `sentiment_driven`, `news_impact`, `overheated`, and `quiet_accumulation`.
- Priority 4, Embedded User Trading:
  in progress. The product direction has moved to real user-owned Polymarket trading. The legacy `/api/bid/orders` server-wallet path is tombstoned and no longer reads deployment private keys or CLOB credentials. `/bid` is now a single-path user-owned trade ticket with wallet session, automatic Polymarket account/deposit-wallet derivation, account preparation, Polymarket Bridge deposit-address generation, wallet-initiated Polygon USDC deposit, Polymarket geoblock readiness, user L1 auth credential derivation, deposit-wallet approval signing/submission, CLOB balance/allowance sync, order-specific readiness checks, user order signing, final confirmation, open-order reads, and cancellation. The submit endpoint re-validates signed-order ownership, signature type 3, token funding requirements, and balance/allowance before posting to CLOB. Production broad release remains blocked until durable user session/credential handling, submitted order persistence, positions, audit logging, multi-wallet QA, production geoblock validation, and a documented small-order production regression test are complete.
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
  schema, repository, collector, read API, collect API, OpenNext Worker cron, market-universe snapshots, and DB-first Polymarket page reads. Remote D1 schema is applied in production.
- GDELT news collection implemented:
  provider, D1 cache, signal collection route, news impact mapping, and lower-volume rotating batch collection. Production is still rate-limited by GDELT HTTP 429.
- API-Football context collection implemented:
  team profile, fixtures, squad, injuries, standings, fixture odds, D1 cache, rotating collection batches, and quota/error surfacing in health. Production collection is currently one team per 10-minute cron to avoid exhausting request limits too quickly.
- Signal collection run tracking implemented:
  D1 records the last GDELT/API-Football collection status, count, and errors for health checks.
- The Odds API provider implemented:
  `THE_ODDS_API_KEY`, `THE_ODDS_API_WORLD_CUP_SPORT_KEY`, `THE_ODDS_API_REGIONS`, World Cup outright sport-key discovery, bookmaker implied probability summaries, unavailable/empty fallback, and odds status disclosure.
- Cloudflare Worker runtime vars configured:
  `THE_ODDS_API_WORLD_CUP_SPORT_KEY=soccer_fifa_world_cup_winner` and `THE_ODDS_API_REGIONS=us,uk,eu`.
- System health endpoint implemented:
  `GET /api/system/health` reports market snapshot freshness, Polymarket market-universe freshness, news cache health, and football cache health. Remaining cleanup: market snapshot health should only include enabled Polymarket sources, not stale hidden Kalshi/composite snapshots.
- CI/Lint baseline implemented:
  `npm run lint`, ESLint flat config, and GitHub Actions workflow running install, lint, typecheck, and build.
- Latest local `main` commits have been pushed to GitHub.
- Product positioning updated:
  the trading direction is embedded real user trading through user-owned wallets, not server-wallet execution.
- Embedded user trading MVP implemented:
  legacy `/api/bid/orders` now returns a tombstone status for GET and `410` for POST, the server-wallet order client has been removed, `/api/trading/session`, `/api/trading/deposit`, `/api/trading/credentials`, `/api/trading/eligibility`, `/api/trading/readiness`, `/api/trading/approvals`, `/api/trading/balance-sync`, `/api/trading/orders`, `/api/trading/orders/open`, and `/api/trading/orders/cancel` are implemented, and `/bid` is a Trade Ticket with user-owned wallet/signing/order-management flow only. The visible setup is collapsed into `Prepare account`, which derives user CLOB credentials, generates a Polymarket Bridge deposit address, submits deposit-wallet approvals when needed, and syncs CLOB balance/allowance. The deposit panel now supports a user-confirmed Polygon USDC transfer from the connected wallet to the generated Bridge deposit address, then refreshes readiness after the transaction is observed. Session creation derives the deposit wallet from the connected wallet and can deploy it through the Polymarket relayer only when the configured relayer auth matches the connected wallet or app-managed Builder API credentials are configured. Readiness now checks the current ticket's token, side, cost, and size; submission re-checks signed-order ownership plus balance/allowance before CLOB post.
- Production deployment exists at:
  [https://wc.dolla.market](https://wc.dolla.market)
- Production Cloudflare deployment updated on 2026-05-15:
  remote D1 schema applied, trading-related Worker secrets configured, scheduled Worker env propagation fixed, GDELT request volume reduced, API-Football quota errors surfaced, and latest `main` pushed to GitHub.

## Production Check

Checked on 2026-05-16 10:07 CST:

- Remote D1 `market_snapshots` is receiving fresh Polymarket cron data.
- Production `GET /api/market/universe` returned `status: ok`, `marketCount: 48`, `trackedMarketCount: 48`, `missingTeamIds: 0`, and `unmappedMarketTitles: 0`.
- Latest observed Polymarket universe snapshot:
  `2026-05-16T02:00:53.623Z`, age around 6 minutes at check time.
- Production Polymarket universe totals at check time:
  total volume about `983.95M`, 24h volume about `10.46M`, liquidity about `233.71M`.
- Production homepage includes `48 / 48` and hides Kalshi/composite from the user-facing surface.
- Production `GET /api/system/health` currently reports `marketSnapshots.status: stale` only because hidden stale `composite` and `kalshi` rows remain in health calculations. Polymarket itself is fresh and `marketUniverse.status` is `ok`.
- GDELT remains the main live data issue:
  latest news cache was last updated at `2026-05-15T09:40:45.425Z`, and the latest run returned two HTTP 429 errors.
- API-Football cron is running again:
  latest run at `2026-05-16T02:01:10.228Z` returned `count: 1`, `status: ok`. Cached football context currently covers 24 teams, not all 48.
- API-Football dimensions such as squads, injuries, standings, and odds are implemented but constrained by plan limits, season availability, fixture availability, and daily request quota.
- Production trading config endpoint can read Builder configuration. Real user-owned trading MVP is deployed, but broad production release still needs the hardening tasks listed below.

## Pending

### Product Todo

- Continue hardening the user-owned trading flow:
  durable login/session, encrypted or per-session credential handling, submitted order persistence/status, positions, audit logging, production monitoring, multi-wallet QA, and documented small-order production regression tests.
- Add an order history and positions view backed by persisted user-owned order state, including cancel/status refresh paths.
- Validate the production geoblock and eligibility flow from allowed and blocked regions.
- Calibrate `odds_mismatch` once real bookmaker outright odds are flowing.
- Add user-configurable alert thresholds per watched team.
- Add persistent or server-side alerts if the product needs reminders outside the browser.
- Add clearer provider coverage notes when Polymarket, GDELT, API-Football, or The Odds API data is limited, stale, or unavailable.
- Add stronger empty states for unavailable GDELT/news context while the collector is rate-limited.

### Operations Todo

- Fix `GET /api/system/health` so market snapshot health only evaluates enabled sources. Hidden stale Kalshi/composite rows should not make the product health stale.
- Continue GDELT mitigation:
  reduce request frequency further, add exponential backoff/circuit breaking after 429, cache successful batches longer, and evaluate a backup news provider if GDELT remains unreliable.
- Continue API-Football coverage work:
  let the one-team-per-cron collector fill all 48 teams, add a coverage report by team/dimension, and decide whether the current API-Football plan is sufficient for squads, injuries, standings, and odds.
- Choose the production user authentication/wallet stack beyond the current injected-wallet MVP.
- Decide whether user CLOB API credentials remain session-only or become encrypted and stored server-side.
- Add secure storage and audit logging design for user-specific trading credentials.
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
