"use client";

import { useFormatOutcomeButtonDisplay } from "@/hooks/market/use-format-outcome-button-display";
import { cn } from "@/lib/cn";
import type { ComboOddsOption } from "@/views/combo/combo-item/types";

export function ComboOddsButton({
  option,
  selected,
  mutedLabel = false,
  wide = false,
  onClick
}: {
  option: ComboOddsOption;
  selected?: boolean;
  mutedLabel?: boolean;
  wide?: boolean;
  onClick?: () => void;
}) {
  const formatOutcomeDisplay = useFormatOutcomeButtonDisplay();

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex h-[50px] min-w-0 items-center justify-between rounded-[12px] border border-[#EBEBEB] px-4 text-sm leading-[18px] transition-colors",
        wide ? "min-w-[120px]" : "min-w-[96px]",
        selected
          ? "border-[#EBEBEB] bg-[linear-gradient(180deg,#666666_0%,#000000_100%)] text-white"
          : "bg-[#F9FAFC] text-black hover:bg-[#F0F2F5]"
      )}
    >
      <span
        className={cn(
          "truncate font-[500]",
          !selected && mutedLabel && "text-[#909090]"
        )}
      >
        {option.label}
      </span>
      <span className="shrink-0 pl-2 font-[600]">
        {formatOutcomeDisplay(option.price)}
      </span>
    </button>
  );
}
