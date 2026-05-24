import { mockDataProvider } from "@/data/providers/mock-data-provider";
import { polymarketDataProvider } from "@/data/providers/polymarket-data-provider";
import { kalshiDataProvider } from "@/data/providers/kalshi-data-provider";
import { getStoredPolymarketWorldCupData } from "@/data/providers/stored-polymarket-data-provider";
import {
  getMarketDataSourceLabel,
  normalizeMarketDataSource
} from "@/data/providers/source";
import type { MarketDataSource, WorldCupMarketData, WorldCupMarketDataOptions } from "@/data/providers/types";
import { getNewsImpactForSnapshots } from "@/data/news/news-impact";
import { getApiFootballContext } from "@/data/football/api-football-provider";
import { theOddsApiProvider } from "@/data/odds/the-odds-api-provider";
import { getAllTeamFootballMetadata } from "@/data/teams/football-metadata";
import type { NormalizedTeamOddsSummary } from "@/data/odds/types";
import { attachStoredMarketHistory } from "@/server/market-history/history-reader";
import { getSignalDataRepository } from "@/server/signal-data/repository";
import type {
  MarketSentiment,
  ProbabilityHistoryPoint,
  TeamMarketData,
  TeamMarketSnapshot,
} from "@/types/market";

const MARKET_DATA_CACHE_TTL_MS = 60_000;
const LIVE_MARKET_DATA_CACHE_TTL_MS = 60_000;
const ENRICHMENT_CACHE_TTL_MS = 60_000;
const marketDataCache = new Map<string, { data: WorldCupMarketData; expiresAt: number }>();
const liveMarketDataCache = new Map<string, { data: WorldCupMarketData; expiresAt: number }>();
const oddsLayerCache = new Map<string, { layer: OddsLayer; expiresAt: number }>();
const historyLayerCache = new Map<string, { layer: HistoryLayer; expiresAt: number }>();
const newsLayerCache = new Map<string, { layer: NewsLayer; expiresAt: number }>();
const footballLayerCache = new Map<string, { layer: FootballLayer; expiresAt: number }>();

interface OddsLayer {
  bookmakerByTeamId: Map<string, number | undefined>;
  meta?: WorldCupMarketData["meta"]["odds"];
}

interface HistoryLayer {
  snapshots: TeamMarketSnapshot[];
  probabilityHistory: ProbabilityHistoryPoint[];
  universe?: WorldCupMarketData["universe"];
}

interface NewsLayer {
  newsEvents: WorldCupMarketData["newsEvents"];
  meta?: WorldCupMarketData["meta"]["news"];
  error?: string;
}

interface FootballLayer {
  footballContext: WorldCupMarketData["footballContext"];
  footballTeamContext: WorldCupMarketData["footballTeamContext"];
  meta?: WorldCupMarketData["meta"]["football"];
  error?: string;
}

export async function getWorldCupMarketData(options: WorldCupMarketDataOptions = {}): Promise<WorldCupMarketData> {
  const cacheKey = getMarketDataCacheKey(options);
  const cached = marketDataCache.get(cacheKey);

  if (cached && cached.expiresAt > Date.now()) {
    return cloneMarketData(withCachedStatus(cached.data));
  }

  const data = await getLiveWorldCupMarketData(options);
  const isMock = data.meta.source === "mock";
  const includeOdds = options.includeOdds !== false && !isMock;
  const includeHistory = options.includeHistory !== false && !isMock;
  const includeNews = options.includeNews !== false && !isMock;
  const includeFootball = options.includeFootballContext !== false;

  const [oddsLayer, historyLayer, newsLayer, footballLayer] = await Promise.all([
    includeOdds ? getOddsLayer(data) : Promise.resolve(null),
    includeHistory ? getHistoryLayer(data) : Promise.resolve(null),
    includeNews ? getNewsLayer(data) : Promise.resolve(null),
    includeFootball
      ? getFootballLayer(data, options.footballContextTeamIds)
      : Promise.resolve(null),
  ]);

  const result = mergeMarketDataLayers(data, {
    oddsLayer,
    historyLayer,
    newsLayer,
    footballLayer,
    footballContextTeamIds: options.footballContextTeamIds,
  });

  marketDataCache.set(cacheKey, {
    data: cloneMarketData(result),
    expiresAt: Date.now() + MARKET_DATA_CACHE_TTL_MS,
  });

  return result;
}

async function getOddsLayer(data: WorldCupMarketData): Promise<OddsLayer> {
  const cacheKey = data.meta.source;
  const cached = oddsLayerCache.get(cacheKey);

  if (cached && cached.expiresAt > Date.now()) {
    return cached.layer;
  }

  const enriched = await attachBookmakerOdds(data);
  const layer: OddsLayer = {
    bookmakerByTeamId: new Map(
      enriched.snapshots.map((snapshot) => [
        snapshot.team.id,
        snapshot.market.bookmakerImpliedProbability,
      ]),
    ),
    meta: enriched.meta.odds,
  };

  oddsLayerCache.set(cacheKey, {
    layer,
    expiresAt: Date.now() + ENRICHMENT_CACHE_TTL_MS,
  });

  return layer;
}

async function getHistoryLayer(data: WorldCupMarketData): Promise<HistoryLayer> {
  const cacheKey = `${data.meta.source}:${data.meta.lastUpdated}`;
  const cached = historyLayerCache.get(cacheKey);

  if (cached && cached.expiresAt > Date.now()) {
    return cached.layer;
  }

  const enriched = await attachStoredMarketHistory(data);
  const layer: HistoryLayer = {
    snapshots: enriched.snapshots,
    probabilityHistory: enriched.probabilityHistory,
    universe: enriched.universe,
  };

  historyLayerCache.set(cacheKey, {
    layer,
    expiresAt: Date.now() + ENRICHMENT_CACHE_TTL_MS,
  });

  return layer;
}

async function getNewsLayer(data: WorldCupMarketData): Promise<NewsLayer> {
  const cacheKey = `${data.meta.source}:${data.meta.lastUpdated}`;
  const cached = newsLayerCache.get(cacheKey);

  if (cached && cached.expiresAt > Date.now()) {
    return cached.layer;
  }

  const enriched = await attachNewsImpact(data);
  const layer: NewsLayer = {
    newsEvents: enriched.newsEvents,
    meta: enriched.meta.news,
    error: enriched.meta.error,
  };

  newsLayerCache.set(cacheKey, {
    layer,
    expiresAt: Date.now() + ENRICHMENT_CACHE_TTL_MS,
  });

  return layer;
}

async function getFootballLayer(
  data: WorldCupMarketData,
  teamIds: string[] | undefined,
): Promise<FootballLayer> {
  const cacheKey =
    teamIds?.length === 1 ? `team:${teamIds[0]}` : "all";
  const cached = footballLayerCache.get(cacheKey);

  if (cached && cached.expiresAt > Date.now()) {
    return cached.layer;
  }

  const enriched = await attachFootballContext(data, teamIds);
  const layer: FootballLayer = {
    footballContext: enriched.footballContext,
    footballTeamContext: enriched.footballTeamContext,
    meta: enriched.meta.football,
    error: enriched.meta.error,
  };

  footballLayerCache.set(cacheKey, {
    layer,
    expiresAt: Date.now() + ENRICHMENT_CACHE_TTL_MS,
  });

  return layer;
}

function mergeMarketDataLayers(
  data: WorldCupMarketData,
  layers: {
    oddsLayer: OddsLayer | null;
    historyLayer: HistoryLayer | null;
    newsLayer: NewsLayer | null;
    footballLayer: FootballLayer | null;
    footballContextTeamIds?: string[];
  },
): WorldCupMarketData {
  let snapshots = data.snapshots;
  let result: WorldCupMarketData = {
    ...data,
    newsEvents: [],
    probabilityHistory: [],
    footballContext: [],
    footballTeamContext: [],
  };

  if (layers.historyLayer) {
    snapshots = layers.historyLayer.snapshots;
    result = {
      ...result,
      snapshots,
      probabilityHistory: layers.historyLayer.probabilityHistory,
      universe: layers.historyLayer.universe,
    };
  } else {
    result = {
      ...result,
      snapshots,
    };
  }

  if (layers.oddsLayer) {
    result = {
      ...result,
      snapshots: result.snapshots.map((snapshot) => ({
        ...snapshot,
        market: {
          ...snapshot.market,
          bookmakerImpliedProbability:
            layers.oddsLayer?.bookmakerByTeamId.get(snapshot.team.id) ??
            snapshot.market.bookmakerImpliedProbability,
        },
      })),
      meta: {
        ...result.meta,
        odds: layers.oddsLayer.meta,
      },
    };
  }

  if (layers.newsLayer) {
    result = {
      ...result,
      newsEvents: layers.newsLayer.newsEvents,
      meta: {
        ...result.meta,
        error: joinMetaErrors(result.meta.error, layers.newsLayer.error),
        news: layers.newsLayer.meta,
      },
    };
  }

  if (layers.footballLayer) {
    const teamIds = layers.footballContextTeamIds;
    const footballTeamContext =
      teamIds && teamIds.length > 0
        ? layers.footballLayer.footballTeamContext.filter((context) =>
            teamIds.includes(context.profile.teamId),
          )
        : layers.footballLayer.footballTeamContext;

    result = {
      ...result,
      footballContext: footballTeamContext.map((context) => context.profile),
      footballTeamContext,
      meta: {
        ...result.meta,
        error: joinMetaErrors(result.meta.error, layers.footballLayer.error),
        football: layers.footballLayer.meta,
      },
    };
  }

  return result;
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

    if (source === "polymarket" && options.preferStored !== false) {
      data = (await getStoredPolymarketWorldCupData()) ?? await polymarketDataProvider.getWorldCupMarketData();
    } else if (source === "kalshi") {
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

  if (!teamIds || teamIds.length !== 1) {
    return {
      ...data,
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
    polymarket: polymarketMarket.polymarket,
  };
}

async function attachBookmakerOdds(data: WorldCupMarketData): Promise<WorldCupMarketData> {
  if (data.meta.source === "mock") {
    return data;
  }

  const result = await theOddsApiProvider.getWorldCupWinnerOdds();

  if (result.summaries.length === 0) {
    return {
      ...data,
      meta: {
        ...data.meta,
        odds: result.meta,
      },
    };
  }

  const summariesByTeam = new Map(result.summaries.map((summary) => [summary.teamId, summary]));
  const snapshots = data.snapshots.map((snapshot) => applyOddsSummary(snapshot, summariesByTeam.get(snapshot.team.id)));

  return {
    ...data,
    snapshots,
    meta: {
      ...data.meta,
      odds: result.meta,
    },
  };
}

function applyOddsSummary(
  snapshot: TeamMarketSnapshot,
  summary: NormalizedTeamOddsSummary | undefined,
): TeamMarketSnapshot {
  if (!summary) {
    return snapshot;
  }

  return {
    ...snapshot,
    market: {
      ...snapshot.market,
      bookmakerImpliedProbability: summary.medianImpliedProbability,
    },
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

function getMarketDataCacheKey(options: WorldCupMarketDataOptions) {
  return JSON.stringify({
    source: normalizeMarketDataSource(options.source),
    includeHistory: options.includeHistory !== false,
    includeNews: options.includeNews !== false,
    includeFootballContext: options.includeFootballContext !== false,
    includeOdds: options.includeOdds !== false,
    preferStored: options.preferStored !== false,
    footballContextTeamIds: [...(options.footballContextTeamIds ?? [])].sort(),
  });
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
