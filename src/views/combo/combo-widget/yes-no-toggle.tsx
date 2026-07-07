"use client";

import Popover from "@/components/popover";
import { cn } from "@/lib/cn";
import { comboTooltipClass } from "@/views/combo/combo-ui";

import type { ComboPickOutcomeSide } from "./types";

export type YesNoToggleProps = {
  value: ComboPickOutcomeSide;
  onChange?: (side: ComboPickOutcomeSide) => void;
  disabled?: boolean;
  disabledTooltip?: string;
};

export function YesNoToggle({
  value,
  onChange,
  disabled = false,
  disabledTooltip,
}: YesNoToggleProps) {
  const toggle = (
    <div
      className={cn(
        "inline-flex h-[30px] w-16 shrink-0 items-center rounded-lg border border-prophet-line bg-prophet-panel p-0.5",
        disabled && "cursor-not-allowed bg-prophet-hover",
      )}
    >
      {(["yes", "no"] as const).map((side) => {
        const active = value === side;

        return (
          <button
            key={side}
            type="button"
            aria-disabled={disabled || undefined}
            onClick={
              disabled
                ? (event) => {
                    event.preventDefault();
                    event.stopPropagation();
                  }
                : () => onChange?.(side)
            }
            className={cn(
              "flex h-[26px] flex-1 items-center justify-center rounded-md text-xs font-[500] leading-[15px] capitalize transition-colors",
              side === "yes" ? (active ? "dark:text-[#86FF00] text-white" : "dark:text-[#86FF00] text-black") : "",
              side === "no" ? (active ? "dark:text-[#FF674B] text-white" : "dark:text-[#FF674B] text-black") : "",
              disabled
                ? cn(
                    "cursor-not-allowed",
                    active
                      ? "bg-[#666666]"
                      : "bg-transparent",
                  )
                : active
                  ? "bg-black dark:bg-[#404045]"
                  : "bg-transparent",
            )}
          >
            {side}
          </button>
        );
      })}
    </div>
  );

  if (disabled && disabledTooltip) {
    return (
      <Popover
        placement="Top"
        trigger="Hover"
        contentClassName="!z-50"
        content={<div className={comboTooltipClass}>{disabledTooltip}</div>}
      >
        {toggle}
      </Popover>
    );
  }

  return toggle;
}
