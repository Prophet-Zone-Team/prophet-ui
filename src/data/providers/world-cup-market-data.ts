import { mockDataProvider } from "@/data/providers/mock-data-provider";
import { polymarketDataProvider } from "@/data/providers/polymarket-data-provider";
import { kalshiDataProvider } from "@/data/providers/kalshi-data-provider";
import {
  getMarketDataSourceLabel,
  normalizeMarketDataSource
} from "@/data/providers/source";
import type { MarketDataSource, WorldCupMarketData, WorldCupMarketDataOptions } from "@/data/providers/types";
import { getAllTeamFootballMetadata } from "@/data/teams/football-metadata";
import type {
  MarketSentiment,
  ProbabilityHistoryPoint,
  TeamMarketData,
  TeamMarketSnapshot,
} from "@/types/market";

const LIVE_MARKET_DATA_CACHE_TTL_MS = 60_000;
const liveMarketDataCache = new Map<string, { data: WorldCupMarketData; expiresAt: number }>();

export { getTeamMarketSnapshot } from "@/data/providers/team-market-snapshot";
export type { TeamMarketSnapshotResult } from "@/data/providers/types";

export async function getWorldCupMarketData(options: WorldCupMarketDataOptions = {}): Promise<WorldCupMarketData> {
  return getLiveWorldCupMarketData(options);
}

export async function getLiveWorldCupMarketData(options: WorldCupMarketDataOptions = {}): Promise<WorldCupMarketData> {
  const source = normalizeMarketDataSource(options.source);
  const cacheKey = source;
  const cached = liveMarketDataCache.get(cacheKey);

  if (cached && cached.expiresAt > Date.now()) {
    return cloneMarketData(withCachedStatus(cached.data));
  }

  if (source === "mock") {
    return mockDataProvider.getWorldCupMarketData();
  }

  try {
    let data: WorldCupMarketData;

    if (source === "kalshi") {
      data = await kalshiDataProvider.getWorldCupMarketData();
    } else if (source === "polymarket") {
      data = await polymarketDataProvider.getWorldCupMarketData();
    } else {
      data = await getCompositeWorldCupMarketData();
    }

    liveMarketDataCache.set(cacheKey, {
      data: cloneMarketData(data),
      expiresAt: Date.now() + LIVE_MARKET_DATA_CACHE_TTL_MS,
    });

    return data;
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
    footballContext: [],
    footballTeamContext: [],
    footballMetadata: getAllTeamFootballMetadata(),
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
    polymarket: polymarketMarket.polymarket,
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
  if (process.env.NODE_ENV === "production" && source === "polymarket") {
    const now = new Date().toISOString();

    return {
      snapshots: [],
      newsEvents: [],
      probabilityHistory: [],
      footballContext: [],
      footballTeamContext: [],
      footballMetadata: getAllTeamFootballMetadata(),
      meta: {
        source,
        status: "error",
        lastUpdated: now,
        stale: true,
        error: `${getMarketDataSourceLabel(source)} failed: ${getErrorMessage(error)}`,
      },
    };
  }

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

function withCachedStatus(data: WorldCupMarketData): WorldCupMarketData {
  return {
    ...data,
    meta: {
      ...data.meta,
      status: data.meta.status === "live" ? "cached" : data.meta.status,
    },
  };
}

function cloneMarketData(data: WorldCupMarketData): WorldCupMarketData {
  return {
    ...data,
    snapshots: data.snapshots.map((snapshot) => ({
      team: { ...snapshot.team },
      market: {
        ...snapshot.market,
        polymarket: snapshot.market.polymarket
          ? {
              ...snapshot.market.polymarket,
              tokens: {
                yes: snapshot.market.polymarket.tokens.yes
                  ? { ...snapshot.market.polymarket.tokens.yes }
                  : undefined,
                no: snapshot.market.polymarket.tokens.no
                  ? { ...snapshot.market.polymarket.tokens.no }
                  : undefined,
              },
              fee: snapshot.market.polymarket.fee ? { ...snapshot.market.polymarket.fee } : undefined,
            }
          : undefined,
      },
    })),
    newsEvents: data.newsEvents.map((event) => ({ ...event })),
    probabilityHistory: data.probabilityHistory.map((point) => ({ ...point })),
    footballContext: data.footballContext.map((profile) => ({ ...profile })),
    footballMetadata: data.footballMetadata.map((metadata) => ({
      ...metadata,
      groupPeers: [...metadata.groupPeers],
      keyPlayers: metadata.keyPlayers.map((player) => ({ ...player })),
    })),
    footballTeamContext: data.footballTeamContext.map((context) => ({
      ...context,
      profile: { ...context.profile },
      fixtures: context.fixtures.map((fixture) => ({ ...fixture })),
      squad: context.squad.map((player) => ({ ...player })),
      injuries: context.injuries.map((injury) => ({ ...injury })),
      standings: context.standings.map((standing) => ({ ...standing })),
      odds: context.odds.map((odds) => ({ ...odds })),
      dataIssues: context.dataIssues.map((issue) => ({ ...issue })),
    })),
    meta: {
      ...data.meta,
      news: data.meta.news ? { ...data.meta.news } : undefined,
      football: data.meta.football ? { ...data.meta.football } : undefined,
      odds: data.meta.odds ? { ...data.meta.odds } : undefined,
    },
    universe: data.universe
      ? {
          ...data.universe,
          missingTeamIds: [...data.universe.missingTeamIds],
          unmappedMarketTitles: [...data.universe.unmappedMarketTitles],
        }
      : undefined,
  };
}
