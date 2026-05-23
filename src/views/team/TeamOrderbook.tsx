"use client";

import { useEffect, useState } from "react";

import { cn } from "../../lib/cn";
import { fetchJson } from "../../lib/team/clientFetch";
import {
  formatOrderbookPrice,
  formatOrderbookTotal
} from "../../lib/market/orderMath";

interface OrderbookLevel {
  price: number;
  size: number;
}

interface MarketOrderbook {
  tokenId: string;
  bids: OrderbookLevel[];
  asks: OrderbookLevel[];
  marketPrice?: number;
}

const MAX_ASK_ROWS = 7;
const MAX_BID_ROWS = 8;

export interface TeamOrderbookProps {
  tokenId?: string;
  className?: string;
}

export function TeamOrderbook({ tokenId, className }: TeamOrderbookProps) {
  const [book, setBook] = useState<MarketOrderbook | undefined>();
  const [error, setError] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!tokenId) {
      setBook(undefined);
      return;
    }

    const activeTokenId = tokenId;
    let ignore = false;

    async function load() {
      setLoading(true);
      setError(undefined);

      try {
        const payload = await fetchJson<{ orderbook: MarketOrderbook }>(
          `/api/market/orderbook?tokenId=${encodeURIComponent(activeTokenId)}`
        );

        if (!ignore) {
          setBook(payload.orderbook);
        }
      } catch (loadError) {
        if (!ignore) {
          setError(
            loadError instanceof Error ? loadError.message : String(loadError)
          );
          setBook(undefined);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    void load();
    const interval = window.setInterval(() => void load(), 15_000);

    return () => {
      ignore = true;
      window.clearInterval(interval);
    };
  }, [tokenId]);

  if (!tokenId) {
    return (
      <div
        className={cn(
          "flex min-h-[280px] items-center justify-center rounded-[12px] border border-[#EBEBEB] bg-white px-3 text-center text-sm text-prophet-muted",
          className
        )}
      >
        Order book unavailable for this market.
      </div>
    );
  }

  const asks = [...(book?.asks ?? [])].reverse().slice(0, MAX_ASK_ROWS);
  const bids = (book?.bids ?? []).slice(0, MAX_BID_ROWS);
  const marketPrice = book?.marketPrice;

  return (
    <div
      className={cn(
        "flex min-h-[280px] flex-col rounded-[12px] border border-[#EBEBEB] bg-white p-3 text-sm xl:min-h-[544px]",
        className
      )}
      aria-label="Market order book"
    >
      <div className="grid grid-cols-2 gap-2 px-1 pb-2 font-[556] leading-[17px] text-[#909090]">
        <span>Price</span>
        <span className="text-right">Total</span>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="flex flex-1 flex-col justify-end overflow-y-auto">
          {loading && !book ? (
            <p className="px-1 py-4 text-[#909090]">Loading…</p>
          ) : error ? (
            <p className="px-1 py-4 text-[#FF674B]">{error}</p>
          ) : (
            asks.map((level, index) => (
              <OrderbookRow
                key={`ask-${level.price}-${index}`}
                price={level.price}
                size={level.size}
                side="ask"
              />
            ))
          )}
        </div>

        <div className="mx-[-4px] flex h-8 items-center justify-between bg-[#EBEBEB] px-2">
          <span className="font-[556] leading-[17px] text-black">
            {marketPrice !== undefined
              ? formatOrderbookPrice(marketPrice)
              : "—"}
          </span>
          <span className="font-[556] leading-[17px] text-[#909090]">
            Market Price
          </span>
        </div>

        <div className="flex flex-1 flex-col overflow-y-auto">
          {bids.map((level, index) => (
            <OrderbookRow
              key={`bid-${level.price}-${index}`}
              price={level.price}
              size={level.size}
              side="bid"
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function OrderbookRow({
  price,
  size,
  side
}: {
  price: number;
  size: number;
  side: "ask" | "bid";
}) {
  return (
    <div className="grid grid-cols-2 gap-2 px-1 py-0.5 leading-[17px]">
      <span
        className={cn(
          "font-[556]",
          side === "ask" ? "text-[#FF674B]" : "text-[#65AF14]"
        )}
      >
        {formatOrderbookPrice(price)}
      </span>
      <span className="text-right font-[556] text-black">
        {formatOrderbookTotal(size, price)}
      </span>
    </div>
  );
}
