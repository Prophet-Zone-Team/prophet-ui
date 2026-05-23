export interface UserOpenOrder {
  id: string;
  status: string;
  market: string;
  asset_id: string;
  side: string;
  price: string;
  original_size: string;
  size_matched: string;
  outcome: string;
  created_at: number;
  order_type: string;
}

export interface PortfolioSeriesPoint {
  date: string;
  value: number;
}

export type PortfolioLoadStatus = "idle" | "loading" | "ready" | "error";

export type PortfolioTimeRange = "1H" | "1D" | "1W" | "1M" | "All";
