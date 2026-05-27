export interface WsOrderSummary {
  price: string;
  size: string;
}

export interface BookEvent {
  event_type: "book";
  asset_id: string;
  market: string;
  bids: WsOrderSummary[];
  asks: WsOrderSummary[];
  timestamp: string;
  hash: string;
}

export interface PriceChangeMessage {
  asset_id: string;
  price: string;
  size: string;
  side: "BUY" | "SELL";
  hash: string;
  best_bid?: string;
  best_ask?: string;
}

export interface PriceChangeEvent {
  event_type: "price_change";
  market: string;
  price_changes: PriceChangeMessage[];
  timestamp: string;
}

export interface LastTradePriceEvent {
  event_type: "last_trade_price";
  asset_id: string;
  market: string;
  price: string;
  size: string;
  side: "BUY" | "SELL";
  timestamp: string;
  fee_rate_bps?: string;
  transaction_hash?: string;
}

export interface BestBidAskEvent {
  event_type: "best_bid_ask";
  asset_id: string;
  market: string;
  best_bid: string;
  best_ask: string;
  spread: string;
  timestamp: string;
}

export interface TickSizeChangeEvent {
  event_type: "tick_size_change";
  asset_id: string;
  market: string;
  old_tick_size: string;
  new_tick_size: string;
  timestamp: string;
}

export type PolymarketMarketWsEvent =
  | BookEvent
  | PriceChangeEvent
  | LastTradePriceEvent
  | BestBidAskEvent
  | TickSizeChangeEvent;

export interface TokenBestPrices {
  bestBid?: number;
  bestAsk?: number;
  lastTradePrice?: number;
  updatedAt?: string;
}

export type MarketWsListener = (event: PolymarketMarketWsEvent) => void;

export interface MarketWsSubscriptionOptions {
  customFeatureEnabled?: boolean;
}
