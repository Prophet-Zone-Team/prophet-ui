# Cloudflare D1 Market History

World Cup Prediction Terminal stores historical market snapshots through the `MarketHistoryRepository`
interface.

## Production Binding

Cloudflare production should bind a D1 database as:

```toml
[[d1_databases]]
binding = "MARKET_HISTORY_DB"
database_name = "world-cup-market-history"
database_id = "<cloudflare-d1-database-id>"
```

This project now includes a real [wrangler.jsonc](/Users/joe/Sites/Polycup/wrangler.jsonc) for Workers deployment.
Before deployment, replace the placeholder `database_id` with the actual D1 database id.

## Current Deployment

Current production custom domain:

```text
https://wc.dolla.market
```

Current Workers fallback URL:

```text
https://world-cup-prediction-terminal.aidai524.workers.dev
```

## Schema

Apply the schema in `db/d1/schema.sql` to the D1 database before enabling collection:

```bash
npx wrangler d1 execute world-cup-market-history --file=db/d1/schema.sql
```

For a real remote D1 database:

```bash
npm run d1:schema:remote
```

## Collection

The write endpoint is:

```text
POST /api/market/snapshots/collect
```

If `source` is omitted or `source=all`, the endpoint collects:

```text
polymarket
kalshi
composite
```

In production it requires:

```text
Authorization: Bearer $MARKET_COLLECTOR_SECRET
```

Recommended schedule: every 15-30 minutes.

Example:

```bash
curl -X POST "https://your-domain.com/api/market/snapshots/collect" \
  -H "Authorization: Bearer $MARKET_COLLECTOR_SECRET"
```

The project also includes a small trigger script:

```bash
MARKET_COLLECTOR_BASE_URL="https://your-domain.com" \
MARKET_COLLECTOR_SECRET="your-secret" \
npm run collect:market
```

For local development:

```bash
npm run collect:market:local
```

For Worker-accurate preview with local D1 initialized:

```bash
npm run preview
```

The preview script clears stale local Worker listeners on `8787/8788`, applies `db/d1/schema.sql` to the local D1 database, and then starts `wrangler dev`.

## Cron Trigger

[wrangler.jsonc](/Users/joe/Sites/Polycup/wrangler.jsonc) includes:

```json
"triggers": {
  "crons": ["*/30 * * * *"]
}
```

The cron is now wired to a native Worker `scheduled` handler in [worker.mjs](/Users/joe/Sites/Polycup/worker.mjs). It calls the same `collectAllMarketSnapshots()` service used elsewhere, so scheduled runs write directly to D1 without going through an HTTP route.

## Local Development

Local development falls back to `.data/market-history.json` when the D1 binding is unavailable.
The `.data/` directory is ignored by git and must not be treated as production storage.

## Required Setup

Install the Cloudflare adapter and Wrangler:

```bash
npm install
```

Generate env typings after the D1 binding is finalized:

```bash
npm run cf-typegen
```
