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
  | "news-impact"
  | "sentiment-shift";

export type MockBidSide = "yes" | "no";

export type BidExecutionMode = "mock" | "real";

export type BidTradeSide = "buy" | "sell";

export type MockBidStatus = "draft" | "simulated" | "cancelled";

export type MockBidOrderType = "GTC" | "GTD" | "FOK" | "FAK";

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
  polymarket?: PolymarketMarketMetadata;
}

export interface PolymarketMarketMetadata {
  marketId?: string;
  conditionId?: string;
  question?: string;
  slug?: string;
  acceptingOrders: boolean;
  negRisk: boolean;
  tickSize: "0.1" | "0.01" | "0.001" | "0.0001";
  minOrderSize?: number;
  tokens: {
    yes?: PolymarketOutcomeToken;
    no?: PolymarketOutcomeToken;
  };
}

export interface PolymarketOutcomeToken {
  tokenId: string;
  outcome: string;
  price?: number;
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
  url?: string;
  language?: string;
  matchedKeywords?: string[];
}

export interface NewsArticle {
  id: string;
  title: string;
  url: string;
  source?: string;
  publishedAt?: string;
  language?: string;
  matchedTeamIds: Team["id"][];
  matchedKeywords: string[];
  snippet?: string;
}

export type NewsImpactConfidence = "low" | "medium";

export interface NewsImpactSignal {
  type: "news_impact";
  teamId: Team["id"];
  marketMove: number;
  relatedArticles: NewsArticle[];
  oneLineSummary: string;
  explanation: string;
  confidence: NewsImpactConfidence;
  disclaimer: "Correlation, not causation.";
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
  tradeSide?: BidTradeSide;
  executionMode?: BidExecutionMode;
  stake: number;
  probabilityAtBid: number;
  potentialReturn: number;
  status: MockBidStatus;
  createdAt: string;
  limitPrice?: number;
  shareSize?: number;
  orderType?: MockBidOrderType;
  simulatedOrderId?: string;
  simulatedTokenId?: string;
  estimatedCost?: number;
  potentialOutcome?: number;
  expiresAt?: string;
  displayAddress?: string;
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

export type FootballContextSource = "api-football" | "none";

export type FootballContextStatus = "live" | "missing_api_key" | "unavailable";

export interface ApiFootballTeamProfile {
  teamId: Team["id"];
  apiFootballTeamId: number;
  name: string;
  code?: string;
  country: string;
  founded?: number;
  logoUrl?: string;
  venue?: {
    name?: string;
    city?: string;
    capacity?: number;
    surface?: string;
    imageUrl?: string;
  };
  updatedAt: string;
}

export type ApiFootballFixtureStatus = "scheduled" | "live" | "finished" | "postponed" | "cancelled" | "unknown";

export interface ApiFootballFixtureContext {
  fixtureId: number;
  teamId: Team["id"];
  opponentName: string;
  opponentLogoUrl?: string;
  homeAway: "home" | "away" | "neutral";
  leagueName?: string;
  leagueRound?: string;
  venueName?: string;
  city?: string;
  kickoffAt: string;
  status: ApiFootballFixtureStatus;
  updatedAt: string;
}

export interface ApiFootballSquadPlayer {
  playerId: number;
  name: string;
  age?: number;
  number?: number;
  position?: string;
  photoUrl?: string;
}

export interface ApiFootballInjuryContext {
  playerId?: number;
  playerName: string;
  playerPhotoUrl?: string;
  reason?: string;
  type?: string;
  fixtureId?: number;
  fixtureDate?: string;
  leagueName?: string;
  updatedAt: string;
}

export interface ApiFootballStandingContext {
  leagueId?: number;
  leagueName?: string;
  season?: number;
  rank?: number;
  group?: string;
  points?: number;
  played?: number;
  wins?: number;
  draws?: number;
  losses?: number;
  goalsFor?: number;
  goalsAgainst?: number;
  form?: string;
  status?: string;
  description?: string;
  updatedAt: string;
}

export interface ApiFootballOddContext {
  fixtureId: number;
  bookmaker?: string;
  marketName?: string;
  selectionName?: string;
  odd?: string;
  updatedAt: string;
}

export interface ApiFootballDataIssue {
  dimension: "fixtures" | "squad" | "injuries" | "standings" | "odds";
  message: string;
  capturedAt: string;
}

export interface ApiFootballTeamContext {
  profile: ApiFootballTeamProfile;
  fixtures: ApiFootballFixtureContext[];
  squad: ApiFootballSquadPlayer[];
  injuries: ApiFootballInjuryContext[];
  standings: ApiFootballStandingContext[];
  odds: ApiFootballOddContext[];
  dataIssues: ApiFootballDataIssue[];
}

export interface FootballContextMeta {
  source: FootballContextSource;
  status: FootballContextStatus;
  teamCount: number;
  lastUpdated?: string;
  error?: string;
}
