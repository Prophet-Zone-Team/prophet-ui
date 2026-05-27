import { ORDERBOOK_MAX_LEVELS } from "@/config/polymarket-ws";

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

export function parseLevels(
  levels: Array<{ price?: unknown; size?: unknown }> | undefined,
  descending: boolean,
  maxLevels = ORDERBOOK_MAX_LEVELS
): OrderbookLevel[] {
  if (!levels?.length) {
    return [];
  }

  const parsed = levels
    .map((level) => ({
      price: Number(level.price),
      size: Number(level.size),
    }))
    .filter(
      (level) =>
        Number.isFinite(level.price) &&
        level.price > 0 &&
        level.price < 1 &&
        Number.isFinite(level.size) &&
        level.size > 0
    );

  parsed.sort((a, b) => (descending ? b.price - a.price : a.price - b.price));

  return parsed.slice(0, maxLevels);
}

export function resolveMarketPrice(
  bids: OrderbookLevel[],
  asks: OrderbookLevel[]
): number | undefined {
  const bestBid = bids[0]?.price;
  const bestAsk = asks[0]?.price;

  if (bestBid !== undefined && bestAsk !== undefined) {
    return (bestBid + bestAsk) / 2;
  }

  return bestBid ?? bestAsk;
}

export function parseOptionalPrice(value: string | undefined): number | undefined {
  if (value === undefined || value === "") {
    return undefined;
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed <= 0 || parsed >= 1) {
    return undefined;
  }

  return parsed;
}
