"use client";

import { cn } from "@/lib/cn";

export interface OrderbookToggleProps {
  checked: boolean;
  onChange: (value: boolean) => void;
  variant?: "game" | "team";
  className?: string;
}

const trackVariantClass = {
  game: {
    on: "bg-black border-[#EAEAEA]",
    off: "bg-black border-[#EAEAEA]"
  },
  team: {
    on: "bg-black border-[#EAEAEA]",
    off: "bg-black border-[#EAEAEA]"
  }
} as const;

const labelVariantClass = {
  game: "text-[14px] leading-[18px] font-[400]",
  team: "text-base leading-[19px] font-[457]"
} as const;

export function OrderbookToggle({
  checked,
  onChange,
  variant = "game",
  className
}: OrderbookToggleProps) {
  const trackClass = checked
    ? trackVariantClass[variant].on
    : trackVariantClass[variant].off;

  return (
    <label className={cn("flex cursor-pointer items-center gap-2", className)}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label="Show orderbook"
        onClick={() => onChange(!checked)}
        className={cn(
          "relative h-4 w-[29px] shrink-0 rounded-lg border transition-colors",
          trackClass
        )}
      >
        <span
          className={cn(
            "absolute top-1/2 size-3 -translate-y-1/2 rounded-lg border border-[#EAEAEA] bg-white transition-[left]",
            checked ? "left-[calc(100%-14px)]" : "left-0.5"
          )}
          aria-hidden
        />
      </button>
      <span
        className={cn(
          "whitespace-nowrap text-[#909090]",
          labelVariantClass[variant]
        )}
      >
        Orderbook
      </span>
    </label>
  );
}
