"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

import Popover from "@/components/popover";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/cn";
import {
  formatLimitPriceInputValue,
  isCompleteLimitPriceDisplayValue,
  LIMIT_BUY_MIN_SHARES,
  parseLimitPriceDisplayValue,
  sanitizeLimitPriceDisplayInput
} from "@/lib/market/order-math";

export interface TakeProfitLimitRowProps {
  enabled: boolean;
  disabled?: boolean;
  disabledMessage?: string;
  price: string;
  purchasePrice: number;
  onEnabledChange: (value: boolean) => void;
  onPriceChange: (value: string) => void;
  className?: string;
}

function TakeProfitLimitTooltip({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-prophet-line bg-prophet-panel px-3 py-2 text-sm font-[400] text-prophet-foreground shadow-[0_0_10px_0_rgba(0,0,0,0.10)]">
      {message}
    </div>
  );
}

export function TakeProfitLimitRow({
  enabled,
  disabled = false,
  disabledMessage,
  price,
  purchasePrice,
  onEnabledChange,
  onPriceChange,
  className
}: TakeProfitLimitRowProps) {
  const t = useTranslations("trade");
  const [displayValue, setDisplayValue] = useState(() =>
    formatLimitPriceInputValue(price)
  );
  const lastEmittedPriceRef = useRef(price);

  useEffect(() => {
    if (price === lastEmittedPriceRef.current) {
      return;
    }

    lastEmittedPriceRef.current = price;
    setDisplayValue(formatLimitPriceInputValue(price));
  }, [price]);

  const resolvedDisabledMessage =
    disabledMessage ??
    t("takeProfitLimitDisabled", { minShares: LIMIT_BUY_MIN_SHARES });
  const rowContent = (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-[500] leading-[18px] text-prophet-foreground">
          {t("takeProfitLimit")}
        </span>
        <Switch
          checked={enabled}
          onCheckedChange={onEnabledChange}
          aria-label={t("takeProfitLimitSrOnly")}
          disabled={disabled}
        />
      </div>

      {enabled ? (
        <div className="flex h-[46px] items-center justify-between gap-2 rounded-lg border border-[#EBEBEB] bg-white px-3">
          <span className="text-sm font-[400] leading-[18px] text-[#909090]">
            {t("sellAt")}
          </span>
          <label className="sr-only" htmlFor="take-profit-limit-price">
            {t("takeProfitLimitPriceSrOnly")}
          </label>
          <div className="flex min-w-0 items-baseline justify-end gap-0.5">
            <span className="text-sm font-[400] leading-[18px] text-black">
              ￠
            </span>
            <input
              id="take-profit-limit-price"
              type="text"
              inputMode="decimal"
              readOnly={disabled}
              disabled={disabled}
              tabIndex={disabled ? -1 : undefined}
              autoFocus={true}
              value={displayValue}
              onChange={(event) => {
                if (disabled) {
                  return;
                }

                const sanitized = sanitizeLimitPriceDisplayInput(
                  event.target.value
                );
                setDisplayValue(sanitized);

                if (sanitized === "") {
                  lastEmittedPriceRef.current = "";
                  onPriceChange("");
                  return;
                }

                if (!isCompleteLimitPriceDisplayValue(sanitized)) {
                  return;
                }

                const parsed = parseLimitPriceDisplayValue(
                  sanitized,
                  purchasePrice
                );
                lastEmittedPriceRef.current = parsed;
                onPriceChange(parsed);
              }}
              style={{ fieldSizing: "content" }}
              className={cn(
                "border-0 min-w-[16px] bg-transparent p-0 leading-[18px] text-black outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
                disabled && "cursor-default"
              )}
            />
          </div>
        </div>
      ) : null}
    </div>
  );

  if (disabled) {
    return (
      <Popover
        placement="Top"
        trigger="Hover"
        triggerContainerClassName="w-full"
        content={<TakeProfitLimitTooltip message={resolvedDisabledMessage} />}
      >
        {rowContent}
      </Popover>
    );
  }

  return rowContent;
}
