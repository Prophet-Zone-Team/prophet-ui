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

## Deploy (OpenNext on Workers)

This app targets **Cloudflare Workers** via [`@opennextjs/cloudflare`](https://opennext.js.org/cloudflare), not Cloudflare Pages with `@cloudflare/next-on-pages`.

Do **not** use the Pages framework preset **Next.js** (`npx @cloudflare/next-on-pages@1`). That adapter is deprecated and requires `export const runtime = 'edge'` on every dynamic route. This project intentionally uses the Next.js **Node.js** runtime (`export const runtime = "nodejs"` on trading APIs) with `nodejs_compat` in `wrangler.jsonc`.

### Workers Builds (Git-connected)

In the Worker **Settings → Build**:

| Setting        | Value                                                                                     |
| -------------- | ----------------------------------------------------------------------------------------- |
| Build command  | `npm run cf:build` (runs `opennextjs-cloudflare build`, which invokes `next build` first) |
| Deploy command | `npm run deploy` (or `opennextjs-cloudflare build && opennextjs-cloudflare deploy`)       |

Copy required env vars from `.env.example` into **Build variables and secrets** and **Variables & secrets** so `next build` and runtime handlers can reach Polymarket, D1, and odds providers.

If the build fails with `JavaScript heap out of memory` or `Ineffective mark-compacts near heap limit`, add this **Build variable**:

```text
NODE_OPTIONS=--max-old-space-size=6144
```

The repo also sets this via `.npmrc` and the `cf:build` script. If memory errors persist, try `8192` locally; on Cloudflare keep headroom below the ~8GB build container cap. `next.config.mjs` enables `experimental.webpackMemoryOptimizations` and limits build CPUs to reduce peak usage.

### Local / CLI

```bash
npm run cf:build    # produce .open-next output only
npm run deploy      # build + wrangler deploy
npm run preview     # build + local worker preview (after d1:schema:local)
```

### If the build log shows next-on-pages / Edge Runtime errors

Example:

```text
The following routes were not configured to run with the Edge Runtime
Please make sure that all your non-static routes export: export const runtime = 'edge';
```

You are on the wrong Cloudflare product or preset. Switch to a **Worker** connected to this repo (or update build settings as above). Do not add `runtime = 'edge'` across the codebase to satisfy next-on-pages; trading and D1 code depend on the Node.js runtime on Workers.

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

The endpoint collects:

```text
polymarket
```

In production it requires:

```text
Authorization: Bearer $MARKET_COLLECTOR_SECRET
```

Recommended schedule: every 10 minutes.

Each market collection run stores:

- normalized team-level market snapshots in `market_snapshots`
- Polymarket World Cup market-universe totals in `market_universe_snapshots`

The product currently hides Kalshi and composite data sources. User-facing pages default to Polymarket and prefer fresh stored snapshots before falling back to live Polymarket provider reads.

Signal data is collected through:

```text
POST /api/signals/collect
```

Supported signal sources:

```text
source=gdelt
source=api-football
source=all
```

The scheduled Worker cron also runs signal collection. It stores:

- GDELT related football coverage in `news_articles`
- API-Football team profile and upcoming fixture context in `football_team_context`
- collection run status, counts, and errors in `collection_runs`

API-Football is collected in small rotating batches to reduce rate-limit pressure. A 10-minute cron will gradually refresh the whole team board instead of hitting every team at once.

Read APIs:

```text
GET /api/news/events?teamId=argentina&days=30&limit=20
GET /api/football/context?teamId=argentina
GET /api/system/health
```

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
  "crons": ["*/10 * * * *"]
}
```

The cron is now wired to a native Worker `scheduled` handler in [worker.mjs](/Users/joe/Sites/Polycup/worker.mjs). It calls the same `collectAllMarketSnapshots()` service used elsewhere, so scheduled runs write directly to D1 without going through an HTTP route.

After deployment, use the health endpoint to confirm the cron is keeping D1 fresh:

```bash
curl "https://wc.dolla.market/api/system/health"
```

The endpoint reports market snapshot freshness, cached GDELT and API-Football row counts, and the latest signal collection errors.

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
