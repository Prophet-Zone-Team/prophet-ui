import type {
  ApiFootballTeamContext,
  ApiFootballTeamProfile,
  FootballContextMeta,
  NewsEvent,
  ProbabilityHistoryPoint,
  TeamMarketSnapshot,
  MarketUniverseMeta,
} from "../../types/market";
import type { OddsProviderMeta } from "../odds/types";

export type MarketDataSource = "composite" | "polymarket" | "kalshi" | "mock";

export type MarketDataStatus = "live" | "partial" | "cached" | "fallback" | "error";

export type NewsDataSource = "gdelt" | "mock" | "none";

export type NewsDataStatus = "live" | "mock" | "unavailable";

export interface NewsDataMeta {
  source: NewsDataSource;
  status: NewsDataStatus;
  articleCount: number;
  lastUpdated?: string;
  error?: string;
}

export interface MarketDataMeta {
  source: MarketDataSource;
  status: MarketDataStatus;
  lastUpdated: string;
  stale: boolean;
  error?: string;
  news?: NewsDataMeta;
  football?: FootballContextMeta;
  odds?: OddsProviderMeta;
}

export interface WorldCupMarketData {
  snapshots: TeamMarketSnapshot[];
  newsEvents: NewsEvent[];
  probabilityHistory: ProbabilityHistoryPoint[];
  footballContext: ApiFootballTeamProfile[];
  footballTeamContext: ApiFootballTeamContext[];
  meta: MarketDataMeta;
  universe?: MarketUniverseMeta;
}

export interface WorldCupMarketDataOptions {
  source?: MarketDataSource;
  includeHistory?: boolean;
  includeNews?: boolean;
  includeFootballContext?: boolean;
  includeOdds?: boolean;
  preferStored?: boolean;
  footballContextTeamIds?: string[];
}

export interface WorldCupMarketDataProvider {
  getWorldCupMarketData(): Promise<WorldCupMarketData>;
}
