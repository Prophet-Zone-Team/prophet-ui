import { WORLD_CUP_TEAM_COUNT } from "../../data/teams/world-cup-teams";
import { getWorldCupMarketData } from "../../data/providers/world-cup-market-data";
import type { MarketDataSource } from "../../data/providers/types";
import { getMarketHistoryRepository } from "./repository";
import type { MarketSnapshotRecord, StoredMarketDataSource } from "./types";

const COLLECTABLE_SOURCES: StoredMarketDataSource[] = ["polymarket"];

export interface MarketSnapshotCollectionResult {
  source: StoredMarketDataSource;
  capturedAt: string;
  count: number;
  universe?: {
    marketCount: number;
    trackedMarketCount: number;
    canonicalTeamCount: number;
    totalVolume: number;
    volume24h: number;
    liquidity: number;
    missingTeamCount: number;
  };
}

export async function collectMarketSnapshots(source: MarketDataSource): Promise<MarketSnapshotCollectionResult> {
  if (source === "mock") {
    throw new Error("Mock data is not collected into market history.");
  }

  const data = await getWorldCupMarketData({
    source,
    includeFootballContext: false,
    includeHistory: false,
    includeNews: false,
    preferStored: false,
  });

  if (data.meta.source === "mock") {
    throw new Error("Fallback mock data is not collected into market history.");
  }

  assertCompletePolymarketCoverage(data);

  const capturedAt = new Date().toISOString();
  const historySource = data.meta.source as StoredMarketDataSource;
  const records: MarketSnapshotRecord[] = data.snapshots.map((snapshot) => ({
    id: `${historySource}:${snapshot.team.id}:${capturedAt}`,
    source: historySource,
    teamId: snapshot.team.id,
    probability: snapshot.market.probability,
    change24h: snapshot.market.change24h,
    change7d: snapshot.market.change7d,
    volume: snapshot.market.volume,
    sentiment: snapshot.market.sentiment,
    bookmakerImpliedProbability: snapshot.market.bookmakerImpliedProbability,
    marketUpdatedAt: snapshot.market.updatedAt,
    capturedAt,
  }));

  const repository = await getMarketHistoryRepository();
  await repository.appendSnapshots(records);

  if (data.universe) {
    await repository.appendUniverseSnapshot({
      id: `${historySource}:${capturedAt}`,
      source: historySource,
      capturedAt,
      ...data.universe,
    });
  }

  return {
    source: historySource,
    capturedAt,
    count: records.length,
    universe: data.universe
      ? {
          marketCount: data.universe.marketCount,
          trackedMarketCount: data.universe.trackedMarketCount,
          canonicalTeamCount: data.universe.canonicalTeamCount,
          totalVolume: data.universe.totalVolume,
          volume24h: data.universe.volume24h,
          liquidity: data.universe.liquidity,
          missingTeamCount: data.universe.missingTeamIds.length,
        }
      : undefined,
  };
}

function assertCompletePolymarketCoverage(data: Awaited<ReturnType<typeof getWorldCupMarketData>>): void {
  if (data.meta.source !== "polymarket") {
    return;
  }

  const uniqueTeamCount = new Set(data.snapshots.map((snapshot) => snapshot.team.id)).size;

  if (uniqueTeamCount < WORLD_CUP_TEAM_COUNT) {
    throw new Error(`Polymarket snapshot coverage is incomplete: ${uniqueTeamCount}/${WORLD_CUP_TEAM_COUNT} teams.`);
  }

  if (data.universe && data.universe.trackedMarketCount < WORLD_CUP_TEAM_COUNT) {
    throw new Error(
      `Polymarket universe coverage is incomplete: ${data.universe.trackedMarketCount}/${WORLD_CUP_TEAM_COUNT} tracked markets.`,
    );
  }
}

export async function collectAllMarketSnapshots(): Promise<MarketSnapshotCollectionResult[]> {
  const results: MarketSnapshotCollectionResult[] = [];

  for (const source of COLLECTABLE_SOURCES) {
    results.push(await collectMarketSnapshots(source));
  }

  return results;
}
