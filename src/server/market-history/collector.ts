import { getLiveWorldCupMarketData } from "../../data/providers/worldCupMarketData";
import type { MarketDataSource } from "../../data/providers/types";
import { getMarketHistoryRepository } from "./repository";
import type { MarketSnapshotRecord, StoredMarketDataSource } from "./types";

const COLLECTABLE_SOURCES: StoredMarketDataSource[] = ["polymarket", "kalshi", "composite"];

export interface MarketSnapshotCollectionResult {
  source: StoredMarketDataSource;
  capturedAt: string;
  count: number;
}

export async function collectMarketSnapshots(source: MarketDataSource): Promise<MarketSnapshotCollectionResult> {
  if (source === "mock") {
    throw new Error("Mock data is not collected into market history.");
  }

  const data = await getLiveWorldCupMarketData({ source });

  if (data.meta.source === "mock") {
    throw new Error("Fallback mock data is not collected into market history.");
  }

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

  return {
    source: historySource,
    capturedAt,
    count: records.length,
  };
}

export async function collectAllMarketSnapshots(): Promise<MarketSnapshotCollectionResult[]> {
  const results: MarketSnapshotCollectionResult[] = [];

  for (const source of COLLECTABLE_SOURCES) {
    results.push(await collectMarketSnapshots(source));
  }

  return results;
}
