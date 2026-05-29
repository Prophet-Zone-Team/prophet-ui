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

export type ProphetTrackCategory = "team" | "game";

export interface ProphetTrackRequest {
  category: ProphetTrackCategory;
  slug?: string;
  team_name?: string;
}

export interface ProphetCancelTrackRequest {
  slug: string;
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
  goals?: number[] | null;
  team?: ProphetWorldCupTeam;
  markets?: ProphetUserTrackMarket[];
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
