import type { NewsEvent, ProbabilityHistoryPoint, TeamMarketSnapshot } from "../../types/market";

export type MarketDataSource = "composite" | "polymarket" | "kalshi" | "mock";

export type MarketDataStatus = "live" | "fallback";

export interface MarketDataMeta {
  source: MarketDataSource;
  status: MarketDataStatus;
  lastUpdated: string;
  stale: boolean;
  error?: string;
}

export interface WorldCupMarketData {
  snapshots: TeamMarketSnapshot[];
  newsEvents: NewsEvent[];
  probabilityHistory: ProbabilityHistoryPoint[];
  meta: MarketDataMeta;
}

export interface WorldCupMarketDataOptions {
  source?: MarketDataSource;
  includeHistory?: boolean;
}

export interface WorldCupMarketDataProvider {
  getWorldCupMarketData(): Promise<WorldCupMarketData>;
}
