/** Standard envelope from https://api_stg.prophet.zone/swagger */
export interface ProphetApiResponse<T = unknown> {
  code: number;
  data: T;
  message: string;
}

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

/** GET /v1/teams-condition — team(s) per Polymarket condition id */
export interface ProphetTeamsConditionTeam {
  name: string;
  ordering?: string;
}

export type ProphetGetTeamsConditionData = Record<
  string,
  ProphetTeamsConditionTeam[]
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

/** Parsed payload from the `statistics` JSON string. */
export interface ProphetGameStatisticsPayload {
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
}

export interface ProphetLoginData {
  account_id?: number;
  token?: string;
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
  | "withdraw"
  | "deposit";

/** Market context for POST /v1/user/transaction when type is buy or sell. */
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
  tx_hash: string;
  type: ProphetReportTransactionType;
  market?: ProphetReportTransactionMarket;
}

/** Row from GET /v1/user/transactions (database.UserTransaction). */
export interface ProphetUserTransaction {
  amount?: string;
  created_at?: string;
  id?: number;
  market_name?: string;
  price?: string;
  side?: string;
  slug?: string;
  team_name?: string;
  tx_hash?: string;
  type?: string;
  user_id?: number;
}

/** GET /v1/user/transactions — paginated user-reported trades */
export interface ProphetGetUserTransactionsData {
  list?: ProphetUserTransaction[];
  total?: number;
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

export interface ProphetUserTrackItem {
  track_id?: number;
  category?: ProphetTrackCategory;
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
  high_impact?: number;
  positive?: number;
  negative?: number;
  neutral?: number;
}

export interface ProphetGetNewsTopCategoryImpactData {
  top_categories?: ProphetAnalyticsTopCategoryItem[];
  impact?: ProphetAnalyticsNewsImpact;
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
  next_match: ProphetGetTeamDetailNextMatch;
}
