"use client";

import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/cn";

export function ExpandToggle({
  expanded,
  totalCount,
  onToggle
}: {
  expanded: boolean;
  totalCount: number;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onToggle();
      }}
      className="inline-flex shrink-0 items-center gap-1.5 text-[14px] font-[400] leading-[18px] text-black transition-opacity hover:opacity-70"
      aria-expanded={expanded}
    >
      <span>All Odds ({totalCount})</span>
      <ChevronDown
        className={cn(
          "size-3.5 text-[#909090] transition-transform duration-200",
          expanded && "rotate-180"
        )}
        aria-hidden
      />
    </button>
  );
}
