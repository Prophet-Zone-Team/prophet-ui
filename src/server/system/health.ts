import { getTheOddsApiWorldCupWinnerOdds } from "../../data/odds/theOddsApiProvider";
import type { OddsProviderMeta } from "../../data/odds/types";
import { ENABLED_MARKET_DATA_SOURCES } from "../../data/providers/source";
import type { MarketDataSource } from "../../data/providers/types";
import { getMarketHistoryRepository } from "../market-history/repository";
import type { MarketSnapshotSourceStat, MarketUniverseSnapshotRecord, StoredMarketDataSource } from "../market-history/types";
import { getSignalDataRepository } from "../signal-data/repository";
import type { SignalDataSourceStats } from "../signal-data/types";

const MARKET_FRESHNESS_THRESHOLD_MINUTES = 30;
const SIGNAL_FRESHNESS_THRESHOLD_HOURS = 24;
const ODDS_HEALTH_CACHE_TTL_MS = 10 * 60 * 1000;

let oddsHealthCache: { expiresAt: number; meta: OddsProviderMeta } | undefined;

export type HealthStatus = "ok" | "stale" | "empty" | "error";

export interface SystemHealthReport {
  checkedAt: string;
  marketSnapshots: {
    status: HealthStatus;
    freshnessThresholdMinutes: number;
    sources: Array<MarketSnapshotSourceStat & { ageMinutes?: number; status: HealthStatus }>;
  };
  marketUniverse: MarketUniverseHealthSlice;
  oddsData: OddsHealthSlice;
  signalData: {
    status: HealthStatus;
    freshnessThresholdHours: number;
    news: SignalHealthSlice;
    football: SignalHealthSlice;
  };
}

interface MarketUniverseHealthSlice {
  status: HealthStatus;
  source: MarketUniverseSnapshotRecord["source"];
  freshnessThresholdMinutes: number;
  capturedAt?: string;
  ageMinutes?: number;
  marketCount?: number;
  trackedMarketCount?: number;
  canonicalTeamCount?: number;
  totalVolume?: number;
  volume24h?: number;
  liquidity?: number;
  missingTeamCount?: number;
  unmappedMarketCount?: number;
}

interface SignalHealthSlice {
  status: HealthStatus;
  count: number;
  latestCollectedAt?: string;
  latestPublishedAt?: string;
  ageHours?: number;
  lastRun?: {
    collectedAt: string;
    count: number;
    status: string;
    errors?: string[];
  };
}

interface OddsHealthSlice {
  status: HealthStatus;
  source: OddsProviderMeta["source"];
  providerStatus: OddsProviderMeta["status"];
  cacheTtlMinutes: number;
  bookmakerCount: number;
  teamCount: number;
  marketKey?: string;
  lastUpdated?: string;
  ageHours?: number;
  error?: string;
}

interface SignalStatsSlice {
  count: number;
  latestCollectedAt?: string;
  latestPublishedAt?: string;
  lastRun?: SignalDataSourceStats["news"]["lastRun"];
}

export async function getSystemHealthReport(now = new Date()): Promise<SystemHealthReport> {
  const checkedAt = now.toISOString();
  const [marketStats, marketUniverse, oddsMeta, signalStats] = await Promise.all([
    readMarketStats(),
    readMarketUniverse(),
    readOddsMeta(),
    readSignalStats(),
  ]);
  const marketSources = getEnabledMarketStats(marketStats).map((stat) => {
    const ageMinutes = stat.latestCapturedAt ? getAgeMinutes(stat.latestCapturedAt, now) : undefined;

    return {
      ...stat,
      ageMinutes,
      status: getSliceStatus(stat.count, ageMinutes, MARKET_FRESHNESS_THRESHOLD_MINUTES),
    };
  });
  const odds = mapOddsSlice(oddsMeta, now);
  const news = mapSignalSlice(signalStats.news, now);
  const football = mapSignalSlice(signalStats.football, now);

  return {
    checkedAt,
    marketSnapshots: {
      status: aggregateStatus(marketSources.map((source) => source.status)),
      freshnessThresholdMinutes: MARKET_FRESHNESS_THRESHOLD_MINUTES,
      sources: marketSources,
    },
    marketUniverse: mapMarketUniverseSlice(marketUniverse, now),
    oddsData: odds,
    signalData: {
      status: aggregateStatus([news.status, football.status]),
      freshnessThresholdHours: SIGNAL_FRESHNESS_THRESHOLD_HOURS,
      news,
      football,
    },
  };
}

async function readMarketStats(): Promise<MarketSnapshotSourceStat[]> {
  const repository = await getMarketHistoryRepository();
  return repository.readSourceStats();
}

async function readOddsMeta(): Promise<OddsProviderMeta> {
  if (oddsHealthCache && oddsHealthCache.expiresAt > Date.now()) {
    return oddsHealthCache.meta;
  }

  const result = await getTheOddsApiWorldCupWinnerOdds();
  oddsHealthCache = {
    meta: result.meta,
    expiresAt: Date.now() + ODDS_HEALTH_CACHE_TTL_MS,
  };

  return result.meta;
}

async function readMarketUniverse(): Promise<MarketUniverseSnapshotRecord | undefined> {
  const repository = await getMarketHistoryRepository();
  return repository.readLatestUniverseSnapshot("polymarket");
}

async function readSignalStats(): Promise<SignalDataSourceStats> {
  const repository = await getSignalDataRepository();
  return repository.readSourceStats();
}

function mapSignalSlice(
  slice: SignalStatsSlice,
  now: Date,
): SignalHealthSlice {
  const latest = slice.latestCollectedAt ?? slice.latestPublishedAt;
  const ageHours = latest ? getAgeHours(latest, now) : undefined;

  return {
    status: getSignalSliceStatus(slice, ageHours),
    count: slice.count,
    latestCollectedAt: slice.latestCollectedAt,
    latestPublishedAt: slice.latestPublishedAt,
    ageHours,
    lastRun: slice.lastRun
      ? {
          collectedAt: slice.lastRun.collectedAt,
          count: slice.lastRun.count,
          status: slice.lastRun.status,
          errors: slice.lastRun.errors,
        }
      : undefined,
  };
}

function mapOddsSlice(meta: OddsProviderMeta, now: Date): OddsHealthSlice {
  const ageHours = meta.lastUpdated ? getAgeHours(meta.lastUpdated, now) : undefined;

  return {
    status: getOddsStatus(meta),
    source: meta.source,
    providerStatus: meta.status,
    cacheTtlMinutes: ODDS_HEALTH_CACHE_TTL_MS / 60_000,
    bookmakerCount: meta.bookmakerCount,
    teamCount: meta.teamCount,
    marketKey: meta.marketKey,
    lastUpdated: meta.lastUpdated,
    ageHours,
    error: meta.error,
  };
}

function mapMarketUniverseSlice(
  universe: MarketUniverseSnapshotRecord | undefined,
  now: Date,
): MarketUniverseHealthSlice {
  const ageMinutes = universe ? getAgeMinutes(universe.capturedAt, now) : undefined;

  return {
    status: getSliceStatus(universe ? 1 : 0, ageMinutes, MARKET_FRESHNESS_THRESHOLD_MINUTES),
    source: "polymarket",
    freshnessThresholdMinutes: MARKET_FRESHNESS_THRESHOLD_MINUTES,
    capturedAt: universe?.capturedAt,
    ageMinutes,
    marketCount: universe?.marketCount,
    trackedMarketCount: universe?.trackedMarketCount,
    canonicalTeamCount: universe?.canonicalTeamCount,
    totalVolume: universe?.totalVolume,
    volume24h: universe?.volume24h,
    liquidity: universe?.liquidity,
    missingTeamCount: universe?.missingTeamIds.length,
    unmappedMarketCount: universe?.unmappedMarketTitles.length,
  };
}

function getSignalSliceStatus(slice: SignalStatsSlice, ageHours: number | undefined): HealthStatus {
  if (slice.lastRun?.status === "skipped") {
    if (slice.count === 0) {
      return "empty";
    }

    return ageHours === undefined || ageHours > SIGNAL_FRESHNESS_THRESHOLD_HOURS ? "stale" : "ok";
  }

  if (slice.lastRun?.status === "error") {
    return "error";
  }

  if (slice.count === 0) {
    return "empty";
  }

  if (ageHours === undefined || ageHours > SIGNAL_FRESHNESS_THRESHOLD_HOURS) {
    return "stale";
  }

  return "ok";
}

function getOddsStatus(meta: OddsProviderMeta): HealthStatus {
  switch (meta.status) {
    case "live":
      return "ok";
    case "empty":
      return "empty";
    case "missing_api_key":
    case "unavailable":
      return "error";
  }
}

function getEnabledMarketStats(stats: MarketSnapshotSourceStat[]): MarketSnapshotSourceStat[] {
  const statsBySource = new Map(stats.map((stat) => [stat.source, stat]));

  return ENABLED_MARKET_DATA_SOURCES.filter(isStoredMarketDataSource).map((source) => (
    statsBySource.get(source) ?? {
      source,
      count: 0,
    }
  ));
}

function isStoredMarketDataSource(source: MarketDataSource): source is StoredMarketDataSource {
  return source !== "mock";
}

function getSliceStatus(count: number, age: number | undefined, threshold: number): HealthStatus {
  if (count === 0) {
    return "empty";
  }

  if (age === undefined || age > threshold) {
    return "stale";
  }

  return "ok";
}

function aggregateStatus(statuses: HealthStatus[]): HealthStatus {
  if (statuses.length === 0 || statuses.every((status) => status === "empty")) {
    return "empty";
  }

  if (statuses.some((status) => status === "error")) {
    return "error";
  }

  if (statuses.some((status) => status === "stale" || status === "empty")) {
    return "stale";
  }

  return "ok";
}

function getAgeMinutes(value: string, now: Date): number | undefined {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return undefined;
  }

  return Math.round(((now.getTime() - date.getTime()) / 60_000) * 10) / 10;
}

function getAgeHours(value: string, now: Date): number | undefined {
  const minutes = getAgeMinutes(value, now);
  return minutes === undefined ? undefined : Math.round((minutes / 60) * 10) / 10;
}
