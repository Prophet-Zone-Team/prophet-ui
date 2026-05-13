import type { Team } from "../../types/market";

export type OddsDataSource = "the-odds-api" | "none";

export type OddsDataStatus = "live" | "missing_api_key" | "unavailable" | "empty";

export interface NormalizedBookmakerOdds {
  bookmaker: string;
  teamId: Team["id"];
  decimalOdds: number;
  impliedProbability: number;
  lastUpdated?: string;
  marketKey?: string;
}

export interface NormalizedTeamOddsSummary {
  teamId: Team["id"];
  bookmakerCount: number;
  averageImpliedProbability: number;
  medianImpliedProbability: number;
  minImpliedProbability: number;
  maxImpliedProbability: number;
  lastUpdated?: string;
}

export interface OddsProviderMeta {
  source: OddsDataSource;
  status: OddsDataStatus;
  marketKey?: string;
  bookmakerCount: number;
  teamCount: number;
  lastUpdated?: string;
  error?: string;
}

export interface WorldCupWinnerOdds {
  odds: NormalizedBookmakerOdds[];
  summaries: NormalizedTeamOddsSummary[];
  meta: OddsProviderMeta;
}

export interface OddsProvider {
  getWorldCupWinnerOdds(): Promise<WorldCupWinnerOdds>;
}
