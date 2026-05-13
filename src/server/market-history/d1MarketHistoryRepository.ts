import type {
  D1Database,
  MarketHistoryReadOptions,
  MarketHistoryRepository,
  MarketSnapshotRecord,
} from "./types";

interface MarketSnapshotRow {
  id: string;
  source: string;
  team_id: string;
  probability: number;
  change_24h: number;
  change_7d: number;
  volume: number;
  sentiment: string;
  bookmaker_implied_probability: number;
  market_updated_at: string;
  captured_at: string;
}

interface MarketSnapshotSourceStatRow {
  source: string;
  count: number;
  latest_captured_at: string | null;
}

export function createD1MarketHistoryRepository(database: D1Database): MarketHistoryRepository {
  return {
    async appendSnapshots(records: MarketSnapshotRecord[]): Promise<void> {
      if (records.length === 0) {
        return;
      }

      const statements = records.map((record) =>
        database
          .prepare(
            `INSERT INTO market_snapshots (
              id,
              source,
              team_id,
              probability,
              change_24h,
              change_7d,
              volume,
              sentiment,
              bookmaker_implied_probability,
              market_updated_at,
              captured_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
              probability = excluded.probability,
              change_24h = excluded.change_24h,
              change_7d = excluded.change_7d,
              volume = excluded.volume,
              sentiment = excluded.sentiment,
              bookmaker_implied_probability = excluded.bookmaker_implied_probability,
              market_updated_at = excluded.market_updated_at`,
          )
          .bind(
            record.id,
            record.source,
            record.teamId,
            record.probability,
            record.change24h,
            record.change7d,
            record.volume,
            record.sentiment,
            record.bookmakerImpliedProbability,
            record.marketUpdatedAt,
            record.capturedAt,
          ),
      );

      await database.batch(statements);
    },

    async readSnapshots(options: MarketHistoryReadOptions): Promise<MarketSnapshotRecord[]> {
      const cutoff = getCutoffIso(options.days);
      const bindings: Array<string | number> = [options.source];
      const clauses = ["source = ?"];

      if (options.teamId) {
        clauses.push("team_id = ?");
        bindings.push(options.teamId);
      }

      if (cutoff) {
        clauses.push("captured_at >= ?");
        bindings.push(cutoff);
      }

      const result = await database
        .prepare(
          `SELECT
            id,
            source,
            team_id,
            probability,
            change_24h,
            change_7d,
            volume,
            sentiment,
            bookmaker_implied_probability,
            market_updated_at,
            captured_at
          FROM market_snapshots
          WHERE ${clauses.join(" AND ")}
          ORDER BY captured_at ASC`,
        )
        .bind(...bindings)
        .all<MarketSnapshotRow>();

      return (result.results ?? []).map(mapRowToRecord);
    },

    async readSourceStats() {
      const result = await database
        .prepare(
          `SELECT
            source,
            COUNT(*) AS count,
            MAX(captured_at) AS latest_captured_at
          FROM market_snapshots
          GROUP BY source
          ORDER BY source ASC`,
        )
        .all<MarketSnapshotSourceStatRow>();

      return (result.results ?? []).map((row) => ({
        source: row.source as MarketSnapshotRecord["source"],
        count: row.count,
        latestCapturedAt: row.latest_captured_at ?? undefined,
      }));
    },
  };
}

function getCutoffIso(days: number | undefined): string | undefined {
  if (!days || days <= 0) {
    return undefined;
  }

  const cutoff = new Date();
  cutoff.setUTCDate(cutoff.getUTCDate() - days);
  return cutoff.toISOString();
}

function mapRowToRecord(row: MarketSnapshotRow): MarketSnapshotRecord {
  return {
    id: row.id,
    source: row.source as MarketSnapshotRecord["source"],
    teamId: row.team_id,
    probability: row.probability,
    change24h: row.change_24h,
    change7d: row.change_7d,
    volume: row.volume,
    sentiment: row.sentiment as MarketSnapshotRecord["sentiment"],
    bookmakerImpliedProbability: row.bookmaker_implied_probability,
    marketUpdatedAt: row.market_updated_at,
    capturedAt: row.captured_at,
  };
}
