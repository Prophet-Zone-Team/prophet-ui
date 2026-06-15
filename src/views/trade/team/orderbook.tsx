"use client";

import { useMemo } from "react";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/cn";
import {
  formatOrderbookTotal,
  formatShareSize,
  normalizeLimitPrice
} from "@/lib/market/order-math";
import type { OrderbookLevel } from "@/lib/market/orderbook-levels";
import { useMarketOrderbook } from "@/hooks/market/use-market-orderbook";
import {
  useSetTradeLimitPrice,
  useSetTradeOrderMode
} from "@/store/trade-ticket-store";

const MAX_ASK_ROWS = 8;
const MAX_BID_ROWS = 8;
const MAX_MIRROR_ROWS = 15;
const ORDERBOOK_ROW_HEIGHT_CLASS = "h-[21px]";
const MIRROR_ROW_HEIGHT_CLASS = "h-[31px]";
const ORDERBOOK_ASKS_HEIGHT_CLASS = "h-[168px]";
const ORDERBOOK_BIDS_HEIGHT_CLASS = "h-[168px]";
const ORDERBOOK_BODY_HEIGHT_CLASS = "h-[368px]";

export type OrderbookVariant = "stacked" | "mirror";

type OrderbookRowSlot = OrderbookLevel | "empty";

function padOrderbookRows(
  levels: OrderbookLevel[],
  maxRows: number,
  align: "start" | "end"
): OrderbookRowSlot[] {
  const sliced = levels.slice(0, maxRows);
  const emptyCount = maxRows - sliced.length;
  const empties = Array.from({ length: emptyCount }, () => "empty" as const);

  return align === "end" ? [...empties, ...sliced] : [...sliced, ...empties];
}

function formatOrderbookDisplayPrice(price: number): string {
  return (
    new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    }).format(normalizeLimitPrice(price) * 100) + "￠"
  );
}

function formatMirrorOrderbookPrice(price: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 1,
    maximumFractionDigits: 4
  }).format(normalizeLimitPrice(price));
}

export interface OrderbookProps {
  tokenId?: string;
  className?: string;
  variant?: OrderbookVariant;
}

export function Orderbook({
  tokenId,
  className,
  variant = "stacked"
}: OrderbookProps) {
  const t = useTranslations("trade");
  const { book, loading, error } = useMarketOrderbook(tokenId);
  const setLimitPrice = useSetTradeLimitPrice();
  const setOrderMode = useSetTradeOrderMode();

  const handlePriceSelect = (price: number) => {
    setLimitPrice(normalizeLimitPrice(price).toFixed(3));
    setOrderMode("limit");
  };

  const asks = useMemo(
    () =>
      padOrderbookRows(
        [...(book?.asks ?? [])].slice(0, MAX_ASK_ROWS).reverse(),
        MAX_ASK_ROWS,
        "end"
      ),
    [book]
  );
  const bids = useMemo(
    () => padOrderbookRows(book?.bids ?? [], MAX_BID_ROWS, "start"),
    [book]
  );
  const mirrorRows = useMemo(() => {
    const bidLevels = (book?.bids ?? []).slice(0, MAX_MIRROR_ROWS);
    const askLevels = (book?.asks ?? []).slice(0, MAX_MIRROR_ROWS);
    const rowCount = Math.min(
      MAX_MIRROR_ROWS,
      Math.max(bidLevels.length, askLevels.length)
    );

    if (rowCount === 0) {
      return [];
    }

    return Array.from({ length: rowCount }, (_, index) => ({
      bid: bidLevels[index],
      ask: askLevels[index]
    }));
  }, [book]);
  const maxMirrorBidSize = useMemo(
    () =>
      Math.max(
        ...(mirrorRows
          .map((row) => row.bid?.size)
          .filter((size): size is number => size !== undefined) ?? [0]),
        1
      ),
    [mirrorRows]
  );
  const maxMirrorAskSize = useMemo(
    () =>
      Math.max(
        ...(mirrorRows
          .map((row) => row.ask?.size)
          .filter((size): size is number => size !== undefined) ?? [0]),
        1
      ),
    [mirrorRows]
  );
  const marketPrice = book?.marketPrice;
  const isMirror = variant === "mirror";

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
        "flex min-h-0 flex-1 flex-col text-[12px]",
        isMirror
          ? "bg-white px-4 pb-4 pt-2"
          : "rounded-[12px] border border-[#EBEBEB] bg-white p-3",
        className
      )}
      aria-label={t("marketOrderBookAria")}
    >
      {isMirror ? (
        <div className="flex shrink-0 justify-between pb-2 font-[400] leading-[15px] text-[#909090]">
          <span>{t("buy")}</span>
          <span>{t("sell")}</span>
        </div>
      ) : (
        <>
          <div className="text-[18px] font-[500] pb-[10px] text-black">
            {t("orderbook")}
          </div>
          <div className="grid shrink-0 grid-cols-2 gap-2 px-1 pb-2 font-[400] leading-[17px] text-[#909090]">
            <span>{t("price")}</span>
            <span className="text-right">{t("shares")}</span>
          </div>
        </>
      )}

      <div
        className={cn(
          "relative flex shrink-0 flex-col overflow-hidden",
          !isMirror && ORDERBOOK_BODY_HEIGHT_CLASS
        )}
      >
        {loading && !book ? (
          <div
            className={cn(
              "absolute inset-0 z-10 flex items-center justify-center bg-white",
              isMirror && "min-h-[200px]"
            )}
            aria-busy="true"
            aria-label={t("loadingOrderBookAria")}
          >
            <Loader2
              className="h-5 w-5 animate-spin text-[#909090]"
              aria-hidden="true"
            />
          </div>
        ) : null}

        {error && !book ? (
          <div
            className={cn(
              "absolute inset-0 z-10 flex items-center justify-center bg-white px-1",
              isMirror && "min-h-[200px]"
            )}
          >
            <p className="text-center text-[#909090]">{t("noData")}</p>
          </div>
        ) : null}

        {isMirror ? (
          mirrorRows.map((row, index) => (
            <MirrorOrderbookRow
              key={`mirror-${index}`}
              bid={row.bid}
              ask={row.ask}
              maxBidSize={maxMirrorBidSize}
              maxAskSize={maxMirrorAskSize}
              onSelect={handlePriceSelect}
            />
          ))
        ) : (
          <>
            <div
              className={cn(
                "flex shrink-0 flex-col overflow-hidden",
                ORDERBOOK_ASKS_HEIGHT_CLASS
              )}
            >
              {asks.map((level, index) =>
                level === "empty" ? (
                  <OrderbookEmptyRow key={`ask-empty-${index}`} />
                ) : (
                  <OrderbookRow
                    key={`ask-${level.price}-${index}`}
                    price={level.price}
                    size={level.size}
                    side="ask"
                    onSelect={handlePriceSelect}
                  />
                )
              )}
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

            <div
              className={cn(
                "flex shrink-0 flex-col overflow-hidden",
                ORDERBOOK_BIDS_HEIGHT_CLASS
              )}
            >
              {bids.map((level, index) =>
                level === "empty" ? (
                  <OrderbookEmptyRow key={`bid-empty-${index}`} />
                ) : (
                  <OrderbookRow
                    key={`bid-${level.price}-${index}`}
                    price={level.price}
                    size={level.size}
                    side="bid"
                    onSelect={handlePriceSelect}
                  />
                )
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function OrderbookEmptyRow() {
  return <div className={ORDERBOOK_ROW_HEIGHT_CLASS} aria-hidden="true" />;
}

function MirrorOrderbookRow({
  bid,
  ask,
  maxBidSize,
  maxAskSize,
  onSelect
}: {
  bid?: OrderbookLevel;
  ask?: OrderbookLevel;
  maxBidSize: number;
  maxAskSize: number;
  onSelect: (price: number) => void;
}) {
  const t = useTranslations("trade");

  if (!bid && !ask) {
    return <div className={MIRROR_ROW_HEIGHT_CLASS} aria-hidden="true" />;
  }

  const bidBarWidth = bid ? (bid.size / maxBidSize) * 100 : 0;
  const askBarWidth = ask ? (ask.size / maxAskSize) * 100 : 0;

  return (
    <div className={cn("relative flex w-full", MIRROR_ROW_HEIGHT_CLASS)}>
      <div className="relative flex min-w-0 flex-1 items-center justify-end px-1">
        {bid ? (
          <>
            <span className="absolute left-0 z-10 max-w-[45%] truncate pr-1 text-right font-[400] leading-[15px] text-black">
              {formatOrderbookTotal(bid.size, bid.price)}
            </span>
            <div
              className="absolute right-0 top-0 h-full bg-[#65AF14]/15"
              style={{ width: `${bidBarWidth}%` }}
              aria-hidden="true"
            />
            <button
              type="button"
              onClick={() => onSelect(bid.price)}
              className="relative z-10 shrink-0 bg-transparent p-0 font-[400] leading-[15px] text-[#65AF14] transition-colors hover:opacity-80"
              aria-label={t("setLimitPriceTo", {
                price: formatMirrorOrderbookPrice(bid.price)
              })}
            >
              {formatMirrorOrderbookPrice(bid.price)}
            </button>
          </>
        ) : null}
      </div>

      <div className="relative flex min-w-0 flex-1 items-center justify-start px-1">
        {ask ? (
          <>
            <button
              type="button"
              onClick={() => onSelect(ask.price)}
              className="relative z-10 shrink-0 bg-transparent p-0 font-[400] leading-[15px] text-[#FF674B] transition-colors hover:opacity-80"
              aria-label={t("setLimitPriceTo", {
                price: formatMirrorOrderbookPrice(ask.price)
              })}
            >
              {formatMirrorOrderbookPrice(ask.price)}
            </button>
            <div
              className="absolute left-0 top-0 h-full bg-[#FF674B]/15"
              style={{ width: `${askBarWidth}%` }}
              aria-hidden="true"
            />
            <span className="absolute right-0 z-10 max-w-[45%] truncate pl-1 text-right font-[400] leading-[15px] text-black">
              {formatOrderbookTotal(ask.size, ask.price)}
            </span>
          </>
        ) : null}
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
        "grid w-full grid-cols-2 gap-2 rounded px-1 text-left leading-[17px] transition-colors",
        ORDERBOOK_ROW_HEIGHT_CLASS,
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
