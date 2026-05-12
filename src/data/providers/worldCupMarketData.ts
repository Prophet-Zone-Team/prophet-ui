import { mockDataProvider } from "./mockDataProvider";
import { polymarketDataProvider } from "./polymarketDataProvider";
import { kalshiDataProvider } from "./kalshiDataProvider";
import { getMarketDataSourceLabel } from "./source";
import type { MarketDataSource, WorldCupMarketData, WorldCupMarketDataOptions } from "./types";
import { getNewsImpactForSnapshots } from "../news/newsImpact";
import { getApiFootballContext } from "../football/apiFootballProvider";
import { attachStoredMarketHistory } from "../../server/market-history/historyReader";
import { getSignalDataRepository } from "../../server/signal-data/repository";
import type {
  MarketSentiment,
  ProbabilityHistoryPoint,
  TeamMarketData,
  TeamMarketSnapshot,
} from "../../types/market";

export async function getWorldCupMarketData(options: WorldCupMarketDataOptions = {}): Promise<WorldCupMarketData> {
  const data = await getLiveWorldCupMarketData(options);
  const dataWithHistory = options.includeHistory === false ? data : await attachStoredMarketHistory(data);

  if (options.includeNews === false || dataWithHistory.meta.source === "mock") {
    return options.includeFootballContext === false
      ? dataWithHistory
      : attachFootballContext(dataWithHistory, options.footballContextTeamIds);
  }

  const dataWithNews = await attachNewsImpact(dataWithHistory);

  return options.includeFootballContext === false
    ? dataWithNews
    : attachFootballContext(dataWithNews, options.footballContextTeamIds);
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
    meta: {
      source: "composite",
      status: "live",
      lastUpdated,
      stale: false,
    },
  };
}

async function attachNewsImpact(data: WorldCupMarketData): Promise<WorldCupMarketData> {
  const cached = await readCachedNewsEvents(data);

  if (cached.newsEvents.length > 0) {
    return {
      ...data,
      newsEvents: cached.newsEvents,
      meta: {
        ...data.meta,
        news: cached.meta,
      },
    };
  }

  const result = await getNewsImpactForSnapshots(data.snapshots);
  const lastNewsUpdate = result.newsEvents.reduce<string | undefined>((latest, event) => {
    if (!latest || event.publishedAt > latest) {
      return event.publishedAt;
    }

    return latest;
  }, undefined);

  return {
    ...data,
    newsEvents: result.newsEvents,
    meta: {
      ...data.meta,
      error: joinMetaErrors(data.meta.error, result.error),
      news: {
        source: "gdelt",
        status: result.error && result.newsEvents.length === 0 ? "unavailable" : "live",
        articleCount: result.newsEvents.length,
        lastUpdated: lastNewsUpdate,
        error: result.error,
      },
    },
  };
}

async function attachFootballContext(
  data: WorldCupMarketData,
  teamIds: string[] | undefined,
): Promise<WorldCupMarketData> {
  const cached = await readCachedFootballContext(teamIds);

  if (cached.context.length > 0) {
    return {
      ...data,
      footballContext: cached.context.map((teamContext) => teamContext.profile),
      footballTeamContext: cached.context,
      meta: {
        ...data.meta,
        football: cached.meta,
      },
    };
  }

  const snapshots = teamIds
    ? data.snapshots.filter((snapshot) => teamIds.includes(snapshot.team.id))
    : data.snapshots;
  const result = await getApiFootballContext(snapshots);

  return {
    ...data,
    footballContext: result.context.map((teamContext) => teamContext.profile),
    footballTeamContext: result.context,
    meta: {
      ...data.meta,
      error: joinMetaErrors(data.meta.error, result.meta.status === "unavailable" ? result.meta.error : undefined),
      football: result.meta,
    },
  };
}

async function readCachedNewsEvents(data: WorldCupMarketData): Promise<{
  newsEvents: WorldCupMarketData["newsEvents"];
  meta: NonNullable<WorldCupMarketData["meta"]["news"]>;
}> {
  const repository = await getSignalDataRepository();
  const articles = await repository.readNewsArticles({ days: 30, limit: 80 });
  const teamIds = new Set(data.snapshots.map((snapshot) => snapshot.team.id));
  const articlesByTeam = articles
    .flatMap((article) =>
      article.matchedTeamIds
        .filter((teamId) => teamIds.has(teamId))
        .map((teamId) => ({ article, teamId })),
    )
    .slice(0, 40);
  const newsEvents = articlesByTeam.map(({ article, teamId }, index) => {
    const snapshot = data.snapshots.find((item) => item.team.id === teamId);
    const change24h = snapshot?.market.change24h ?? 0;
    const impactScore = Math.max(35, Math.min(86, Math.round(Math.abs(change24h) * 24 + 42)));

    return {
      id: `${article.id}-${teamId}-${index}`,
      teamId,
      headline: article.title,
      source: article.source ?? "GDELT",
      publishedAt: article.publishedAt ?? data.meta.lastUpdated,
      impactScore: change24h >= 0 ? impactScore : -impactScore,
      summary: `Possible related coverage appeared in the stored GDELT signal cache. Correlation, not causation.`,
      url: article.url,
      language: article.language,
      matchedKeywords: article.matchedKeywords,
    };
  });
  const lastUpdated = newsEvents.reduce<string | undefined>((latest, event) => {
    if (!latest || event.publishedAt > latest) {
      return event.publishedAt;
    }

    return latest;
  }, undefined);

  return {
    newsEvents,
    meta: {
      source: "gdelt",
      status: "live",
      articleCount: newsEvents.length,
      lastUpdated,
    },
  };
}

async function readCachedFootballContext(teamIds: string[] | undefined): Promise<{
  context: WorldCupMarketData["footballTeamContext"];
  meta: NonNullable<WorldCupMarketData["meta"]["football"]>;
}> {
  const repository = await getSignalDataRepository();
  const context = teamIds?.length === 1
    ? await repository.readFootballTeamContext({ teamId: teamIds[0] })
    : await repository.readFootballTeamContext();

  return {
    context,
    meta: {
      source: "api-football",
      status: context.length > 0 ? "live" : "unavailable",
      teamCount: context.length,
      lastUpdated: context.reduce<string | undefined>((latest, teamContext) => {
        if (!latest || teamContext.profile.updatedAt > latest) {
          return teamContext.profile.updatedAt;
        }

        return latest;
      }, undefined),
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

function joinMetaErrors(...messages: Array<string | undefined>): string | undefined {
  const filtered = messages.filter(Boolean);

  return filtered.length > 0 ? filtered.join(" ") : undefined;
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
