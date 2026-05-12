import type { WorldCupMarketData } from "../../data/providers/types";
import type { ProbabilityHistoryPoint, TeamMarketData, TeamMarketSnapshot } from "../../types/market";
import { getMarketHistoryRepository } from "./repository";
import type { MarketSnapshotRecord, StoredMarketDataSource } from "./types";

const DEFAULT_HISTORY_DAYS = 30;

export async function attachStoredMarketHistory(data: WorldCupMarketData): Promise<WorldCupMarketData> {
  if (data.meta.source === "mock") {
    return data;
  }

  const repository = await getMarketHistoryRepository();
  const records = await repository.readSnapshots({
    source: data.meta.source,
    days: DEFAULT_HISTORY_DAYS,
  });

  const currentRecords = createCurrentSnapshotRecords(data.snapshots, data.meta.source, new Date().toISOString());
  const combinedRecords = [...records, ...currentRecords];

  return {
    ...data,
    snapshots: applyHistoricalChanges(data.snapshots, combinedRecords),
    probabilityHistory: createProbabilityHistory(combinedRecords),
  };
}

export async function readProbabilityHistory(options: {
  source: StoredMarketDataSource;
  teamId?: string;
  days?: number;
}): Promise<ProbabilityHistoryPoint[]> {
  const repository = await getMarketHistoryRepository();
  const records = await repository.readSnapshots(options);
  return createProbabilityHistory(records);
}

function createCurrentSnapshotRecords(
  snapshots: TeamMarketSnapshot[],
  source: StoredMarketDataSource,
  capturedAt: string,
): MarketSnapshotRecord[] {
  return snapshots.map((snapshot) => ({
    id: `${source}:${snapshot.team.id}:${capturedAt}`,
    source,
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
}

function applyHistoricalChanges(
  snapshots: TeamMarketSnapshot[],
  records: MarketSnapshotRecord[],
): TeamMarketSnapshot[] {
  return snapshots.map((snapshot) => ({
    ...snapshot,
    market: {
      ...snapshot.market,
      change24h: getChangeFromHistory(snapshot.market, records, 1),
      change7d: getChangeFromHistory(snapshot.market, records, 7),
    },
  }));
}

function getChangeFromHistory(
  market: TeamMarketData,
  records: MarketSnapshotRecord[],
  daysBack: number,
): number {
  const teamRecords = records
    .filter((record) => record.teamId === market.teamId)
    .sort((a, b) => a.capturedAt.localeCompare(b.capturedAt));

  if (teamRecords.length < 2) {
    return daysBack === 1 ? market.change24h : market.change7d;
  }

  const latest = teamRecords[teamRecords.length - 1];
  const target = new Date(latest.capturedAt);
  target.setUTCDate(target.getUTCDate() - daysBack);

  const baseline =
    [...teamRecords].reverse().find((record) => new Date(record.capturedAt) <= target) ?? teamRecords[0];

  return roundProbability(latest.probability - baseline.probability);
}

function createProbabilityHistory(records: MarketSnapshotRecord[]): ProbabilityHistoryPoint[] {
  const latestByDay = new Map<string, MarketSnapshotRecord>();

  for (const record of records) {
    const key = `${record.teamId}:${record.capturedAt.slice(0, 10)}`;
    const existing = latestByDay.get(key);

    if (!existing || record.capturedAt > existing.capturedAt) {
      latestByDay.set(key, record);
    }
  }

  return [...latestByDay.values()]
    .map((record) => ({
      teamId: record.teamId,
      date: record.capturedAt.slice(0, 10),
      probability: record.probability,
    }))
    .sort((a, b) => `${a.teamId}:${a.date}`.localeCompare(`${b.teamId}:${b.date}`));
}

function roundProbability(value: number): number {
  return Math.round(value * 10) / 10;
}
