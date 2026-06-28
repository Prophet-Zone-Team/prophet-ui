export interface PolymarketSportsWsUpdate {
  /** Polymarket fixture slug when the WS payload includes it. */
  slug?: string;
  /** Alias some payloads use for the same identifier as `gameId`. */
  gameId?: string;
  live?: boolean;
  ended?: boolean;
  score?: string;
  period?: string;
  elapsed?: string | number;
  last_update?: string;
  finished_timestamp?: string;
  turn?: string;
}
