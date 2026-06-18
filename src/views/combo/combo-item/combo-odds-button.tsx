"use client";

import { useFormatOutcomeButtonDisplay } from "@/hooks/market/use-format-outcome-button-display";
import { cn } from "@/lib/cn";
import type { ComboOddsOption } from "@/views/combo/combo-item/types";

export function ComboOddsButton({
  option,
  selected,
  mutedLabel = false,
  wide = false,
  compact = false,
  onClick,
}: {
  option: ComboOddsOption;
  selected?: boolean;
  mutedLabel?: boolean;
  wide?: boolean;
  /** Collapsed card: fixed cell width with truncated labels. */
  compact?: boolean;
  onClick?: () => void;
}) {
  const formatOutcomeDisplay = useFormatOutcomeButtonDisplay();

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex h-[50px] items-center justify-between rounded-[12px] border border-[#EBEBEB] px-4 text-sm leading-[18px] transition-colors",
        compact
          ? cn("min-w-0", wide ? "min-w-[120px]" : "min-w-[96px]")
          : "inline-flex w-auto max-w-full shrink-0 gap-2",
        selected
          ? "border-[#EBEBEB] bg-[linear-gradient(180deg,#666666_0%,#000000_100%)] text-white"
          : "bg-[#F9FAFC] text-black hover:bg-[#F0F2F5]"
      )}
    >
      <span
        className={cn(
          "font-[500]",
          compact
            ? "min-w-0 flex-1 truncate"
            : "whitespace-nowrap",
          !selected && mutedLabel && "text-[#909090]"
        )}
      >
        {option.label}
      </span>
      <span className={cn("shrink-0 font-[600]", compact && "pl-2")}>
        {formatOutcomeDisplay(option.price)}
      </span>
    </button>
  );
}
