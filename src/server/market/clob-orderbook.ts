import "server-only";

import {
  type MarketOrderbook,
  parseLevels,
  resolveMarketPrice,
} from "@/lib/market/orderbook-levels";
import { getTradingHost } from "@/server/trading/clob-auth";
import { serverFetch } from "@/server/trading/server-fetch";

export type { MarketOrderbook, OrderbookLevel } from "@/lib/market/orderbook-levels";

export async function fetchMarketOrderbook(
  tokenId: string
): Promise<MarketOrderbook> {
  const response = await serverFetch(
    `${getTradingHost()}/book?token_id=${encodeURIComponent(tokenId)}`,
    { cache: "no-store" }
  );

  if (!response.ok) {
    throw new Error(`Unable to fetch order book`);
  }

  const book = (await response.json()) as {
    bids?: Array<{ price?: unknown; size?: unknown }>;
    asks?: Array<{ price?: unknown; size?: unknown }>;
  };

  const bids = parseLevels(book.bids, true);
  const asks = parseLevels(book.asks, false);

  return {
    tokenId,
    bids,
    asks,
    marketPrice: resolveMarketPrice(bids, asks),
    updatedAt: new Date().toISOString(),
  };
}
