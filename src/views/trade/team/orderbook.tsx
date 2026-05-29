"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import { Loader2 } from "lucide-react";

import { cn } from "@/lib/cn";
import { formatOrderbookPrice, formatShareSize } from "@/lib/market/order-math";
import { useMarketOrderbook } from "@/hooks/market/use-market-orderbook";

const MAX_ASK_ROWS = 8;
const MAX_BID_ROWS = 8;

export interface OrderbookProps {
  tokenId?: string;
  className?: string;
}

export function Orderbook({ tokenId, className }: OrderbookProps) {
  const { book, loading, error } = useMarketOrderbook(tokenId);

  const asksScrollRef = useRef<HTMLDivElement>(null);

  const asks = useMemo(
    () => [...(book?.asks ?? [])].slice(0, MAX_ASK_ROWS).reverse(),
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
          "flex min-h-0 flex-1 items-center justify-center rounded-[12px] border border-[#EBEBEB] bg-white px-3 text-center text-sm text-prophet-muted",
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
        "flex min-h-0 flex-1 flex-col rounded-[12px] border border-[#EBEBEB] bg-white p-3 text-[12px]",
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
        {loading && !book ? (
          <div
            className="flex min-h-0 flex-1 items-center justify-center"
            aria-busy="true"
            aria-label="Loading order book"
          >
            <Loader2
              className="h-5 w-5 animate-spin text-[#909090]"
              aria-hidden="true"
            />
          </div>
        ) : error && !book ? (
          <div className="flex min-h-0 flex-1 items-center justify-center px-1">
            <p className="text-center text-[#FF674B]">{error}</p>
          </div>
        ) : (
          <>
            <div
              ref={asksScrollRef}
              className="flex min-h-0 flex-1 flex-col justify-end overflow-y-auto"
            >
              {asks.map((level, index) => (
                <OrderbookRow
                  key={`ask-${level.price}-${index}`}
                  price={level.price}
                  size={level.size}
                  side="ask"
                />
              ))}
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
          </>
        )}
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
