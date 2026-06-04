"use client";

import Popover from "@/components/popover";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/cn";
import {
  formatLimitPriceInputValue,
  formatTakeProfitLimitDisabledMessage,
  parseLimitPriceDisplayValue
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
    <div className="rounded-lg border border-[#EBEBEB] bg-white px-3 py-2 text-sm font-[400] text-black shadow-[0_0_10px_0_rgba(0,0,0,0.10)]">
      {message}
    </div>
  );
}

export function TakeProfitLimitRow({
  enabled,
  disabled = false,
  disabledMessage = formatTakeProfitLimitDisabledMessage(),
  price,
  purchasePrice,
  onEnabledChange,
  onPriceChange,
  className
}: TakeProfitLimitRowProps) {
  const rowContent = (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-[500] leading-[18px] text-black">
          Take Profit Limit
        </span>
        <Switch
          checked={enabled}
          onCheckedChange={onEnabledChange}
          aria-label="Take profit limit"
          disabled={disabled}
        />
      </div>

      <div className="flex h-[46px] items-center justify-between gap-2 rounded-lg border border-[#EBEBEB] bg-white px-3">
        <span className="text-sm font-[400] leading-[18px] text-[#909090]">
          Sell at
        </span>
        <label className="sr-only" htmlFor="take-profit-limit-price">
          Take profit limit price
        </label>
        <div className="flex min-w-0 items-baseline justify-end gap-0.5">
          <span className="text-sm font-[400] leading-[18px] text-black">
            $
          </span>
          <input
            id="take-profit-limit-price"
            type="number"
            min={1}
            max={99}
            step={0.1}
            inputMode="decimal"
            readOnly={disabled}
            disabled={disabled}
            tabIndex={disabled ? -1 : undefined}
            value={formatLimitPriceInputValue(price)}
            onChange={(event) => {
              if (disabled) {
                return;
              }

              onPriceChange(
                parseLimitPriceDisplayValue(event.target.value, purchasePrice)
              );
            }}
            style={{ fieldSizing: "content" }}
            className={cn(
              "border-0 bg-transparent p-0 leading-[18px] text-black outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
              disabled && "cursor-default"
            )}
          />
        </div>
      </div>
    </div>
  );

  if (disabled) {
    return (
      <Popover
        placement="Top"
        trigger="Hover"
        triggerContainerClassName="w-full"
        content={<TakeProfitLimitTooltip message={disabledMessage} />}
      >
        {rowContent}
      </Popover>
    );
  }

  return rowContent;
}
