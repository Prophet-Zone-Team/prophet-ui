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

export type MatchOutcomeSide = "home" | "draw" | "away";

export type TradeEntityType = "team" | "game";

export type BidTradeSide = "buy" | "sell";

export type TradingOrderType = "GTC" | "GTD" | "FOK" | "FAK";

export type TradingEligibilityStatus =
  | "unknown"
  | "eligible"
  | "blocked_region"
  | "close_only_region"
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

export interface DepositWalletCheckResponse {
  walletAddress: string;
  deployed: boolean;
  status: Extract<DepositWalletStatus, "deployed" | "derived" | "error">;
  checkedAt: string;
  error?: string;
  source?: "relayer" | "onchain";
}

export interface DepositWalletDeployResponse {
  walletAddress: string;
  status: DepositWalletStatus;
  checkedAt: string;
  transactionId?: string;
  transactionHash?: string;
  error?: string;
}

export interface ClobHealthResponse {
  reachable: boolean;
  host: string;
  checkedAt: string;
  error?: string;
}

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
  sessionId?: string;
  userId: string;
  walletAddress: string;
  funderAddress?: string;
  /** Reserved for future private account API; mirrors funderAddress lifecycle. */
  privateAccountAddress?: string;
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
  setupAllowances?: TradingSetupAllowances;
  setupAllowancesCheckedAt?: string;
  authenticatedAt?: string;
  createdAt: string;
  expiresAt?: string;
}

export interface TradingSetupAllowances {
  conditionalTokens?: number;
  exchange?: number;
  negRiskExchange?: number;
  negRiskAdapter?: number;
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

export interface UserOrderFundingCheck {
  balance: "pass" | "fail" | "unknown";
  allowance: "pass" | "fail" | "unknown";
  balanceDetail: string;
  allowanceDetail: string;
}

export interface UserTradingBalancesResponse {
  balances?: UserBalanceSnapshot;
  funding?: UserOrderFundingCheck;
  updatedAt: string;
}

/** Setup-only readiness; balances come from `/api/trading/balances`. */
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
  logoUrl?: string;
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
  /** Polymarket event/market slug for trade deep links. */
  slug?: string;
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
  closed?: boolean;
  negRisk: boolean;
  tickSize: "0.1" | "0.01" | "0.001" | "0.0001";
  minOrderSize?: number;
  fee?: PolymarketFeeDetails;
  fixtureEventSlug?: string;
  marketKind?: "outright" | "moneyline";
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

export interface MarketTopHolder {
  proxyWallet: string;
  amount: number;
  outcomeIndex: number;
  asset: string;
  name?: string;
  pseudonym?: string;
  displayUsernamePublic?: boolean;
  profileImage?: string;
  profileImageOptimized?: string;
}

export interface MarketTopHolderGroup {
  token: string;
  holders: MarketTopHolder[];
}

export interface MarketTradeRecord {
  proxyWallet: string;
  side: "BUY" | "SELL";
  asset: string;
  conditionId: string;
  size: number;
  price: number;
  timestamp: number;
  outcome: string;
  outcomeIndex: number;
  name?: string;
  pseudonym?: string;
  transactionHash?: string;
}

export interface MarketPositionRecord {
  proxyWallet: string;
  name?: string;
  asset: string;
  conditionId: string;
  avgPrice: number;
  size: number;
  currPrice: number;
  currentValue: number;
  cashPnl: number;
  outcome: string;
  outcomeIndex: number;
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

export type WorldCupMatchStatus = "scheduled" | "live" | "finished" | "postponed" | "cancelled" | "unknown";

export interface MatchOddsOutcome {
  label: string;
  decimalOdds?: number;
  impliedProbability?: number;
  bookmaker?: string;
  lastUpdated?: string;
}

export interface MatchOddsSummary {
  source: "api-football" | "the-odds-api" | "polymarket" | "none";
  status: "live" | "cached" | "unavailable";
  outcomes: MatchOddsOutcome[];
  lastUpdated?: string;
}

export interface FreshnessMeta {
  source: string;
  status: "live" | "cached" | "stale" | "unavailable";
  lastUpdated?: string;
  ageMinutes?: number;
}

export interface PolymarketFixtureMoneylineOutcome {
  side: MatchOutcomeSide;
  label: string;
  tokenId?: string;
  noTokenId?: string;
  conditionId?: string;
  probability: number;
  volume?: number;
  yesAsk?: number;
  yesBid?: number;
  noAsk?: number;
  noBid?: number;
  fee?: PolymarketFeeDetails;
}

export type FixtureMarketCategory = "lines" | "exact_score" | "halftime";

export type FixtureSportsMarketType =
  | "moneyline"
  | "spread"
  | "total"
  | "btts"
  | "exact_score"
  | "halftime";

export type FixtureOutcomeSide =
  | MatchOutcomeSide
  | "over"
  | "under"
  | "yes"
  | "no";

export interface FixtureMarketOutcome {
  id: string;
  marketType: FixtureSportsMarketType;
  category: FixtureMarketCategory;
  label: string;
  side?: FixtureOutcomeSide;
  line?: number;
  probability: number;
  price: number;
  volume?: number;
  tokenId?: string;
  noTokenId?: string;
  conditionId?: string;
  yesAsk?: number;
  yesBid?: number;
  noAsk?: number;
  noBid?: number;
  fee?: PolymarketFeeDetails;
  acceptingOrders?: boolean;
}

export interface FixtureLineOption {
  key: string;
  label: number;
}

export interface FixtureMarketGroup {
  type: FixtureSportsMarketType;
  title: string;
  volume?: number;
  /** Display labels for line tabs. Prefer `lineOptionKeys` when keys must be unique. */
  lineOptions?: number[];
  lineOptionKeys?: FixtureLineOption[];
  defaultLine?: number;
  defaultLineKey?: string;
  outcomesByLine?: Record<string, FixtureMarketOutcome[]>;
  outcomes: FixtureMarketOutcome[];
}

export interface PolymarketFixtureMarketsData {
  lines: FixtureMarketGroup[];
  exactScores: FixtureMarketOutcome[];
  halftime: FixtureMarketOutcome[];
}

export interface GameFixtureMarketsSnapshot {
  matchId: string;
  lines: FixtureMarketGroup[];
  exactScores: FixtureMarketOutcome[];
  halftime: FixtureMarketOutcome[];
  freshness: FreshnessMeta;
}

export interface PolymarketFixtureMetadata {
  eventId: string;
  slug: string;
  league?: string;
  volume: number;
  volume24hr?: number;
  closed?: boolean;
  moneyline: {
    conditionId?: string;
    acceptingOrders: boolean;
    outcomes: PolymarketFixtureMoneylineOutcome[];
  };
  fixtureMarkets?: PolymarketFixtureMarketsData;
}

export interface WorldCupMatch {
  id: string;
  matchId?: number;
  eventId?: string;
  stage:
    | "GROUP"
    | "R32"
    | "R16"
    | "QF"
    | "SF"
    | "THIRD_PLACE"
    | "FINAL"
    | "EXTERNAL";
  group?: string;
  homeTeamId?: Team["id"];
  awayTeamId?: Team["id"];
  homeSeed?: string;
  awaySeed?: string;
  homeDisplayName?: string;
  awayDisplayName?: string;
  homeLogoUrl?: string;
  awayLogoUrl?: string;
  league?: string;
  homeScore?: number;
  awayScore?: number;
  status: WorldCupMatchStatus;
  kickoffAt?: string;
  venue?: string;
  city?: string;
  marketMove?: number;
  odds?: MatchOddsSummary;
  /** Elapsed match time in seconds (API-Football live clock baseline for client timer). */
  liveElapsedSeconds?: number;
  /** Current match period from Polymarket sports WS (e.g. "1H", "2H", "HT"). */
  period?: string;
  freshness: FreshnessMeta;
  polymarket?: PolymarketFixtureMetadata;
}

export interface GameMarketOutcome {
  side: MatchOutcomeSide;
  label: string;
  probability: number;
  change24h?: number;
  volume?: number;
  tokenId?: string;
  noTokenId?: string;
  conditionId?: string;
  yesAsk?: number;
  yesBid?: number;
  noAsk?: number;
  noBid?: number;
  fee?: PolymarketFeeDetails;
}

export interface GameMarketSnapshot {
  match: WorldCupMatch;
  homeTeamId?: Team["id"];
  awayTeamId?: Team["id"];
  outcomes: GameMarketOutcome[];
  market: {
    volume: number;
    acceptingOrders: boolean;
    closed?: boolean;
    source: string;
    freshness: FreshnessMeta;
  };
}

export interface GameProbabilityHistoryPoint {
  matchId: string;
  outcome: MatchOutcomeSide;
  timestamp: string;
  probability: number;
}

export interface GameMatchMinuteHistoryPoint {
  matchId: string;
  minute: number;
  minuteLabel: string;
  elapsedSeconds?: number;
  home: number;
  draw: number;
  away: number;
}

export interface GameFixtureChartPoint {
  matchId: string;
  timestamp: string;
  label: string;
  elapsedSeconds?: number;
  home: number;
  draw: number;
  away: number;
}

export interface GameFixtureBinaryChartPoint {
  matchId: string;
  timestamp: string;
  label: string;
  elapsedSeconds?: number;
  primary: number;
  secondary: number;
}

export type GameFixtureChartTimeRange = "1H" | "1D" | "1W" | "1M" | "all";

export type FixtureChartKind = "moneyline" | "halftime" | "total" | "spread";

export interface GameMatchChartEvent {
  elapsedSeconds: number;
  side: "home" | "away";
  type: "goal";
}

export type SearchResultType = "team" | "match" | "news" | "market" | "path";

export interface SearchResult {
  id: string;
  type: SearchResultType;
  title: string;
  subtitle?: string;
  href: string;
  score: number;
  metadata?: Record<string, string | number | boolean | undefined>;
}

export type FinishType = "GROUP_WINNER" | "RUNNER_UP" | "BEST_THIRD";

export type KnockoutRound = "R32" | "R16" | "QF" | "SF" | "FINAL";

export type PathMode = "GENERAL" | "SCENARIO";

export interface PathScenarioResolution {
  status: "general" | "resolved";
  qualifiedThirdGroups: string[];
  allocationOptionIds: number[];
  assignments: Record<string, string[]>;
  exactAssignments?: Record<string, string>;
}

export interface OpponentPossibility {
  teamId: Team["id"];
  teamName: string;
  zhName?: string;
  possibleRounds: KnockoutRound[];
  earliestRound: KnockoutRound;
}

export interface RoundOpponentSummary {
  round: KnockoutRound;
  matchIds: number[];
  possibleOpponentTeamIds: Team["id"][];
  possibleOpponentTeams: OpponentPossibility[];
  impossibleOpponentTeamIds: Team["id"][];
}

export interface PathQuery {
  teamId: string;
  finishType: FinishType;
  mode: PathMode;
  scenario?: {
    qualifiedThirdGroups?: string[];
    exactGroupPlacements?: Record<string, {
      first?: string;
      second?: string;
      third?: string;
    }>;
  };
}

export interface PathResult {
  teamId: Team["id"];
  teamCode: string;
  teamName: string;
  group: string;
  seed: string;
  finishType: FinishType;
  mode: PathMode;
  scenario?: PathScenarioResolution;
  rounds: RoundOpponentSummary[];
  earliestPossibleMeetingMap: Record<string, KnockoutRound | null>;
  neverMeetTeamIds: Team["id"][];
  pathMatchIds: number[];
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
  /** Elapsed minutes from API-Football fixture.status.elapsed when live. */
  elapsedMinutes?: number;
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
