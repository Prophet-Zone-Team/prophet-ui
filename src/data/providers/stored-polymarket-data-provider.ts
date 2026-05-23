import { WORLD_CUP_TEAM_COUNT, worldCupTeams } from "@/data/teams/world-cup-teams";
import { getAllTeamFootballMetadata } from "@/data/teams/football-metadata";
import { getMarketHistoryRepository } from "@/server/market-history/repository";
import type { StoredMarketDataSource } from "@/server/market-history/types";
import type { MarketSentiment, TeamMarketSnapshot } from "@/types/market";
import type { WorldCupMarketData } from "@/data/providers/types";

const FRESH_AFTER_MS = 15 * 60 * 1000;
const MAX_STORED_AGE_MS = 6 * 60 * 60 * 1000;

export async function getStoredPolymarketWorldCupData(): Promise<WorldCupMarketData | undefined> {
  const source: StoredMarketDataSource = "polymarket";
  const repository = await getMarketHistoryRepository();
  const since = new Date(Date.now() - MAX_STORED_AGE_MS).toISOString();
  const records = await repository.readSnapshots({ source, since });

  if (records.length === 0) {
    return undefined;
  }

  const latestRecords = getLatestCompleteSnapshotBatch(records);

  if (latestRecords.length === 0) {
    return undefined;
  }

  const latestCapturedAt = latestRecords[0]?.capturedAt ?? "";

  const teamsById = new Map(worldCupTeams.map((team) => [team.id, team]));
  const snapshots: TeamMarketSnapshot[] = latestRecords
    .map((record) => {
      const team = teamsById.get(record.teamId);

      if (!team) {
        return undefined;
      }

      return {
        team,
        market: {
          teamId: record.teamId,
          probability: record.probability,
          change24h: record.change24h,
          change7d: record.change7d,
          volume: record.volume,
          sentiment: record.sentiment as MarketSentiment,
          bookmakerImpliedProbability: record.bookmakerImpliedProbability,
          updatedAt: record.marketUpdatedAt,
        },
      };
    })
    .filter(isSnapshot)
    .sort((a, b) => b.market.volume - a.market.volume);

  if (snapshots.length === 0) {
    return undefined;
  }

  const universeRecord = await repository.readLatestUniverseSnapshot(source);
  const stale = Date.now() - new Date(latestCapturedAt).getTime() > FRESH_AFTER_MS;

  return {
    snapshots,
    newsEvents: [],
    probabilityHistory: [],
    footballContext: [],
    footballTeamContext: [],
    footballMetadata: getAllTeamFootballMetadata(),
    universe: universeRecord
      ? {
          provider: universeRecord.provider,
          marketCount: universeRecord.marketCount,
          trackedMarketCount: universeRecord.trackedMarketCount,
          canonicalTeamCount: universeRecord.canonicalTeamCount,
          totalVolume: universeRecord.totalVolume,
          volume24h: universeRecord.volume24h,
          liquidity: universeRecord.liquidity,
          missingTeamIds: universeRecord.missingTeamIds,
          unmappedMarketTitles: universeRecord.unmappedMarketTitles,
        }
      : undefined,
    meta: {
      source,
      status: stale ? "cached" : "live",
      lastUpdated: latestCapturedAt,
      stale,
    },
  };
}

function getLatestCompleteSnapshotBatch<T extends { capturedAt: string; teamId: string }>(records: T[]): T[] {
  const batches = new Map<string, T[]>();

  for (const record of records) {
    const batch = batches.get(record.capturedAt) ?? [];
    batch.push(record);
    batches.set(record.capturedAt, batch);
  }

  return [...batches.entries()]
    .sort(([left], [right]) => right.localeCompare(left))
    .map(([, batch]) => batch)
    .find((batch) => new Set(batch.map((record) => record.teamId)).size >= WORLD_CUP_TEAM_COUNT) ?? [];
}

function isSnapshot(value: TeamMarketSnapshot | undefined): value is TeamMarketSnapshot {
  return Boolean(value);
}
