"use client";

import { useFormatOutcomeButtonDisplay } from "@/hooks/market/use-format-outcome-button-display";
import { cn } from "@/lib/cn";
import {
  marketOddsButtonNarrowClassName,
  marketOddsButtonWideClassName
} from "@/views/markets/content/market-item/constants";
import type { MarketOddsOption } from "@/views/markets/content/market-item/types";

export function MarketOddsButton({
  option,
  selected,
  wide = false,
  onClick
}: {
  option: MarketOddsOption;
  selected?: boolean;
  wide?: boolean;
  onClick?: () => void;
}) {
  const formatOutcomeDisplay = useFormatOutcomeButtonDisplay();

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "box-border flex min-w-0 shrink-0 items-center justify-between rounded-[12px] border border-[#EBEBEB] px-4 text-[14px] leading-[18px] transition-colors",
        wide ? marketOddsButtonWideClassName : marketOddsButtonNarrowClassName,
        selected
          ? "bg-[linear-gradient(180deg,#666666_0%,#000000_100%)] text-white"
          : "bg-[#F9FAFC] text-black hover:bg-[#F1F2F4]"
      )}
    >
      <span className="truncate font-[500]">{option.label}</span>
      <span className="shrink-0 pl-2 text-right font-[600]">
        {formatOutcomeDisplay(option.price)}
      </span>
    </button>
  );
}
