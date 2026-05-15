import { worldCupTeams } from "../teams/worldCupTeams";
import { getMarketHistoryRepository } from "../../server/market-history/repository";
import type { StoredMarketDataSource } from "../../server/market-history/types";
import type { MarketSentiment, TeamMarketSnapshot } from "../../types/market";
import type { WorldCupMarketData } from "./types";

const STALE_AFTER_MS = 15 * 60 * 1000;

export async function getStoredPolymarketWorldCupData(): Promise<WorldCupMarketData | undefined> {
  const source: StoredMarketDataSource = "polymarket";
  const repository = await getMarketHistoryRepository();
  const since = new Date(Date.now() - STALE_AFTER_MS).toISOString();
  const records = await repository.readSnapshots({ source, since });

  if (records.length === 0) {
    return undefined;
  }

  const latestCapturedAt = records.reduce((latest, record) => {
    return record.capturedAt > latest ? record.capturedAt : latest;
  }, records[0]?.capturedAt ?? "");
  const latestRecords = records.filter((record) => record.capturedAt === latestCapturedAt);

  if (latestRecords.length === 0) {
    return undefined;
  }

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
  const stale = Date.now() - new Date(latestCapturedAt).getTime() > STALE_AFTER_MS;

  return {
    snapshots,
    newsEvents: [],
    probabilityHistory: [],
    footballContext: [],
    footballTeamContext: [],
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

function isSnapshot(value: TeamMarketSnapshot | undefined): value is TeamMarketSnapshot {
  return Boolean(value);
}
