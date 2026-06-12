export type PortfolioTransactionType =
  | "buy"
  | "sell"
  | "redeem"
  | "deposit"
  | "withdraw"
  | "claim";

export interface PortfolioTransactionRecord {
  id: string;
  type: PortfolioTransactionType;
  side: string;
  price: string;
  size?: number;
  amount: string;
  marketName: string;
  teamName: string;
  slug: string;
  source: string;
  createdAt: string;
  tradeCreatedAt: string;
  txHash: string;
}

export type UserActivityType = "TRADE";

export interface UserActivityRecord {
  id: string;
  proxyWallet: string;
  timestamp: number;
  conditionId: string;
  type: UserActivityType;
  size: number;
  usdcSize: number;
  transactionHash: string;
  price: number;
  asset: string;
  side: "BUY" | "SELL";
  outcomeIndex: number;
  title: string;
  slug: string;
  icon?: string;
  eventSlug?: string;
  outcome: string;
}

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
  expiration?: string;
}

export interface PortfolioSeriesPoint {
  date: string;
  value: number;
  timestamp?: number;
}

export type PortfolioLoadStatus = "idle" | "loading" | "ready" | "error";

export type PortfolioTimeRange = "1H" | "1D" | "1W" | "1M" | "YTD" | "All";
