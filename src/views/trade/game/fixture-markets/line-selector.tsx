"use client";

import { cn } from "@/lib/cn";
import type { FixtureLineOption } from "@/types/market";

export function LineSelector({
  options,
  value,
  onChange,
  variant = "underline"
}: {
  options: FixtureLineOption[];
  value?: string;
  onChange: (lineKey: string) => void;
  variant?: "underline" | "pill";
}) {
  if (options.length <= 1) {
    return null;
  }

  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-center gap-6",
        variant === "pill" && "gap-3"
      )}
      role="group"
      aria-label="Line selector"
    >
      {options.map((option) => {
        const isActive = option.key === value;

        if (variant === "pill") {
          return (
            <button
              key={option.key}
              type="button"
              onClick={() => onChange(option.key)}
              className={cn(
                "border bg-transparent w-[40px] md:w-[52px] h-[40px] md:h-[56px] flex items-center justify-center transition-colors rounded-[8px]",
                isActive
                  ? "border-[#EBEBEB] text-base md:text-[18px] rounded-[12px] font-[500] text-black bg-white"
                  : "border-transparent text-xs md:text-[14px] font-[400] text-[#909090] hover:text-black"
              )}
            >
              {option.label}
            </button>
          );
        }

        return (
          <button
            key={option.key}
            type="button"
            onClick={() => onChange(option.key)}
            className={cn(
              "border-0 bg-transparent px-0 pb-[10px] text-[18px] leading-[17px] transition-colors",
              isActive
                ? "border-b-2 border-black font-[556] text-black"
                : "border-b-2 border-transparent font-[457] text-[#909090] hover:text-black"
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
