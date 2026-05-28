export interface PolymarketSportsWsUpdate {
  slug: string;
  live?: boolean;
  ended?: boolean;
  score?: string;
  period?: string;
  elapsed?: string;
  last_update?: string;
  finished_timestamp?: string;
  turn?: string;
}
