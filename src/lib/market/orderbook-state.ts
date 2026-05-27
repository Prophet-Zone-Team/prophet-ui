import { ORDERBOOK_MAX_LEVELS } from "@/config/polymarket-ws";
import {
  type MarketOrderbook,
  type OrderbookLevel,
  parseLevels,
  parseOptionalPrice,
  resolveMarketPrice,
} from "@/lib/market/orderbook-levels";
import type {
  BookEvent,
  PriceChangeEvent,
  PriceChangeMessage,
} from "@/types/polymarket-market-ws";

export function bookEventToMarketOrderbook(event: BookEvent): MarketOrderbook {
  const bids = parseLevels(event.bids, true);
  const asks = parseLevels(event.asks, false);

  return {
    tokenId: event.asset_id,
    bids,
    asks,
    marketPrice: resolveMarketPrice(bids, asks),
    updatedAt: new Date(Number(event.timestamp)).toISOString(),
  };
}

function upsertLevel(
  levels: OrderbookLevel[],
  price: number,
  size: number,
  descending: boolean
): OrderbookLevel[] {
  const next = levels.filter((level) => level.price !== price);

  if (size > 0) {
    next.push({ price, size });
  }

  next.sort((a, b) => (descending ? b.price - a.price : a.price - b.price));

  return next.slice(0, ORDERBOOK_MAX_LEVELS);
}

function applySinglePriceChange(
  book: MarketOrderbook,
  change: PriceChangeMessage
): MarketOrderbook {
  const price = Number(change.price);
  const size = Number(change.size);

  if (!Number.isFinite(price) || price <= 0 || price >= 1) {
    return book;
  }

  const bids =
    change.side === "BUY"
      ? upsertLevel(book.bids, price, Number.isFinite(size) ? size : 0, true)
      : book.bids;
  const asks =
    change.side === "SELL"
      ? upsertLevel(book.asks, price, Number.isFinite(size) ? size : 0, false)
      : book.asks;

  return {
    ...book,
    tokenId: change.asset_id,
    bids,
    asks,
    marketPrice: resolveMarketPrice(bids, asks),
    updatedAt: new Date().toISOString(),
  };
}

export function applyPriceChangeEvent(
  current: MarketOrderbook | undefined,
  event: PriceChangeEvent
): MarketOrderbook | undefined {
  let next = current;

  for (const change of event.price_changes) {
    const base =
      next?.tokenId === change.asset_id
        ? next
        : {
            tokenId: change.asset_id,
            bids: [] as OrderbookLevel[],
            asks: [] as OrderbookLevel[],
            updatedAt: new Date().toISOString(),
          };

    next = applySinglePriceChange(base, change);
  }

  return next;
}

export function bestPricesFromPriceChange(
  change: PriceChangeMessage
): { bestBid?: number; bestAsk?: number } {
  return {
    bestBid: parseOptionalPrice(change.best_bid),
    bestAsk: parseOptionalPrice(change.best_ask),
  };
}
