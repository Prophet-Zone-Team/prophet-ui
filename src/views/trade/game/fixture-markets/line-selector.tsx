"use client";

import { cn } from "@/lib/cn";
import type { FixtureLineOption } from "@/types/market";

export function LineSelector({
  options,
  value,
  onChange
}: {
  options: FixtureLineOption[];
  value?: string;
  onChange: (lineKey: string) => void;
}) {
  if (options.length <= 1) {
    return null;
  }

  return (
    <div
      className="flex flex-wrap items-center justify-center gap-6"
      role="group"
      aria-label="Line selector"
    >
      {options.map((option) => {
        const isActive = option.key === value;

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
