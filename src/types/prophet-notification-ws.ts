export const PROPHET_NOTICE_TYPES = [
  "match_preview",
  "price",
  "volume",
  "large_order",
  "top_holders",
  "news",
  "score",
] as const;

export type ProphetNoticeType = (typeof PROPHET_NOTICE_TYPES)[number];

export const PROPHET_TOAST_NOTICE_TYPES = [
  "match_preview",
  "price",
  "volume",
  "large_order",
] as const;

export type ProphetToastNoticeType =
  (typeof PROPHET_TOAST_NOTICE_TYPES)[number];

export interface ProphetNotificationMatchPreviewMarketOdd {
  outcome?: string;
  price?: string;
}

export interface ProphetNotificationMatchPreviewMarket {
  market_id?: string;
  market_name?: string;
  odds?: ProphetNotificationMatchPreviewMarketOdd[];
}

export interface ProphetNotificationMatchPreviewPayload {
  team_a?: string;
  team_b?: string;
  match_start?: string;
  match_end?: string;
  markets?: ProphetNotificationMatchPreviewMarket[];
}

export interface ProphetNotificationPricePayload {
  token_id?: string;
  baseline?: string;
  baseline_display?: string;
  current?: string;
  current_display?: string;
  change_abs?: string;
  change_abs_display?: string;
  change_pct?: string;
  threshold_abs?: string;
  threshold_abs_display?: string;
  window?: string;
}

export interface ProphetNotificationVolumePayload {
  previous_volume_usd?: string;
  previous_volume_usd_display?: string;
  current_volume_usd?: string;
  current_volume_usd_display?: string;
  delta_usd?: string;
  delta_usd_display?: string;
  threshold_usd?: string;
  threshold_usd_display?: string;
  change_pct?: string;
}

export interface ProphetNotificationLargeOrderPayload {
  token_id?: string;
  side?: string;
  price?: string;
  size?: string;
  notional_usd?: string;
  notional_usd_display?: string;
  threshold_usd?: string;
  threshold_usd_display?: string;
}

export interface ProphetNotificationTopHoldersPayload {
  alert_count?: number;
  threshold_shares?: string;
  lines?: string[];
}

export interface ProphetNotificationNewsPayload {
  article_id?: number;
  url?: string;
  source_name?: string;
  published_at?: string;
  matched_teams?: string[];
  matched_team?: string;
  team_a?: string;
  team_b?: string;
  category?: string;
  score?: number;
  matched_players_json?: string;
}

export interface ProphetNotificationScorePayload {
  team_a_name?: string;
  team_a_score?: number;
  team_b_name?: string;
  team_b_score?: number;
  match_status?: string;
  score_update?: number;
  score_source?: string;
  score_pushed?: string | null;
  attempt_count?: number;
}

export interface ProphetNotificationDataBase {
  source?: string;
  notice_type: ProphetNoticeType;
  event_slug?: string;
  event_title?: string;
  market_id?: string;
  market_name?: string;
  outcome?: string;
  title?: string;
  body?: string;
  timestamp?: number;
}

export interface ProphetNotificationMatchPreviewData
  extends ProphetNotificationDataBase {
  notice_type: "match_preview";
  payload: ProphetNotificationMatchPreviewPayload;
}

export interface ProphetNotificationPriceData extends ProphetNotificationDataBase {
  notice_type: "price";
  payload: ProphetNotificationPricePayload;
}

export interface ProphetNotificationVolumeData extends ProphetNotificationDataBase {
  notice_type: "volume";
  payload: ProphetNotificationVolumePayload;
}

export interface ProphetNotificationLargeOrderData
  extends ProphetNotificationDataBase {
  notice_type: "large_order";
  payload: ProphetNotificationLargeOrderPayload;
}

export interface ProphetNotificationTopHoldersData
  extends ProphetNotificationDataBase {
  notice_type: "top_holders";
  payload: ProphetNotificationTopHoldersPayload;
}

export interface ProphetNotificationNewsData extends ProphetNotificationDataBase {
  notice_type: "news";
  payload: ProphetNotificationNewsPayload;
}

export interface ProphetNotificationScoreData extends ProphetNotificationDataBase {
  notice_type: "score";
  payload: ProphetNotificationScorePayload;
}

export type ProphetNotificationData =
  | ProphetNotificationMatchPreviewData
  | ProphetNotificationPriceData
  | ProphetNotificationVolumeData
  | ProphetNotificationLargeOrderData
  | ProphetNotificationTopHoldersData
  | ProphetNotificationNewsData
  | ProphetNotificationScoreData;

export interface ProphetWsNotificationMessage {
  type: "notification";
  data: ProphetNotificationData;
}

export type ProphetWsConnectionStatus =
  | "idle"
  | "connecting"
  | "open"
  | "error";
