"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/cn";
import { formatShareSize, normalizeLimitPrice } from "@/lib/market/order-math";
import { useMarketOrderbook } from "@/hooks/market/use-market-orderbook";
import {
  useSetTradeLimitPrice,
  useSetTradeOrderMode
} from "@/store/trade-ticket-store";

const MAX_ASK_ROWS = 8;
const MAX_BID_ROWS = 8;

function formatOrderbookDisplayPrice(price: number): string {
  return (
    new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    }).format(normalizeLimitPrice(price) * 100) + "￠"
  );
}

export interface OrderbookProps {
  tokenId?: string;
  className?: string;
}

export function Orderbook({ tokenId, className }: OrderbookProps) {
  const t = useTranslations("trade");
  const { book, loading, error } = useMarketOrderbook(tokenId);
  const setLimitPrice = useSetTradeLimitPrice();
  const setOrderMode = useSetTradeOrderMode();

  const handlePriceSelect = (price: number) => {
    setLimitPrice(normalizeLimitPrice(price).toFixed(3));
    setOrderMode("limit");
  };

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
        {t("orderbookUnavailable")}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex min-h-0 flex-1 flex-col rounded-[12px] border border-[#EBEBEB] bg-white p-3 text-[12px]",
        className
      )}
      aria-label={t("marketOrderBookAria")}
    >
      <div className="text-[18px] font-[500] pb-[10px] text-black">
        {t("orderbook")}
      </div>
      <div className="grid shrink-0 grid-cols-2 gap-2 px-1 pb-2 font-[400] leading-[17px] text-[#909090]">
        <span>{t("price")}</span>
        <span className="text-right">{t("shares")}</span>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {loading && !book ? (
          <div
            className="flex min-h-0 flex-1 items-center justify-center"
            aria-busy="true"
            aria-label={t("loadingOrderBookAria")}
          >
            <Loader2
              className="h-5 w-5 animate-spin text-[#909090]"
              aria-hidden="true"
            />
          </div>
        ) : error && !book ? (
          <div className="flex min-h-0 flex-1 items-center justify-center px-1">
            <p className="text-center text-[#909090]">{t("noData")}</p>
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
                  onSelect={handlePriceSelect}
                />
              ))}
            </div>

            <div className="mx-[-4px] flex h-8 shrink-0 items-center justify-between bg-[#EBEBEB] px-2">
              <span className="font-[400] leading-[17px] text-black">
                {marketPrice !== undefined
                  ? formatOrderbookDisplayPrice(marketPrice)
                  : "—"}
              </span>
              <span className="font-[400] leading-[17px] text-[#909090]">
                {t("marketPrice")}
              </span>
            </div>

            <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
              {bids.map((level, index) => (
                <OrderbookRow
                  key={`bid-${level.price}-${index}`}
                  price={level.price}
                  size={level.size}
                  side="bid"
                  onSelect={handlePriceSelect}
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
  side,
  onSelect
}: {
  price: number;
  size: number;
  side: "ask" | "bid";
  onSelect: (price: number) => void;
}) {
  const t = useTranslations("trade");
  const priceLabel = formatOrderbookDisplayPrice(price);

  return (
    <button
      type="button"
      onClick={() => onSelect(price)}
      className={cn(
        "grid w-full grid-cols-2 gap-2 rounded px-1 py-0.5 text-left leading-[17px] transition-colors",
        side === "ask"
          ? "hover:bg-[#FF674B]/10 active:bg-[#FF674B]/15"
          : "hover:bg-[#65AF14]/10 active:bg-[#65AF14]/15"
      )}
      aria-label={t("setLimitPriceTo", { price: priceLabel })}
    >
      <span
        className={cn(
          "font-[400]",
          side === "ask" ? "text-[#FF674B]" : "text-[#65AF14]"
        )}
      >
        {priceLabel}
      </span>
      <span className="text-right font-[400] text-black">
        {formatShareSize(size)}
      </span>
    </button>
  );
}
