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
  | "heating_up"
  | "cooling_down"
  | "volume_spike"
  | "odds_mismatch"
  | "sentiment_driven"
  | "news_impact"
  | "overheated"
  | "quiet_accumulation";

export type OrderOutcomeSide = "yes" | "no";

export type BidTradeSide = "buy" | "sell";

export type TradingOrderType = "GTC" | "FOK" | "FAK";

export type TradingEligibilityStatus =
  | "unknown"
  | "eligible"
  | "blocked_region"
  | "unsupported_account"
  | "needs_wallet"
  | "error";

export type TradingCredentialStorage = "session" | "encrypted_server" | "none";

export type DepositWalletStatus =
  | "unknown"
  | "derived"
  | "deploying"
  | "deployed"
  | "relayer_unconfigured"
  | "error";

export type UserOrderStatus =
  | "previewed"
  | "submitted"
  | "open"
  | "filled"
  | "partially_filled"
  | "cancelled"
  | "rejected"
  | "error";

export interface TradingUserSession {
  userId: string;
  walletAddress: string;
  funderAddress?: string;
  depositWalletStatus?: DepositWalletStatus;
  depositWalletCheckedAt?: string;
  depositWalletTransactionId?: string;
  depositWalletTransactionHash?: string;
  depositWalletError?: string;
  signatureType: number;
  eligibilityStatus: TradingEligibilityStatus;
  eligibilityCheckedAt?: string;
  eligibilityCountry?: string;
  eligibilityRegion?: string;
  eligibilityReason?: string;
  createdAt: string;
  expiresAt?: string;
}

export interface UserTradingCredentialStatus {
  hasClobCredentials: boolean;
  derivedAt?: string;
  storage: TradingCredentialStorage;
}

export interface UserBalanceSnapshot {
  walletAddress: string;
  funderAddress?: string;
  usdcAvailable?: number;
  usdcAllowance?: number;
  clobUsdcAvailable?: number;
  clobUsdcAllowance?: number;
  onchainUsdcAvailable?: number;
  onchainUsdcAllowance?: number;
  balanceSource?: "clob" | "onchain" | "mixed";
  conditionalTokenBalance?: number;
  conditionalTokenAllowance?: number;
  updatedAt: string;
  error?: string;
}

export interface AccountReadinessCheck {
  id:
    | "wallet"
    | "eligibility"
    | "signature_type"
    | "funder"
    | "deposit_wallet"
    | "clob_credentials"
    | "balance"
    | "allowance";
  label: string;
  status: "pass" | "fail" | "unknown";
  detail: string;
}

export interface UserTradingReadiness {
  ready: boolean;
  session?: TradingUserSession;
  credentials: UserTradingCredentialStatus;
  balances?: UserBalanceSnapshot;
  checks: AccountReadinessCheck[];
  updatedAt: string;
}

export interface UserOrderPreview {
  marketId?: string;
  tokenId: string;
  teamId: Team["id"];
  outcome: OrderOutcomeSide;
  side: BidTradeSide;
  orderType: TradingOrderType;
  limitPrice: number;
  size: number;
  estimatedCost: number;
  estimatedTakerFee?: number;
  estimatedTotalCost?: number;
  estimatedProceeds?: number;
  potentialOutcome: number;
  tickSize: PolymarketMarketMetadata["tickSize"];
  negRisk?: boolean;
  stale: boolean;
  warnings: string[];
}

export interface UserOrderRecord {
  id: string;
  userId: string;
  walletAddress: string;
  funderAddress?: string;
  clobOrderId?: string;
  status: UserOrderStatus;
  preview: UserOrderPreview;
  response?: unknown;
  submittedAt?: string;
  updatedAt: string;
  error?: string;
}

export interface UserTradingAuditEvent {
  id: string;
  userId: string;
  walletAddress: string;
  eventType:
    | "session_created"
    | "credentials_derived"
    | "order_submitted"
    | "order_submit_failed"
    | "order_status_refreshed"
    | "order_cancel_requested"
    | "order_cancel_failed";
  orderId?: string;
  clobOrderId?: string;
  detail?: Record<string, unknown>;
  createdAt: string;
}

export interface UserPositionRecord {
  proxyWallet: string;
  asset: string;
  conditionId: string;
  size: number;
  avgPrice: number;
  initialValue: number;
  currentValue: number;
  cashPnl: number;
  percentPnl: number;
  totalBought: number;
  realizedPnl: number;
  percentRealizedPnl: number;
  curPrice: number;
  redeemable: boolean;
  mergeable: boolean;
  title: string;
  slug: string;
  icon?: string;
  eventSlug?: string;
  outcome: string;
  outcomeIndex: number;
  oppositeOutcome?: string;
  oppositeAsset?: string;
  endDate?: string;
  negativeRisk: boolean;
}

export interface Team {
  id: string;
  name: string;
  code: string;
  region: TeamRegion;
  group?: string;
  fifaRank?: number;
  aliases?: string[];
  qualifiedStatus?: "qualified" | "candidate" | "playoff_pending";
  apiFootballTeamId?: number;
  polymarketMarketSlug?: string;
}

export type TeamFootballMetadataStatus = "curated" | "partial" | "pending";

export type TeamFootballMetadataConfidence = "high" | "medium" | "low";

export interface TeamKeyPlayer {
  name: string;
  position: string;
  club?: string;
  note?: string;
}

export interface TeamFootballMetadata {
  teamId: Team["id"];
  fifaRank?: number;
  squadValue?: number;
  squadValueCurrency?: "EUR" | "USD";
  worldCupBestFinish: string;
  worldCupTitles: number;
  group?: string;
  groupPeers: Team["id"][];
  keyPlayers: TeamKeyPlayer[];
  source: string;
  updatedAt: string;
  status: TeamFootballMetadataStatus;
  confidence: TeamFootballMetadataConfidence;
}

export interface TeamMarketData {
  teamId: Team["id"];
  probability: number;
  change24h: number;
  change7d: number;
  volume: number;
  volume24h?: number;
  liquidity?: number;
  sentiment: MarketSentiment;
  bookmakerImpliedProbability: number;
  updatedAt: string;
  polymarket?: PolymarketMarketMetadata;
}

export interface MarketUniverseMeta {
  provider: "polymarket";
  marketCount: number;
  trackedMarketCount: number;
  canonicalTeamCount: number;
  totalVolume: number;
  volume24h: number;
  liquidity: number;
  missingTeamIds: Team["id"][];
  unmappedMarketTitles: string[];
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
  fee?: PolymarketFeeDetails;
  tokens: {
    yes?: PolymarketOutcomeToken;
    no?: PolymarketOutcomeToken;
  };
}

export interface PolymarketFeeDetails {
  rate: number;
  exponent: number;
  takerOnly: boolean;
  makerBaseFee?: number;
  takerBaseFee?: number;
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
  shortDescription: string;
  explanation: string;
  confidence: number;
  dataPoints: MarketSignalDataPoint[];
  createdAt: string;
}

export interface MarketSignalDataPoint {
  label: string;
  value: string;
  tone?: "positive" | "negative" | "neutral";
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
  goalsFor?: number;
  goalsAgainst?: number;
  result?: "W" | "D" | "L";
  isWorldCupFixture?: boolean;
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
