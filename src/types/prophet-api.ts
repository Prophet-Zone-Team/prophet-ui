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
  outcomes?: string[];
  prices?: string[];
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
