"use client";

import { cn } from "@/lib/cn";

export interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  "aria-label": string;
  className?: string;
  disabled?: boolean;
}

export function Switch({
  checked,
  onCheckedChange,
  "aria-label": ariaLabel,
  className,
  disabled = false
}: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "relative h-4 w-[29px] shrink-0 rounded-lg border border-[#EAEAEA] transition-colors",
        checked ? "bg-[#000]" : "bg-[#EBEBEB]",
        disabled && "cursor-not-allowed opacity-50",
        className
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
  );
}
