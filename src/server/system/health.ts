import { getMarketHistoryRepository } from "../market-history/repository";
import type { MarketSnapshotSourceStat } from "../market-history/types";
import { getSignalDataRepository } from "../signal-data/repository";
import type { SignalDataSourceStats } from "../signal-data/types";

const MARKET_FRESHNESS_THRESHOLD_MINUTES = 30;
const SIGNAL_FRESHNESS_THRESHOLD_HOURS = 24;

export type HealthStatus = "ok" | "stale" | "empty" | "error";

export interface SystemHealthReport {
  checkedAt: string;
  marketSnapshots: {
    status: HealthStatus;
    freshnessThresholdMinutes: number;
    sources: Array<MarketSnapshotSourceStat & { ageMinutes?: number; status: HealthStatus }>;
  };
  signalData: {
    status: HealthStatus;
    freshnessThresholdHours: number;
    news: SignalHealthSlice;
    football: SignalHealthSlice;
  };
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

interface SignalStatsSlice {
  count: number;
  latestCollectedAt?: string;
  latestPublishedAt?: string;
  lastRun?: SignalDataSourceStats["news"]["lastRun"];
}

export async function getSystemHealthReport(now = new Date()): Promise<SystemHealthReport> {
  const checkedAt = now.toISOString();
  const [marketStats, signalStats] = await Promise.all([
    readMarketStats(),
    readSignalStats(),
  ]);
  const marketSources = marketStats.map((stat) => {
    const ageMinutes = stat.latestCapturedAt ? getAgeMinutes(stat.latestCapturedAt, now) : undefined;

    return {
      ...stat,
      ageMinutes,
      status: getSliceStatus(stat.count, ageMinutes, MARKET_FRESHNESS_THRESHOLD_MINUTES),
    };
  });
  const news = mapSignalSlice(signalStats.news, now);
  const football = mapSignalSlice(signalStats.football, now);

  return {
    checkedAt,
    marketSnapshots: {
      status: aggregateStatus(marketSources.map((source) => source.status)),
      freshnessThresholdMinutes: MARKET_FRESHNESS_THRESHOLD_MINUTES,
      sources: marketSources,
    },
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

function getSignalSliceStatus(slice: SignalStatsSlice, ageHours: number | undefined): HealthStatus {
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
