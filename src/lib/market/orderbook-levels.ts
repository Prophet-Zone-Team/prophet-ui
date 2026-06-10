import { ORDERBOOK_MAX_LEVELS } from "@/config/polymarket-ws";
import {
  DEFAULT_MARKET_TICK_SIZE,
  roundPriceToTick,
  type MarketTickSize,
} from "@/lib/market/order-math";

export interface OrderbookLevel {
  price: number;
  size: number;
}

export interface MarketOrderbook {
  tokenId: string;
  bids: OrderbookLevel[];
  asks: OrderbookLevel[];
  marketPrice?: number;
  updatedAt: string;
}

export function parseOrderbookPrice(
  value: unknown,
  tickSize: MarketTickSize | string = DEFAULT_MARKET_TICK_SIZE,
): number | undefined {
  if (value === undefined || value === "") {
    return undefined;
  }

  const parsed = typeof value === "number" ? value : Number(value);

  if (!Number.isFinite(parsed) || parsed <= 0 || parsed >= 1) {
    return undefined;
  }

  return roundPriceToTick(parsed, tickSize);
}

export function parseLevels(
  levels: Array<{ price?: unknown; size?: unknown }> | undefined,
  descending: boolean,
  maxLevels = ORDERBOOK_MAX_LEVELS,
  tickSize: MarketTickSize | string = DEFAULT_MARKET_TICK_SIZE,
): OrderbookLevel[] {
  if (!levels?.length) {
    return [];
  }

  const parsed = levels
    .map((level) => {
      const price = parseOrderbookPrice(level.price, tickSize);
      const size = Number(level.size);

      if (
        price === undefined ||
        !Number.isFinite(size) ||
        size <= 0
      ) {
        return undefined;
      }

      return { price, size };
    })
    .filter((level): level is OrderbookLevel => level !== undefined);

  parsed.sort((a, b) => (descending ? b.price - a.price : a.price - b.price));

  return parsed.slice(0, maxLevels);
}

export function resolveMarketPrice(
  bids: OrderbookLevel[],
  asks: OrderbookLevel[],
  tickSize: MarketTickSize | string = DEFAULT_MARKET_TICK_SIZE,
): number | undefined {
  const bestBid = bids[0]?.price;
  const bestAsk = asks[0]?.price;

  if (bestBid !== undefined && bestAsk !== undefined) {
    return roundPriceToTick((bestBid + bestAsk) / 2, tickSize);
  }

  const single = bestBid ?? bestAsk;

  return single !== undefined ? roundPriceToTick(single, tickSize) : undefined;
}

export function parseOptionalPrice(
  value: string | undefined,
  tickSize: MarketTickSize | string = DEFAULT_MARKET_TICK_SIZE,
): number | undefined {
  if (value === undefined || value === "") {
    return undefined;
  }

  return parseOrderbookPrice(value, tickSize);
}
