import { mockDataProvider } from "./mockDataProvider";
import { polymarketDataProvider } from "./polymarketDataProvider";
import { kalshiDataProvider } from "./kalshiDataProvider";
import { getMarketDataSourceLabel } from "./source";
import type { MarketDataSource, WorldCupMarketData, WorldCupMarketDataOptions } from "./types";
import { attachStoredMarketHistory } from "../../server/market-history/historyReader";
import type {
  MarketSentiment,
  ProbabilityHistoryPoint,
  TeamMarketData,
  TeamMarketSnapshot,
} from "../../types/market";

export async function getWorldCupMarketData(options: WorldCupMarketDataOptions = {}): Promise<WorldCupMarketData> {
  const data = await getLiveWorldCupMarketData(options);

  if (options.includeHistory === false) {
    return data;
  }

  return attachStoredMarketHistory(data);
}

export async function getLiveWorldCupMarketData(options: WorldCupMarketDataOptions = {}): Promise<WorldCupMarketData> {
  const source = options.source ?? "composite";

  if (source === "mock") {
    return mockDataProvider.getWorldCupMarketData();
  }

  try {
    if (source === "kalshi") {
      return await kalshiDataProvider.getWorldCupMarketData();
    }

    if (source === "polymarket") {
      return await polymarketDataProvider.getWorldCupMarketData();
    }

    return await getCompositeWorldCupMarketData();
  } catch (error) {
    return getFallbackMarketData(source, error);
  }
}

async function getCompositeWorldCupMarketData(): Promise<WorldCupMarketData> {
  const [polymarketResult, kalshiResult] = await Promise.allSettled([
    polymarketDataProvider.getWorldCupMarketData(),
    kalshiDataProvider.getWorldCupMarketData(),
  ]);

  if (polymarketResult.status === "rejected" && kalshiResult.status === "rejected") {
    throw new Error(
      `Polymarket failed: ${getErrorMessage(polymarketResult.reason)} Kalshi failed: ${getErrorMessage(kalshiResult.reason)}`,
    );
  }

  if (polymarketResult.status === "fulfilled" && kalshiResult.status === "fulfilled") {
    return mergeProviderData(polymarketResult.value, kalshiResult.value);
  }

  if (polymarketResult.status === "fulfilled" && kalshiResult.status === "rejected") {
    return withCompositePartialStatus(polymarketResult.value, "Kalshi", kalshiResult.reason);
  }

  if (polymarketResult.status === "rejected" && kalshiResult.status === "fulfilled") {
    return withCompositePartialStatus(kalshiResult.value, "Polymarket", polymarketResult.reason);
  }

  throw new Error("Unable to resolve composite market data provider state.");
}

function withCompositePartialStatus(
  liveData: WorldCupMarketData,
  failedSource: string,
  error: unknown,
): WorldCupMarketData {
  return {
    ...liveData,
    meta: {
      ...liveData.meta,
      source: "composite",
      status: "partial",
      error: `${failedSource} unavailable; showing ${getMarketDataSourceLabel(liveData.meta.source)} only. ${getErrorMessage(error)}`,
    },
  };
}

function mergeProviderData(polymarketData: WorldCupMarketData, kalshiData: WorldCupMarketData): WorldCupMarketData {
  const polymarketByTeam = new Map(polymarketData.snapshots.map((snapshot) => [snapshot.team.id, snapshot]));
  const kalshiByTeam = new Map(kalshiData.snapshots.map((snapshot) => [snapshot.team.id, snapshot]));
  const teamIds = new Set([...polymarketByTeam.keys(), ...kalshiByTeam.keys()]);
  const snapshots = [...teamIds]
    .map((teamId) => mergeSnapshot(polymarketByTeam.get(teamId), kalshiByTeam.get(teamId)))
    .filter(isSnapshot)
    .sort((a, b) => b.market.volume - a.market.volume);
  const lastUpdated = snapshots.reduce((latest, snapshot) => {
    return snapshot.market.updatedAt > latest ? snapshot.market.updatedAt : latest;
  }, new Date().toISOString());

  return {
    snapshots,
    newsEvents: [...polymarketData.newsEvents, ...kalshiData.newsEvents],
    probabilityHistory: mergeProbabilityHistory(polymarketData.probabilityHistory, kalshiData.probabilityHistory),
    meta: {
      source: "composite",
      status: "live",
      lastUpdated,
      stale: false,
    },
  };
}

function mergeSnapshot(
  polymarketSnapshot: TeamMarketSnapshot | undefined,
  kalshiSnapshot: TeamMarketSnapshot | undefined,
): TeamMarketSnapshot | undefined {
  if (!polymarketSnapshot) {
    return kalshiSnapshot;
  }

  if (!kalshiSnapshot) {
    return polymarketSnapshot;
  }

  const market = mergeMarketData(polymarketSnapshot.market, kalshiSnapshot.market);

  return {
    team: polymarketSnapshot.team,
    market,
  };
}

function mergeMarketData(polymarketMarket: TeamMarketData, kalshiMarket: TeamMarketData): TeamMarketData {
  const probability = average(polymarketMarket.probability, kalshiMarket.probability);
  const change24h = average(polymarketMarket.change24h, kalshiMarket.change24h);
  const change7d = average(polymarketMarket.change7d, kalshiMarket.change7d);

  return {
    teamId: polymarketMarket.teamId,
    probability,
    change24h,
    change7d,
    volume: polymarketMarket.volume + kalshiMarket.volume,
    sentiment: deriveSentiment(change24h),
    bookmakerImpliedProbability: kalshiMarket.probability,
    updatedAt: polymarketMarket.updatedAt > kalshiMarket.updatedAt ? polymarketMarket.updatedAt : kalshiMarket.updatedAt,
  };
}

function mergeProbabilityHistory(
  polymarketHistory: ProbabilityHistoryPoint[],
  kalshiHistory: ProbabilityHistoryPoint[],
): ProbabilityHistoryPoint[] {
  const pointsByKey = new Map<string, ProbabilityHistoryPoint[]>();

  for (const point of [...polymarketHistory, ...kalshiHistory]) {
    const key = `${point.teamId}-${point.date}`;
    const existing = pointsByKey.get(key) ?? [];
    pointsByKey.set(key, [...existing, point]);
  }

  return [...pointsByKey.values()]
    .map((points) => {
      const first = points[0];

      return {
        teamId: first.teamId,
        date: first.date,
        probability: average(...points.map((point) => point.probability)),
      };
    })
    .sort((a, b) => a.date.localeCompare(b.date));
}

async function getFallbackMarketData(source: MarketDataSource, error: unknown): Promise<WorldCupMarketData> {
  const fallback = await mockDataProvider.getWorldCupMarketData();

  return {
    ...fallback,
    meta: {
      ...fallback.meta,
      error: `${getMarketDataSourceLabel(source)} failed: ${getErrorMessage(error)}`,
    },
  };
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unable to load live Polymarket market data.";
}

function average(...values: number[]): number {
  return Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 10) / 10;
}

function deriveSentiment(change24h: number): MarketSentiment {
  if (change24h >= 1) {
    return "bullish";
  }

  if (change24h <= -1) {
    return "bearish";
  }

  if (Math.abs(change24h) >= 0.4) {
    return "volatile";
  }

  return "neutral";
}

function isSnapshot(value: TeamMarketSnapshot | undefined): value is TeamMarketSnapshot {
  return Boolean(value);
}
