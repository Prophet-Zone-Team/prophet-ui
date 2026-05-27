import {
  POLYMARKET_MARKET_WS_PING_INTERVAL_MS,
  POLYMARKET_MARKET_WS_RECONNECT_BASE_MS,
  POLYMARKET_MARKET_WS_RECONNECT_MAX_MS,
  POLYMARKET_MARKET_WS_URL,
} from "@/config/polymarket-ws";
import {
  bookEventToMarketOrderbook,
  bestPricesFromPriceChange,
  applyPriceChangeEvent,
} from "@/lib/market/orderbook-state";
import {
  parseOptionalPrice,
  resolveMarketPrice,
} from "@/lib/market/orderbook-levels";
import type { MarketOrderbook } from "@/lib/market/orderbook-levels";
import type {
  BestBidAskEvent,
  BookEvent,
  LastTradePriceEvent,
  MarketWsListener,
  MarketWsSubscriptionOptions,
  PolymarketMarketWsEvent,
  PriceChangeEvent,
  TokenBestPrices,
} from "@/types/polymarket-market-ws";

interface ListenerEntry {
  listener: MarketWsListener;
  options: MarketWsSubscriptionOptions;
}

interface SubscriptionState {
  refCount: number;
  customFeatureEnabled: boolean;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseWsEvent(raw: unknown): PolymarketMarketWsEvent | undefined {
  if (!isRecord(raw) || typeof raw.event_type !== "string") {
    return undefined;
  }

  switch (raw.event_type) {
    case "book":
    case "price_change":
    case "last_trade_price":
    case "best_bid_ask":
    case "tick_size_change":
      return raw as unknown as PolymarketMarketWsEvent;
    default:
      return undefined;
  }
}

function parseWsPayload(data: string): PolymarketMarketWsEvent[] {
  if (data === "PONG") {
    return [];
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(data);
  } catch {
    return [];
  }

  if (Array.isArray(parsed)) {
    return parsed
      .map((item) => parseWsEvent(item))
      .filter((item): item is PolymarketMarketWsEvent => item !== undefined);
  }

  const event = parseWsEvent(parsed);
  return event ? [event] : [];
}

export class PolymarketMarketWsClient {
  private socket: WebSocket | null = null;
  private pingTimer: ReturnType<typeof setInterval> | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectAttempt = 0;
  private disposed = false;
  private hasInitialSubscription = false;

  private readonly assetSubscriptions = new Map<string, SubscriptionState>();
  private readonly listeners = new Set<ListenerEntry>();
  private readonly orderbooks = new Map<string, MarketOrderbook>();
  private readonly tokenPrices = new Map<string, TokenBestPrices>();
  private readonly connectionListeners = new Set<(connected: boolean) => void>();

  subscribe(
    assetIds: string[],
    listener: MarketWsListener,
    options: MarketWsSubscriptionOptions = {}
  ): () => void {
    this.resetIfDisposed();

    const entry: ListenerEntry = { listener, options };
    this.listeners.add(entry);

    const newlyAdded: string[] = [];

    for (const assetId of assetIds) {
      if (!assetId) {
        continue;
      }

      const existing = this.assetSubscriptions.get(assetId);

      if (existing) {
        existing.refCount += 1;
        if (options.customFeatureEnabled) {
          existing.customFeatureEnabled = true;
        }
      } else {
        this.assetSubscriptions.set(assetId, {
          refCount: 1,
          customFeatureEnabled: options.customFeatureEnabled ?? false,
        });
        newlyAdded.push(assetId);
      }
    }

    this.ensureConnection();

    if (this.hasInitialSubscription && newlyAdded.length > 0) {
      this.sendSubscriptionUpdate("subscribe", newlyAdded, options);
    }

    return () => {
      this.listeners.delete(entry);
      this.releaseAssets(assetIds);
    };
  }

  onConnectionChange(listener: (connected: boolean) => void): () => void {
    this.connectionListeners.add(listener);
    listener(this.isConnected());

    return () => {
      this.connectionListeners.delete(listener);
    };
  }

  getOrderbook(tokenId: string): MarketOrderbook | undefined {
    return this.orderbooks.get(tokenId);
  }

  getTokenPrices(tokenId: string): TokenBestPrices | undefined {
    return this.tokenPrices.get(tokenId);
  }

  isConnected(): boolean {
    return this.socket?.readyState === WebSocket.OPEN;
  }

  dispose(): void {
    this.disposed = true;
    this.clearPingTimer();
    this.clearReconnectTimer();

    if (this.socket) {
      this.socket.onopen = null;
      this.socket.onmessage = null;
      this.socket.onerror = null;
      this.socket.onclose = null;
      this.socket.close();
      this.socket = null;
    }

    this.notifyConnectionChange(false);
  }

  private resetIfDisposed(): void {
    if (this.disposed) {
      this.disposed = false;
      this.reconnectAttempt = 0;
      this.hasInitialSubscription = false;
    }
  }

  private ensureConnection(): void {
    if (this.disposed || this.assetSubscriptions.size === 0) {
      return;
    }

    if (
      this.socket &&
      (this.socket.readyState === WebSocket.OPEN ||
        this.socket.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    this.connect();
  }

  private connect(): void {
    if (this.disposed || typeof WebSocket === "undefined") {
      return;
    }

    this.clearReconnectTimer();

    const socket = new WebSocket(POLYMARKET_MARKET_WS_URL);
    this.socket = socket;

    socket.onopen = () => {
      this.reconnectAttempt = 0;
      this.hasInitialSubscription = false;
      this.startPingTimer();
      this.sendInitialSubscription();
      this.notifyConnectionChange(true);
    };

    socket.onmessage = (message) => {
      const events = parseWsPayload(String(message.data));

      for (const event of events) {
        this.handleEvent(event);
      }
    };

    socket.onerror = () => {
      this.notifyConnectionChange(false);
    };

    socket.onclose = () => {
      this.hasInitialSubscription = false;
      this.clearPingTimer();
      this.socket = null;
      this.notifyConnectionChange(false);
      this.scheduleReconnect();
    };
  }

  private scheduleReconnect(): void {
    if (this.disposed || this.assetSubscriptions.size === 0) {
      return;
    }

    this.clearReconnectTimer();

    const delay = Math.min(
      POLYMARKET_MARKET_WS_RECONNECT_BASE_MS * 2 ** this.reconnectAttempt,
      POLYMARKET_MARKET_WS_RECONNECT_MAX_MS
    );

    this.reconnectAttempt += 1;

    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, delay);
  }

  private startPingTimer(): void {
    this.clearPingTimer();

    this.pingTimer = setInterval(() => {
      if (this.socket?.readyState === WebSocket.OPEN) {
        this.socket.send("PING");
      }
    }, POLYMARKET_MARKET_WS_PING_INTERVAL_MS);
  }

  private clearPingTimer(): void {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private getActiveAssetIds(): string[] {
    return [...this.assetSubscriptions.keys()];
  }

  private needsCustomFeatures(): boolean {
    for (const state of this.assetSubscriptions.values()) {
      if (state.customFeatureEnabled) {
        return true;
      }
    }

    for (const entry of this.listeners) {
      if (entry.options.customFeatureEnabled) {
        return true;
      }
    }

    return false;
  }

  private sendInitialSubscription(): void {
    const assetIds = this.getActiveAssetIds();

    if (!assetIds.length || this.socket?.readyState !== WebSocket.OPEN) {
      return;
    }

    this.socket.send(
      JSON.stringify({
        assets_ids: assetIds,
        type: "market",
        initial_dump: true,
        custom_feature_enabled: this.needsCustomFeatures(),
      })
    );

    this.hasInitialSubscription = true;
  }

  private sendSubscriptionUpdate(
    operation: "subscribe" | "unsubscribe",
    assetIds: string[],
    options: MarketWsSubscriptionOptions = {}
  ): void {
    if (!assetIds.length || this.socket?.readyState !== WebSocket.OPEN) {
      return;
    }

    const payload: Record<string, unknown> = {
      operation,
      assets_ids: assetIds,
    };

    if (operation === "subscribe" && options.customFeatureEnabled) {
      payload.custom_feature_enabled = true;
    }

    this.socket.send(JSON.stringify(payload));
  }

  private releaseAssets(assetIds: string[]): void {
    const removed: string[] = [];

    for (const assetId of assetIds) {
      if (!assetId) {
        continue;
      }

      const state = this.assetSubscriptions.get(assetId);

      if (!state) {
        continue;
      }

      state.refCount -= 1;

      if (state.refCount <= 0) {
        this.assetSubscriptions.delete(assetId);
        this.orderbooks.delete(assetId);
        this.tokenPrices.delete(assetId);
        removed.push(assetId);
      }
    }

    if (removed.length > 0 && this.hasInitialSubscription) {
      this.sendSubscriptionUpdate("unsubscribe", removed);
    }

    if (this.assetSubscriptions.size === 0) {
      this.dispose();
      clientInstance = null;
      return;
    }
  }

  private handleEvent(event: PolymarketMarketWsEvent): void {
    switch (event.event_type) {
      case "book":
        this.handleBookEvent(event);
        break;
      case "price_change":
        this.handlePriceChangeEvent(event);
        break;
      case "last_trade_price":
        this.handleLastTradePriceEvent(event);
        break;
      case "best_bid_ask":
        this.handleBestBidAskEvent(event);
        break;
      default:
        break;
    }

    for (const entry of this.listeners) {
      entry.listener(event);
    }
  }

  private handleBookEvent(event: BookEvent): void {
    const book = bookEventToMarketOrderbook(event);
    this.orderbooks.set(event.asset_id, book);

    this.updateTokenPrices(event.asset_id, {
      bestBid: book.bids[0]?.price,
      bestAsk: book.asks[0]?.price,
      updatedAt: book.updatedAt,
    });
  }

  private handlePriceChangeEvent(event: PriceChangeEvent): void {
    for (const change of event.price_changes) {
      const existing = this.orderbooks.get(change.asset_id);
      const next = existing
        ? applyPriceChangeToBook(existing, change)
        : undefined;

      if (next) {
        this.orderbooks.set(change.asset_id, next);
      }

      const derived = bestPricesFromPriceChange(change);
      this.updateTokenPrices(change.asset_id, {
        bestBid: derived.bestBid ?? next?.bids[0]?.price,
        bestAsk: derived.bestAsk ?? next?.asks[0]?.price,
        updatedAt: new Date().toISOString(),
      });
    }
  }

  private handleLastTradePriceEvent(event: LastTradePriceEvent): void {
    const lastTradePrice = parseOptionalPrice(event.price);

    if (lastTradePrice === undefined) {
      return;
    }

    this.updateTokenPrices(event.asset_id, {
      lastTradePrice,
      updatedAt: new Date(Number(event.timestamp)).toISOString(),
    });
  }

  private handleBestBidAskEvent(event: BestBidAskEvent): void {
    this.updateTokenPrices(event.asset_id, {
      bestBid: parseOptionalPrice(event.best_bid),
      bestAsk: parseOptionalPrice(event.best_ask),
      updatedAt: new Date(Number(event.timestamp)).toISOString(),
    });
  }

  private updateTokenPrices(
    tokenId: string,
    patch: Partial<TokenBestPrices>
  ): void {
    const current = this.tokenPrices.get(tokenId) ?? {};
    const next: TokenBestPrices = {
      ...current,
      ...patch,
    };

    if (
      next.bestBid === undefined &&
      next.bestAsk === undefined &&
      next.lastTradePrice === undefined
    ) {
      return;
    }

    this.tokenPrices.set(tokenId, next);
  }

  private notifyConnectionChange(connected: boolean): void {
    for (const listener of this.connectionListeners) {
      listener(connected);
    }
  }
}

function applyPriceChangeToBook(
  book: MarketOrderbook,
  change: PriceChangeEvent["price_changes"][number]
): MarketOrderbook | undefined {
  return applyPriceChangeEvent(book, {
    event_type: "price_change",
    market: "",
    price_changes: [change],
    timestamp: new Date().toISOString(),
  });
}

let clientInstance: PolymarketMarketWsClient | null = null;

export function getPolymarketMarketWsClient(): PolymarketMarketWsClient {
  if (!clientInstance) {
    clientInstance = new PolymarketMarketWsClient();
  }

  return clientInstance;
}

export function deriveTokenPricesFromOrderbook(
  book: MarketOrderbook
): TokenBestPrices {
  return {
    bestBid: book.bids[0]?.price,
    bestAsk: book.asks[0]?.price,
    updatedAt: book.updatedAt,
  };
}

export { resolveMarketPrice };
