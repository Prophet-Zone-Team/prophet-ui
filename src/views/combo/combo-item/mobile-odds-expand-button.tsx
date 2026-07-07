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
      className="inline-flex h-[42px] w-8 shrink-0 items-center justify-center rounded-[10px] border border-prophet-line bg-prophet-action-panel transition-colors hover:bg-prophet-hover"
    >
      <ChevronRight className="size-4 text-prophet-muted" strokeWidth={1.6} aria-hidden />
    </button>
  );
}
