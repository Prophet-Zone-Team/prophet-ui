/** Standard envelope from https://api_stg.prophet.zone/swagger */
export interface ProphetApiResponse<T = unknown> {
  code: number;
  data: T;
  message: string;
}

/** POST /v1/upload — uploaded asset URL */
export interface ProphetUploadData {
  url: string;
}

/** GET /v1/polymarket/stats — aggregate World Cup market stats */
export interface ProphetGetPolymarketStatsData {
  volume?: string;
  oneDayPriceChange?: string;
  oneDayPriceChangeTeam?: string;
}

/** GET /v1/game/winner-probability — World Cup winner probabilities by team */
export interface ProphetWinnerProbabilityItem {
  team: string;
  probability: string;
}

export type ProphetGetWinnerProbabilityData = ProphetWinnerProbabilityItem[];

export interface ProphetPolyMarketTeam {
  logo?: string;
  name?: string;
}

export interface ProphetPolyMarketMarket {
  slug?: string;
  groupItemTitle?: string;
  outcomes?: string[] | string;
  prices?: string[];
  outcomePrices?: string;
  volume?: number | string;
  clobTokenIds?: string;
  acceptingOrders?: boolean;
  negRisk?: boolean;
  conditionId?: string;
  oneHourPriceChange?: number | string;
  oneDayPriceChange?: number | string;
  oneWeekPriceChange?: number | string;
  oneMonthPriceChange?: number | string;
}

export interface ProphetWorldCupTeam {
  id?: number;
  code?: string;
  continent?: string;
  country?: string;
  logo?: string;
  name?: string;
}

export interface ProphetPolyMarketGameItem {
  id?: number;
  event_id?: string;
  gameId?: number;
  home_score?: number;
  away_score?: number;
  slug?: string;
  title?: string;
  icon?: string;
  image?: string;
  start_time?: string;
  volume?: string;
  active?: number;
  archived?: number;
  closed?: number;
  status?: number;
  teams?: ProphetPolyMarketTeam[] | null;
  markets?: ProphetPolyMarketMarket[] | null;
}

export interface ProphetGetGamesData {
  list?: ProphetPolyMarketGameItem[];
}

/** GET /v1/related-games — related Polymarket games for comma-separated team names */
export type ProphetGetRelatedGamesData = ProphetPolyMarketGameItem[];

/** GET /v1/game/group-matches — group stage fixtures for a group code */
export type ProphetGetGroupMatchesData = ProphetPolyMarketGameItem[];

/** GET /v1/game/group — group standings, winner market, and fixtures */
export interface ProphetGroupDetailStanding {
  id: number;
  group_code: string;
  group_name: string;
  team_id: number;
  team_name: string;
  team_logo: string;
  rank: number;
  points: number;
  played: number;
  win: number;
  draw: number;
  lose: number;
  goals_for: number;
  goals_against: number;
  goals_diff: number;
  source_update_at: number;
}

export interface ProphetGroupWinnerEvent {
  id?: string;
  slug?: string;
  active?: boolean;
  closed?: boolean;
  archived?: boolean;
  volume?: string;
  markets?: ProphetPolyMarketMarket[] | null;
}

export interface ProphetGetGroupData {
  group_code: string;
  standings: ProphetGroupDetailStanding[];
  winner_event?: ProphetGroupWinnerEvent;
  matches: ProphetPolyMarketGameItem[];
}

/** GET /v1/games/result — finished games for a team */
export interface ProphetTeamGameResult {
  home_team: string;
  away_team: string;
  home_score: number;
  away_score: number;
  start_time: number;
}

export interface ProphetGetTeamGameResultsData {
  list: ProphetTeamGameResult[] | null;
}

/** GET /v1/team/lineup — expected starting XI for a team */
export interface ProphetTeamLineupPlayer {
  id: number;
  name: string;
  number?: number;
  pos?: string;
  grid?: string;
}

export interface ProphetTeamLineupStarter {
  player: ProphetTeamLineupPlayer;
}

export interface ProphetTeamLineupEntry {
  team_id?: number;
  team_name?: string;
  match_time?: number;
  formation?: string;
  coach?: string;
  startXIs?: ProphetTeamLineupStarter[] | null;
}

export type ProphetGetTeamLineupData = ProphetTeamLineupEntry[];

/** GET /v1/teams-condition — team(s) per Polymarket condition id */
export interface ProphetTeamsConditionTeam {
  id?: number;
  name: string;
  logo?: string;
  ordering?: string;
}

export type PortfolioMarketKind = "team" | "game" | "group";

export interface ProphetTeamsConditionEntry {
  teams: ProphetTeamsConditionTeam[];
  slug: string;
  question?: string;
  main_event_title?: string;
  event_title?: string;
  icon?: string;
  marketKind?: PortfolioMarketKind;
}

export type ProphetGetTeamsConditionData = Record<
  string,
  ProphetTeamsConditionEntry
>;

/** Full Gamma-compatible market embedded in GET /v1/game events[]. */
export interface ProphetPolyMarketDetailMarket extends ProphetPolyMarketMarket {
  acceptingOrders?: boolean;
  clobTokenIds?: string;
  conditionId?: string;
  negRisk?: boolean;
  volume?: number | string;
  sportsMarketType?: string;
  question?: string;
  oneHourPriceChange?: number | string;
  oneDayPriceChange?: number | string;
  oneWeekPriceChange?: number | string;
  oneMonthPriceChange?: number | string;
}

/** Parsed sibling event from GET /v1/game `events[]` JSON strings. */
export interface ProphetPolyMarketEvent {
  id?: string | number;
  slug?: string;
  title?: string;
  markets?: ProphetPolyMarketDetailMarket[];
}

/** Single game detail from GET /v1/game */
export interface ProphetPolyMarketGameDetail extends ProphetPolyMarketGameItem {
  events?: (string | ProphetPolyMarketEvent)[];
  tracked?: boolean;
}

/** GET /v1/game/statistics — raw `data` envelope (statistics is a JSON string). */
export interface ProphetGetGameStatisticsData {
  statistics?: string;
}

/** Single odds value from GET /v1/game/odds bookmaker bets. */
export interface ProphetGameOddsValue {
  value: string;
  odd: string;
}

/** Bet group within a bookmaker odds entry. */
export interface ProphetGameOddsBet {
  id: number;
  name: string;
  values: ProphetGameOddsValue[];
}

/** Bookmaker odds entry from GET /v1/game/odds. */
export interface ProphetGameOddsBookmaker {
  name: string;
  bets: ProphetGameOddsBet[];
}

/** GET /v1/game/odds — bookmaker odds grouped by market category. */
export interface ProphetGetGameOddsData {
  Moneyline?: ProphetGameOddsBookmaker[];
  Totals?: ProphetGameOddsBookmaker[];
  Spreads?: ProphetGameOddsBookmaker[];
  HalftimeResults?: ProphetGameOddsBookmaker[];
  ExactScore?: ProphetGameOddsBookmaker[];
}

export type ProphetGameStatisticValue = number | string | null;

export interface ProphetGameStatisticItem {
  type: string;
  value: ProphetGameStatisticValue;
}

export interface ProphetGameStatisticsTeam {
  id: number;
  name: string;
}

export interface ProphetGameStatisticsTeamBlock {
  team: ProphetGameStatisticsTeam;
  statistics: ProphetGameStatisticItem[];
}

export interface ProphetGameStatisticsEvent {
  time: {
    elapsed: number;
    extra: number | null;
  };
  team: ProphetGameStatisticsTeam;
  type: string;
  detail: string;
}

/** Live match clock status from the parsed `statistics` JSON string. */
export interface ProphetGameStatisticsStatus {
  short?: string;
  long?: string;
  elapsed?: number;
  extra?: number | null;
}

/** Parsed payload from the `statistics` JSON string. */
export interface ProphetGameStatisticsPayload {
  status?: ProphetGameStatisticsStatus;
  statistics: ProphetGameStatisticsTeamBlock[];
  events: ProphetGameStatisticsEvent[];
}

/** Sibling event slugs for client-side trading metadata lazy load. */
export interface ProphetGameSiblingEventSlugs {
  main: string;
  moreMarkets?: string;
  halftime?: string;
  exactScore?: string;
}

export interface ProphetLoginRequest {
  address: string;
  /** Required when logging in via Privy email or Google. */
  email?: string;
  /** NEAR account ID when logging in via NEAR wallet. */
  near_address?: string;
  referral_code?: string;
}

export interface ProphetApplyReferralRequest {
  referral_code: string;
}

export interface ProphetLoginReferral {
  referral_code: string;
  referral_link: string;
  tier: string; // e.g., "standard"
  kickback_rate: string; // as a decimal string, e.g., "0.1"
  status: string; // e.g., "active"
  referred_user_count: number;
  total_referred_volume_usdc: string;
  total_referral_earnings_usdc: string;
  claimable_balance_usdc: string;
  claimed_balance_usdc: string;
  has_bound_referral: boolean;
  bound_referral_code: string;
}

/**
 * Why redeclare a ProphetReferral type?
 * To prevent issues if the login API no longer returns referral details in the future.
 */
export interface ProphetReferral extends ProphetLoginReferral {
}

export type ProphetReferralClaimSummary = ProphetLoginReferral;

export interface ProphetReferralClaimData {
  amount_usdc: string;
  claim_id: number;
  summary: ProphetReferralClaimSummary;
}

export interface ProphetReferralInviteItem {
  bound_at: string;
  claimable_reward_usdc: string;
  claimed_reward_usdc: string;
  completed_order_count: number;
  last_reward_at: string;
  referral_code: string;
  referred_address: string;
  referred_user_id: number;
  total_order_count: number;
  total_referral_earnings_usdc: string;
  total_referred_volume_usdc: string;
  event_slug: string;
  event_title: string;
}

export interface ProphetReferralInvitesData {
  list: ProphetReferralInviteItem[];
  page: number;
  page_size: number;
  total: number;
}

export interface ProphetReferralInvitesParams {
  page: number;
  page_size: number;
}

export interface ProphetLoginData {
  account_id?: number;
  token?: string;
  referral?: ProphetLoginReferral;
}

export interface ProphetBindTelegramRequest {
  tg_user_id: number;
}

/** GET /v1/user/bind/telegram/status */
export interface ProphetGetTelegramBindStatusData {
  bound?: boolean;
  tg_user_id?: number;
}

export type ProphetTrackCategory = "team" | "game";

export interface ProphetTrackRequest {
  category: ProphetTrackCategory;
  slug?: string;
  team_name?: string;
}

export interface ProphetCancelTrackRequest {
  slug: string;
}

export type ProphetReportTransactionType =
  | "buy"
  | "sell"
  | "redeem"
  | "withdraw"
  | "deposit"
  | "claim";

export type ProphetReportOrderType = "maker" | "taker";

export type ProphetReportOrderStatus = "completed" | "failed" | "cancelled";

/** Market context for POST /v1/user/transaction when type is buy, sell, or redeem. */
export interface ProphetReportTransactionMarket {
  marketName?: string;
  price?: string;
  side?: string;
  slug?: string;
  teamName?: string;
}

/** POST /v1/user/transaction — report trade; idempotent by tx_hash */
export interface ProphetReportTransactionRequest {
  amount: string;
  tx_hash?: string;
  type: ProphetReportTransactionType;
  market?: ProphetReportTransactionMarket;
  order_id?: string;
  order_type?: ProphetReportOrderType;
  order_status?: ProphetReportOrderStatus;
  order_value_usdc?: string;
  referral_code?: string;
}

export type ProphetUserTransactionKind =
  | "order"
  | "trade"
  | "deposit"
  | "withdraw"
  | "redeem";

export type ProphetUserTransactionTradeSide = "buy" | "sell";

/** Row from GET /v1/user/transactions (database.UserTransaction). */
export interface ProphetUserTransaction {
  amount?: string;
  created_at?: string;
  trade_create_at?: string;
  id?: number;
  market_name?: string;
  order_type?: ProphetReportOrderType;
  price?: string;
  side?: string;
  size?: string;
  slug?: string;
  source?: string;
  team_name?: string;
  trade_side?: ProphetUserTransactionTradeSide;
  tx_hash?: string;
  /** order | trade | deposit | withdraw | redeem (legacy rows may still use buy/sell). */
  type?: string;
  user_id?: number;
}

/** GET /v1/user/transactions — paginated user-reported trades */
export interface ProphetGetUserTransactionsData {
  list?: ProphetUserTransaction[];
  total?: number;
}

/** Team leg for strategy APIs (database.StrategyTeamItem). */
export interface ProphetStrategyTeamItem {
  order_id?: string | string[];
  amount?: string | string[];
  curr_price?: string;
  name?: string;
  price?: string | string[];
  slug?: string;
  /** Tournament leg status when provided by the API (unstart, ongoing, lose, win). */
  status?: string;
  to_win?: string;
  tx_hash?: string | string[];
}

/** Row from GET /v1/user/strategies (model.StrategyView). */
export interface ProphetStrategyView {
  created_at?: string;
  hit_return?: string;
  id?: number;
  name?: string;
  roi?: string;
  teams?: ProphetStrategyTeamItem[];
  value?: string;
}

/** GET /v1/user/strategies — all user strategies, newest first */
export interface ProphetGetUserStrategiesData {
  list?: ProphetStrategyView[];
}

/** POST /v1/user/strategy — submit strategy and record per-team transactions */
export interface ProphetSubmitStrategyRequest {
  name: string;
  teams: ProphetStrategyTeamItem[];
  value?: string;
  roi?: string;
  hit_return?: string;
}

/** Response data from POST /v1/user/strategy */
export interface ProphetSubmitStrategyData {
  strategy_id?: number;
}

/** Single team leg for POST /v1/user/strategy/item (model.StrategyTeamItemReq). */
export interface ProphetStrategyTeamItemReq {
  order_id: string;
  amount?: string;
  price?: string;
  slug?: string;
  name?: string;
  tx_hash?: string;
  curr_price?: string;
}

/** POST /v1/user/strategy/item — append order data to an existing strategy team leg */
export interface ProphetUpdateStrategyTeamRequest {
  strategy_id: number;
  team: ProphetStrategyTeamItemReq;
}

/** Lightweight row from GET /v1/user/tracks/list (bookmark state). */
export interface ProphetUserTrackListItem {
  id?: number;
  category?: ProphetTrackCategory;
  slug?: string;
  team_name?: string;
  user_id?: number;
}

export interface ProphetUserTrackMarket {
  slug?: string;
  groupItemTitle?: string;
  volume?: string;
  outcomePrices?: string;
  clobTokenIds?: string;
  acceptingOrders?: boolean;
  negRisk?: boolean;
  conditionId?: string;
  oneHourPriceChange?: string;
  oneDayPriceChange?: string;
  oneWeekPriceChange?: string;
  oneMonthPriceChange?: string;
}

export interface ProphetUserTrackLatestNews {
  title: string;
  score: number;
  matched_players: string[];
  url_to_image?: string;
}

export interface ProphetUserTrackNewsStat {
  news_count?: number;
  latest_news?: ProphetUserTrackLatestNews[] | string;
}

export interface ProphetUserTrackItem {
  track_id?: number;
  category?: ProphetTrackCategory;
  /** Top-attention ranking labels from GET /v1/user/tracks/top (e.g. "Most Popular"). */
  categories?: string[] | null;
  slug?: string;
  team_name?: string;
  volume?: string;
  probobility?: string;
  oneHourPriceChange?: string;
  oneDayPriceChange?: string;
  oneWeekPriceChange?: string;
  oneMonthPriceChange?: string;
  start_time?: string;
  goals?: number[] | null;
  team?: ProphetWorldCupTeam;
  markets?: ProphetUserTrackMarket[];
  attention?: number;
  fifa_rankings?: number[];
  team_news_stat?: ProphetUserTrackNewsStat | string;
  bid_amount?: string;
}

/** Response from GET /v1/user/tracks/top (public, Redis-cached). */
export interface ProphetTopTracksData {
  teams_tracks?: ProphetUserTrackItem[];
  game_tracks?: ProphetUserTrackItem[];
}

export interface ProphetAnalyticsCompetitiveness {
  id?: number;
  category?: string;
  group_name?: string;
  score?: number;
}

export interface ProphetAnalyticsRecommend {
  id?: number;
  category?: string;
  team?: string;
  reason?: string;
}

export interface ProphetAnalyticsTeamPowerRanking {
  group_name?: string;
  id?: number;
  path_difficulty_label?: string;
  path_difficulty_score?: string;
  rank?: number;
  recent_trend?: string;
  round_of_16_probability?: string;
  signal_status?: string;
  team_name?: string;
  title_probability?: string;
}

export interface ProphetAnalyticsTeamPathContext {
  team_name?: string;
  current_stage?: string;
  path_difficulty_label?: string;
  biggest_opponent_name?: string;
  biggest_opponent_round?: string;
}

export interface ProphetAnalyticsNewsArticle {
  id?: number;
  url?: string;
  source_id?: string;
  source_name?: string;
  author?: string;
  title?: string;
  description?: string;
  url_to_image?: string;
  published_at?: string;
  fetched_at?: string;
  language?: string;
  score?: number;
  impact_signal?: string;
  category?: string;
  reasons_json?: string;
  matched_teams_json?: string;
  matched_players_json?: string;
  updated_at?: string;
}

export interface ProphetGetAnalyticsNewsData {
  list?: ProphetAnalyticsNewsArticle[];
  total?: number;
}

export interface ProphetGetLatestAnalyticsNewsData {
  list?: ProphetAnalyticsNewsArticle[];
}

export interface ProphetGetTeamRelatedNewsData {
  list?: ProphetAnalyticsNewsArticle[];
}

export interface ProphetAnalyticsTeamMarket {
  slug?: string;
  groupItemTitle?: string;
  volume?: string;
  liquidity?: string;
  outcomePrices?: string;
  oneHourPriceChange?: string;
  oneDayPriceChange?: string;
  oneWeekPriceChange?: string;
  oneMonthPriceChange?: string;
  clobTokenIds?: string;
  acceptingOrders?: boolean;
  negRisk?: boolean;
  conditionId?: string;
  updatedAt?: string;
}

export interface ProphetGetTeamMarketNewsData {
  market?: ProphetAnalyticsTeamMarket;
  news?: ProphetAnalyticsNewsArticle[];
  total_news?: number;
}

export interface ProphetAnalyticsTopCategoryItem {
  category?: string;
  total?: number;
  percent?: number;
}

export interface ProphetAnalyticsNewsImpact {
  today_signal?: number;
  positive?: number;
  negative?: number;
  neutral?: number;
}

export interface ProphetAnalyticsMostAffectedTeamItem {
  id?: number;
  rank?: number;
  team?: string;
  articles?: number;
  net?: string;
  abs_impact?: string;
  positive?: number;
  negative?: number;
  high_impact?: number;
  updated_at?: string;
}

export interface ProphetGetNewsTopCategoryImpactData {
  top_categories?: ProphetAnalyticsTopCategoryItem[];
  impact?: ProphetAnalyticsNewsImpact;
  most_affected_teams?: ProphetAnalyticsMostAffectedTeamItem[];
}

export interface ProphetHeadToHeadFixture {
  fixture_date?: string;
  home_team_name?: string;
  away_team_name?: string;
  home_goals?: number;
  away_goals?: number;
  league_name?: string;
  season?: number;
  status_short?: string;
}

export interface ProphetGetHeadToHeadFixturesData {
  list?: ProphetHeadToHeadFixture[];
}

/** GET /v1/analytics/teams/stats — recent fixtures and strength per team */
export interface ProphetTeamStatsFixture {
  id: number;
  api_fixture_id: number;
  referee?: string;
  timezone?: string;
  fixture_date: string;
  fixture_timestamp: number;
  status_long?: string;
  status_short?: string;
  status_elapsed?: number;
  league_id?: number;
  league_name?: string;
  league_country?: string;
  season?: number;
  round?: string;
  home_team_id?: number;
  home_team_name?: string;
  away_team_id?: number;
  away_team_name?: string;
  home_goals: number;
  away_goals: number;
  slug?: string;
}

export interface ProphetTeamStatsStrengthDimension {
  key: string;
  label: string;
  score: number;
}

export interface ProphetTeamStatsStrength {
  score?: number;
  dimensions?: ProphetTeamStatsStrengthDimension[];
}

export interface ProphetTeamStatsInfo {
  name: string;
  recent_fixtures?: ProphetTeamStatsFixture[] | null;
  team_strength?: ProphetTeamStatsStrength;
}

export interface ProphetGetTeamDetailMatch {
  id: number;
  api_fixture_id: number;
  referee: string;
  timezone: string;
  fixture_date: string;
  fixture_timestamp: number;
  status_long: string;
  status_short: string;
  status_elapsed: number;
  league_id: number;
  league_name: string;
  league_country: string;
  season: number;
  round: string;
  home_team_id: number;
  home_team_name: string;
  away_team_id: number;
  away_team_name: string;
  home_goals: number;
  away_goals: number;
  updated_at: string;
}

export interface ProphetGetTeamDetailDimension {
  key: string;
  label: string;
  score: number;
}

export interface ProphetGetTeamDetailKeyStar {
  name: string;
  logo: string;
  position: string;
  club_name: string;
  expected_minutes: string;
  squad_probability: string;
  form_score: string;
  injury_status: number;
}

export interface ProphetGetTeamDetailNews {
  id: number;
  url: string;
  source_id: string;
  source_name: string;
  author: string;
  title: string;
  description: string;
  url_to_image: string;
  published_at: string;
  fetched_at: string;
  language: string;
  score: number;
  category: string;
  reasons_json: string;
  matched_teams_json: string;
  matched_players_json: string;
  updated_at: string;
}

export interface ProphetGetTeamDetailPeer {
  code: string;
  fifaRank: number;
  logo: string;
  name: string;
}

export interface ProphetGetTeamDetailNextMatch {
  id: number;
  slug?: string;
  api_fixture_id: number;
  referee: string;
  timezone: string;
  fixture_date: string;
  fixture_timestamp: number;
  status_long: string;
  status_short: string;
  status_elapsed: number;
  league_id: number;
  league_name: string;
  league_country: string;
  season: number;
  round: string;
  home_team_id: number;
  home_team_name: string;
  away_team_id: number;
  away_team_name: string;
  home_goals: number;
  away_goals: number;
  updated_at: string;
}

/** GET /v1/game/group-standings — group stage standings with market prices */
export interface ProphetGroupStandingTeam {
  team_id: number;
  team_name: string;
  team_logo: string;
  rank: number;
  points: number;
  played: number;
  win: number;
  draw: number;
  lose: number;
  goals_for: number;
  goals_against: number;
  goals_diff: number;
  source_update_at: number;
  outcomePrices?: string;
}

export interface ProphetGroupStandingGroup {
  group_code: string;
  group_name: string;
  teams: ProphetGroupStandingTeam[];
}

export interface ProphetGetGroupStandingsData {
  groups: ProphetGroupStandingGroup[];
}

export interface ProphetGetTeamDetailData {
  name: string;
  logo: string;
  best_finish: string;
  fifa_rank: number;
  group_name: string;
  recent_form: {
    result: string[];
    latest: string;
    matches: ProphetGetTeamDetailMatch[];
  };
  team_strength: {
    score: number;
    dimensions: ProphetGetTeamDetailDimension[];
  };
  team_key_stars: ProphetGetTeamDetailKeyStar[];
  news: ProphetGetTeamDetailNews[];
  team_peers: ProphetGetTeamDetailPeer[];
  titles: number;
  next_match: ProphetGetTeamDetailNextMatch | null;
  market_value: string;
}

/** POST /v1/analytics/track — supported product analytics event names */
export type ProphetAnalyticsTrackEventName =
  | "page_viewed"
  | "market_data_loaded"
  | "data_provider_failed"
  | "fallback_data_used"
  | "team_detail_clicked"
  | "quick_bid_clicked"
  | "login_clicked"
  | "wallet_connect_started"
  | "wallet_connected"
  | "wallet_connect_failed"
  | "section_viewed"
  | "team_card_impressed"
  | "chart_viewed"
  | "bid_area_viewed"
  | "winner_chart_range_changed"
  | "winner_chart_team_selected"
  | "chart_legend_toggled"
  | "market_tab_changed"
  | "track_clicked"
  | "track_added"
  | "track_removed"
  | "nav_clicked"
  | "details_clicked"
  | "eligibility_check_completed"
  | "order_ticket_opened"
  | "order_input_changed"
  | "order_preview_requested"
  | "order_preview_completed"
  | "order_confirm_clicked"
  | "order_submit_started"
  | "order_submit_succeeded"
  | "order_submit_failed"
  | "portfolio_viewed"
  | "track_page_viewed"
  | "tracked_team_revisited"
  | "share_clicked"
  | "copy_link_clicked";

export type ProphetAnalyticsTrackEnvironment =
  | "production"
  | "preview"
  | "local";

export type ProphetAnalyticsTrackSource = "client" | "server" | "worker";

/** POST /v1/analytics/track — product analytics event payload */
export interface ProphetAnalyticsTrackRequest {
  eventName: ProphetAnalyticsTrackEventName;
  eventId: string;
  anonymousId?: string;
  sessionId?: string;
  userIdHash?: string;
  walletHash?: string;
  path?: string;
  referrer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  deviceType?: string;
  browser?: string;
  os?: string;
  country?: string;
  region?: string;
  language?: string;
  appVersion?: string;
  commitSha?: string;
  environment?: ProphetAnalyticsTrackEnvironment;
  source?: ProphetAnalyticsTrackSource;
  clientTimestamp?: string;
  sessionStartedAt?: string;
  pageLoadedAt?: string;
  dataLoadedAt?: string;
  lastUpdated?: string;
  visibleStartedAt?: string;
  visibleMs?: number;
  latencyMs?: number;
  section?: string;
  sectionIndex?: number;
  visibleRatio?: number;
  impressionIndex?: number;
  itemPosition?: number;
  listName?: string;
  dedupeKey?: string;
  target?: string;
  label?: string;
  entrySource?: string;
  chartId?: string;
  fromRange?: string;
  toRange?: string;
  seriesKey?: string;
  visible?: boolean;
  teamId?: string;
  teamName?: string;
  teamCode?: string;
  sortKey?: string;
  volumeBucket?: string;
  marketStatus?: string;
  marketId?: string;
  outcomeId?: string;
  side?: string;
  price?: string;
  priceBucket?: string;
  sizeBucket?: string;
  amountBucket?: string;
  changedField?: string;
  eligibilityStatus?: string;
  walletType?: string;
  orderStatus?: string;
  failureReason?: string;
  errorCode?: string;
  stalePrice?: boolean;
  properties?: Record<string, unknown>;
}

/** POST /v1/analytics/track — deduplicated acceptance result */
export interface ProphetAnalyticsTrackData {
  accepted: boolean;
  duplicate: boolean;
}

/** POST /v1/analytics/track — batch event payload (list: 1-5 events) */
export interface ProphetAnalyticsTrackBatchRequest {
  list: ProphetAnalyticsTrackRequest[];
}

/** Winner activity prediction match pairing */
export interface WinnerPredictionMatchPair {
  teams: string[];
}

/** Winner activity prediction payload */
export interface WinnerPredictionPayload {
  champion_team: string;
  final_teams: WinnerPredictionMatchPair[];
  round_16_teams: WinnerPredictionMatchPair[];
  round_4_teams: WinnerPredictionMatchPair[];
  round_8_teams: WinnerPredictionMatchPair[];
}

/** GET /v1/activity/winner/records — submitted prediction record */
export interface WinnerActivityRecord {
  id: number;
  champion_team: string;
  create_time: string;
  prediction: WinnerPredictionPayload;
  status: number;
  twitter_url?: string;
}

/** GET /v1/activity/winner/records */
export interface WinnerActivityRecordsData {
  list: WinnerActivityRecord[];
}

/** GET /v1/activity/winner/stats */
export interface WinnerActivityStatsData {
  guess_chances: number;
  used_chances: number;
  available_chances: number;
  total_trade_usdc: string;
  buy_trade_usdc: string;
  sell_trade_usdc: string;
}

/** POST /v1/activity/winner */
export interface SubmitWinnerActivityRequest {
  prediction: WinnerPredictionPayload;
  twitter_url: string;
}
