# World Cup Prediction Terminal Progress

Last updated: 2026-05-12

## Completed

- Project development rules documented in [AGENTS.md](/Users/joe/Sites/Polycup/AGENTS.md).
- Core market domain types implemented:
  `Team`, `TeamMarketData`, `NewsEvent`, `MarketSignal`, `MockBid`, `UserWatchlistItem`.
- Mock data layer implemented with 24+ teams and analyzer utilities.
- Homepage MVP implemented:
  Hero, Market Heatmap, Top Movers, Biggest Losers, Market Signals.
- Team detail page implemented:
  `/team/[slug]`, 30-day chart surface, market stats, news, mock bid panel, watchlist action.
- Bid page implemented:
  `/bid`, localStorage-backed mock bid flow, payout calculation, explicit mock-only disclaimer.
- Watchlist page implemented:
  `/watchlist`, watchlist list, probability change display, news alerts, removal flow.
- Feed page implemented:
  `/feed`, probability moves, news impact, volume spikes, odds mismatch, sentiment shift cards.
- Homepage terminal polish completed:
  typography refinement, orange heat glow, terminal chrome pass.
- Data provider architecture implemented:
  unified `getWorldCupMarketData()`, `mockDataProvider`, `polymarketDataProvider`, fallback handling, stale/error/loading support.
- Kalshi read-only integration implemented:
  `kalshiDataProvider`, homepage source switch, source-preserving links.
- Composite source implemented:
  `composite`, `polymarket`, `kalshi`, `mock` source model.
- Historical data backend abstraction implemented:
  repository model, collector service, read API, collect API.
- Cloudflare D1 production storage implemented:
  D1 schema, D1 repository, Cloudflare binding resolver, local file fallback for development.
- Cloudflare Workers deployment path implemented with OpenNext:
  [wrangler.jsonc](/Users/joe/Sites/Polycup/wrangler.jsonc), [open-next.config.ts](/Users/joe/Sites/Polycup/open-next.config.ts), [worker.mjs](/Users/joe/Sites/Polycup/worker.mjs).
- Cloudflare D1 database created and wired:
  `world-cup-market-history`, schema applied remotely.
- `MARKET_COLLECTOR_SECRET` configured in Cloudflare Worker secrets.
- Native Worker `scheduled` cron handler implemented and verified locally.
- Production deployment completed:
  [https://wc.dolla.market](https://wc.dolla.market)
- Production history write/read verified:
  authenticated snapshot collection succeeded and `/api/market/history` returned stored composite history.

## Pending

- Replace composite placeholder history depth with real multi-day accumulation from scheduled snapshots over time.
- Add real bookmaker odds provider so `Odds vs Market Probability` is not derived from market data alone.
- Add real news ingestion/provider so related news and feed signals are no longer mostly mock/fallback content.
- Decide whether `workers.dev` should remain disabled permanently or retained for operational fallback.
- Add CI/CD for Cloudflare deploys and schema management.
- Add a real `lint` script and wire it into validation.
- Add production observability for cron failures:
  log tailing, alerts, or failure reporting beyond console logs.
- Decide on backfill strategy for historical data:
  one-time import, scheduled warm-up period, or provider historical endpoint ingestion.
- Add access control guidance for the collect endpoint if more operators will use it.
- Review whether the old [wrangler.toml.example](/Users/joe/Sites/Polycup/wrangler.toml.example) should be removed to avoid configuration drift.

## Active Production

- Primary app URL:
  [https://wc.dolla.market](https://wc.dolla.market)
- Workers URL:
  [https://world-cup-prediction-terminal.aidai524.workers.dev](https://world-cup-prediction-terminal.aidai524.workers.dev)
- Historical storage:
  Cloudflare D1 `world-cup-market-history`
- Snapshot cadence:
  `*/30 * * * *`
