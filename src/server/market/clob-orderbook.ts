import "server-only";

import { getTradingHost } from "@/server/trading/clob-auth";
import { serverFetch } from "@/server/trading/server-fetch";

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

function parseLevels(
  levels: Array<{ price?: unknown; size?: unknown }> | undefined,
  descending: boolean
): OrderbookLevel[] {
  if (!levels?.length) {
    return [];
  }

  const parsed = levels
    .map((level) => ({
      price: Number(level.price),
      size: Number(level.size)
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

  return parsed.slice(0, 12);
}

export async function fetchMarketOrderbook(
  tokenId: string
): Promise<MarketOrderbook> {
  const response = await serverFetch(
    `${getTradingHost()}/book?token_id=${encodeURIComponent(tokenId)}`,
    { cache: "no-store" }
  );

  if (!response.ok) {
    throw new Error(`Unable to fetch order book: ${response.status}`);
  }

  const book = (await response.json()) as {
    bids?: Array<{ price?: unknown; size?: unknown }>;
    asks?: Array<{ price?: unknown; size?: unknown }>;
  };

  const bids = parseLevels(book.bids, true);
  const asks = parseLevels(book.asks, false);
  const bestBid = bids[0]?.price;
  const bestAsk = asks[0]?.price;
  const marketPrice =
    bestBid !== undefined && bestAsk !== undefined
      ? (bestBid + bestAsk) / 2
      : bestBid ?? bestAsk;

  return {
    tokenId,
    bids,
    asks,
    marketPrice,
    updatedAt: new Date().toISOString()
  };
}
