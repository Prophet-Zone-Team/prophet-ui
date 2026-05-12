export type TeamRegion =
  | "Africa"
  | "Asia"
  | "Europe"
  | "North America"
  | "South America";

export type MarketSentiment = "bullish" | "bearish" | "neutral" | "volatile";

export type MarketTrend = "rising" | "falling" | "flat";

export type SignalSeverity = "low" | "medium" | "high";

export type SignalType =
  | "hot-team"
  | "top-mover"
  | "biggest-loser"
  | "odds-mismatch"
  | "volume-spike"
  | "sentiment-shift";

export type MockBidSide = "yes" | "no";

export type MockBidStatus = "draft" | "simulated" | "cancelled";

export interface Team {
  id: string;
  name: string;
  code: string;
  region: TeamRegion;
  group: string;
  fifaRank: number;
}

export interface TeamMarketData {
  teamId: Team["id"];
  probability: number;
  change24h: number;
  change7d: number;
  volume: number;
  sentiment: MarketSentiment;
  bookmakerImpliedProbability: number;
  updatedAt: string;
}

export interface ProbabilityHistoryPoint {
  teamId: Team["id"];
  date: string;
  probability: number;
}

export interface NewsEvent {
  id: string;
  teamId: Team["id"];
  headline: string;
  source: string;
  publishedAt: string;
  impactScore: number;
  summary: string;
}

export interface MarketSignal {
  id: string;
  teamId: Team["id"];
  type: SignalType;
  severity: SignalSeverity;
  title: string;
  description: string;
  value: number;
  createdAt: string;
}

export interface MockBid {
  id: string;
  teamId: Team["id"];
  side: MockBidSide;
  stake: number;
  probabilityAtBid: number;
  potentialReturn: number;
  status: MockBidStatus;
  createdAt: string;
}

export interface UserWatchlistItem {
  id: string;
  teamId: Team["id"];
  addedAt: string;
  alertThreshold?: number;
  notes?: string;
}

export interface TeamMarketSnapshot {
  team: Team;
  market: TeamMarketData;
}
