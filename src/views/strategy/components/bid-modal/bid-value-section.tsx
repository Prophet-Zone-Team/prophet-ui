import { cn } from "@/lib/cn";
import { tradeQuickAmountClass } from "@/views/trade/trade-widget/trade-ui";

import { STRATEGY_BID_INVALID_SURFACE_CLASS, STRATEGY_BID_QUICK_FRACTIONS } from "./constants";

export type BidValueSectionProps = {
  bidAmountInput: string;
  balanceLabel: string;
  minBidLabel?: string;
  insufficientFunds?: boolean;
  aggregateError?: string;
  onBidAmountChange: (value: string) => void;
  onApplyBalanceFraction: (fraction: number) => void;
  onApplyMinBidAmount?: () => void;
  className?: string;
};

export function BidValueSection({
  bidAmountInput,
  balanceLabel,
  minBidLabel,
  insufficientFunds = false,
  aggregateError,
  onBidAmountChange,
  onApplyBalanceFraction,
  onApplyMinBidAmount,
  className
}: BidValueSectionProps) {
  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {minBidLabel ? (
        <div className="flex items-center justify-end gap-1">
          <span className="font-[Sora] text-sm font-light leading-[18px] text-[#909090]">
            Min. bid value:
          </span>
          <button
            type="button"
            onClick={onApplyMinBidAmount}
            className="font-[Sora] text-sm font-normal leading-[18px] text-black underline"
          >
            {minBidLabel}
          </button>
        </div>
      ) : null}

      <div
        className={cn(
          "flex h-[57px] items-center justify-between rounded-md border bg-white px-4",
          insufficientFunds
            ? STRATEGY_BID_INVALID_SURFACE_CLASS
            : "border-[#EBEBEB]"
        )}
      >
        <span className="font-[Sora] text-sm font-normal leading-[18px] text-black">
          Bid Value
        </span>
        <label className="sr-only" htmlFor="strategy-bid-amount">
          Bid value in USDC
        </label>
        <div className="flex items-baseline font-[Sora] text-xl font-medium leading-[25px] text-black">
          <span aria-hidden="true">$</span>
          <input
            id="strategy-bid-amount"
            type="number"
            min={0}
            inputMode="decimal"
            value={bidAmountInput}
            onChange={(event) => onBidAmountChange(event.target.value)}
            style={{
              fieldSizing: "content"
            }}
            className="border-0 bg-transparent p-0 text-right outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
        </div>
      </div>

      {aggregateError ? (
        <p className="m-0 text-sm leading-[18px] text-[#FF674B]">
          {aggregateError}
        </p>
      ) : null}

      <div className="flex items-center justify-between gap-3">
        <span className="font-[Sora] text-sm font-normal leading-[18px] text-[#909090]">
          Bal. {balanceLabel}
        </span>
        <div className="flex flex-wrap justify-end gap-2">
          {STRATEGY_BID_QUICK_FRACTIONS.map(({ label, value }) => (
            <button
              key={label}
              type="button"
              className={cn(
                tradeQuickAmountClass,
                "h-[30px] rounded-lg px-3 text-[#909090]"
              )}
              onClick={() => onApplyBalanceFraction(value)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
