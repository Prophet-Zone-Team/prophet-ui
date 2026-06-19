"use client";

import { ChevronRight } from "lucide-react";

export function MobileOddsExpandButton({
  onClick,
  ariaLabel = "View all odds"
}: {
  onClick?: () => void;
  ariaLabel?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className="inline-flex h-[42px] w-8 shrink-0 items-center justify-center rounded-[10px] border border-[#EBEBEB] bg-[#F9FAFC] transition-colors hover:bg-[#F0F2F5]"
    >
      <ChevronRight className="size-4 text-[#909090]" strokeWidth={1.6} aria-hidden />
    </button>
  );
}
