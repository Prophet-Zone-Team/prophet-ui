import type { MarketDataSource } from "@/data/providers/types";
import type { MarketSentiment, MarketUniverseMeta, Team } from "@/types/market";

export type StoredMarketDataSource = Exclude<MarketDataSource, "mock">;

export interface MarketSnapshotRecord {
  id: string;
  source: StoredMarketDataSource;
  teamId: Team["id"];
  probability: number;
  change24h: number;
  change7d: number;
  volume: number;
  sentiment: MarketSentiment;
  bookmakerImpliedProbability: number;
  marketUpdatedAt: string;
  capturedAt: string;
}

export interface MarketHistoryReadOptions {
  source: StoredMarketDataSource;
  teamId?: Team["id"];
  days?: number;
  since?: string;
}

export interface MarketUniverseSnapshotRecord extends MarketUniverseMeta {
  id: string;
  source: StoredMarketDataSource;
  capturedAt: string;
}

export interface MarketHistoryRepository {
  appendSnapshots(records: MarketSnapshotRecord[]): Promise<void>;
  appendUniverseSnapshot(record: MarketUniverseSnapshotRecord): Promise<void>;
  readSnapshots(options: MarketHistoryReadOptions): Promise<MarketSnapshotRecord[]>;
  readLatestUniverseSnapshot(source: StoredMarketDataSource): Promise<MarketUniverseSnapshotRecord | undefined>;
  readSourceStats(): Promise<MarketSnapshotSourceStat[]>;
}

export interface MarketSnapshotSourceStat {
  source: StoredMarketDataSource;
  count: number;
  latestCapturedAt?: string;
}

export interface D1Result<T = unknown> {
  results?: T[];
  success?: boolean;
  error?: string;
  meta?: unknown;
}

export interface D1PreparedStatement {
  bind(...values: Array<string | number | null>): D1PreparedStatement;
  all<T = unknown>(): Promise<D1Result<T>>;
  run<T = unknown>(): Promise<D1Result<T>>;
}

export interface D1Database {
  prepare(query: string): D1PreparedStatement;
  batch<T = unknown>(statements: D1PreparedStatement[]): Promise<Array<D1Result<T>>>;
}
