"use client";

import Popover from "@/components/popover";
import { useComboFormatOutcomeButtonDisplay } from "@/views/combo/combo-outcome-display-context";
import { cn } from "@/lib/cn";
import type { ComboOddsOption } from "@/views/combo/combo-item/types";

export function ComboOddsButton({
  option,
  selected,
  disabled: disabledProp,
  disabledTooltip: disabledTooltipProp,
  mutedLabel = false,
  wide = false,
  compact = false,
  mobile = false,
  onClick,
  className,
}: {
  option: ComboOddsOption;
  selected?: boolean;
  disabled?: boolean;
  disabledTooltip?: string;
  mutedLabel?: boolean;
  wide?: boolean;
  /** Collapsed card: fixed cell width with truncated labels. */
  compact?: boolean;
  mobile?: boolean;
  onClick?: () => void;
  className?: string;
}) {
  const formatOutcomeDisplay = useComboFormatOutcomeButtonDisplay();
  const disabled = disabledProp ?? option.disabled ?? false;
  const disabledTooltip = disabledTooltipProp ?? option.disabledTooltip;

  const button = (
    <button
      type="button"
      aria-disabled={disabled || undefined}
      onClick={
        disabled
          ? (event) => {
              event.preventDefault();
              event.stopPropagation();
            }
          : onClick
      }
      className={cn(
        "flex items-center justify-between border border-[#EBEBEB] transition-colors",
        mobile
          ? "h-[42px] rounded-[10px] px-2 text-xs leading-[15px]"
          : "rounded-[12px] text-sm leading-[18px]",
        compact && !mobile
          ? cn(
              "h-[44px] min-w-0 w-full px-2.5 sm:h-[50px] sm:px-4",
              wide ? "sm:min-w-[120px]" : "sm:min-w-[96px]"
            )
          : null,
        !compact && !mobile
          ? "inline-flex h-[50px] w-auto max-w-full shrink-0 gap-2 px-4"
          : null,
        compact && mobile ? "min-w-0 w-full" : null,
        disabled
          ? "cursor-not-allowed border-[#EBEBEB] bg-[#F3F4F6] text-[#909090]"
          : selected
            ? "border-[#EBEBEB] bg-[linear-gradient(180deg,#666666_0%,#000000_100%)] text-white"
            : "bg-[#F9FAFC] text-black hover:bg-[#F0F2F5]",
        className
      )}
    >
      <span
        className={cn(
          "font-[500]",
          compact || mobile ? "min-w-0 flex-1 truncate" : "whitespace-nowrap",
          !selected && !disabled && mutedLabel && "text-[#909090]",
          selected && mutedLabel && "text-white"
        )}
      >
        {option.label}
      </span>
      <span className={cn("shrink-0 font-[600]", (compact || mobile) && "pl-1.5")}>
        {formatOutcomeDisplay(option.price)}
      </span>
    </button>
  );

  if (disabled && disabledTooltip) {
    return (
      <Popover
        placement="Bottom"
        trigger="Hover"
        content={
          <div className="rounded-lg border border-[#EBEBEB] bg-white px-3 py-2 text-sm font-[400] text-black shadow-[0_0_10px_0_rgba(0,0,0,0.10)]">
            {disabledTooltip}
          </div>
        }
      >
        {button}
      </Popover>
    );
  }

  return button;
}
