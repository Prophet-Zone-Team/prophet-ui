"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

import { cn } from "@/lib/cn";
import { fetchJson } from "@/lib/team/client-fetch";
import { formatOrderbookPrice, formatShareSize } from "@/lib/market/order-math";

interface OrderbookLevel {
  price: number;
  size: number;
}

interface MarketOrderbook {
  tokenId: string;
  bids: OrderbookLevel[];
  asks: OrderbookLevel[];
  marketPrice?: number;
  updatedAt?: string;
}

const MAX_ASK_ROWS = 7;
const MAX_BID_ROWS = 8;
const ORDERBOOK_POLL_INTERVAL_MS = 15_000;

export interface OrderbookProps {
  tokenId?: string;
  className?: string;
}

export function Orderbook({ tokenId, className }: OrderbookProps) {
  const [book, setBook] = useState<MarketOrderbook | undefined>();
  const [error, setError] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const asksScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!tokenId) {
      setBook(undefined);
      setError(undefined);
      setLoading(false);
      return;
    }

    const activeTokenId = tokenId;
    let requestId = 0;
    let ignore = false;

    setBook(undefined);
    setError(undefined);

    async function load(isInitial: boolean) {
      const currentRequestId = ++requestId;

      if (isInitial) {
        setLoading(true);
      }

      try {
        const payload = await fetchJson<{ orderbook: MarketOrderbook }>(
          `/api/market/orderbook?tokenId=${encodeURIComponent(activeTokenId)}`
        );

        if (ignore || currentRequestId !== requestId) {
          return;
        }
        setBook(payload.orderbook);
        setError(undefined);
      } catch (loadError) {
        if (ignore || currentRequestId !== requestId) {
          return;
        }

        setError(
          loadError instanceof Error ? loadError.message : String(loadError)
        );
        setBook(undefined);
      } finally {
        if (!ignore && currentRequestId === requestId) {
          setLoading(false);
        }
      }
    }

    void load(true);
    const interval = window.setInterval(
      () => void load(false),
      ORDERBOOK_POLL_INTERVAL_MS
    );

    return () => {
      ignore = true;
      window.clearInterval(interval);
    };
  }, [tokenId]);

  const asks = useMemo(
    () => [...(book?.asks ?? [])].reverse().slice(0, MAX_ASK_ROWS),
    [book]
  );
  const bids = useMemo(() => (book?.bids ?? []).slice(0, MAX_BID_ROWS), [book]);
  const marketPrice = book?.marketPrice;

  useLayoutEffect(() => {
    if (!tokenId) {
      return;
    }

    const el = asksScrollRef.current;

    if (!el) {
      return;
    }

    el.scrollTop = el.scrollHeight;
  }, [asks, loading, tokenId]);

  if (!tokenId) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-[12px] border border-[#EBEBEB] bg-white px-3 text-center text-sm text-prophet-muted",
          className
        )}
      >
        Order book unavailable for this market.
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex h-full min-h-0 flex-col rounded-[12px] border border-[#EBEBEB] bg-white p-3 text-[12px]",
        className
      )}
      aria-label="Market order book"
    >
      <div className="text-[18px] font-[500] pb-[10px] text-black">
        Orderbook
      </div>
      <div className="grid shrink-0 grid-cols-2 gap-2 px-1 pb-2 font-[400] leading-[17px] text-[#909090]">
        <span>Price</span>
        <span className="text-right">Shares</span>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div
          ref={asksScrollRef}
          className="flex min-h-0 flex-1 flex-col justify-end overflow-y-auto"
        >
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

        <div className="mx-[-4px] flex h-8 shrink-0 items-center justify-between bg-[#EBEBEB] px-2">
          <span className="font-[400] leading-[17px] text-black">
            {marketPrice !== undefined
              ? formatOrderbookPrice(marketPrice)
              : "—"}
          </span>
          <span className="font-[400] leading-[17px] text-[#909090]">
            Market Price
          </span>
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
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
          "font-[400]",
          side === "ask" ? "text-[#FF674B]" : "text-[#65AF14]"
        )}
      >
        {formatOrderbookPrice(price)}
      </span>
      <span className="text-right font-[400] text-black">
        {formatShareSize(size)}
      </span>
    </div>
  );
}
