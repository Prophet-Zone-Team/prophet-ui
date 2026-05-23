"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/cn";
import { TrackedBookmarkIcon, UntrackedBookmarkIcon } from "@/components/bookmark/bookmark-icons";

export interface BookmarkToggleProps {
  isTracked: boolean;
  ariaLabel: string;
  onToggle: () => void;
  tooltip?: ReactNode;
  className?: string;
}

export function BookmarkToggle({
  isTracked,
  ariaLabel,
  onToggle,
  tooltip,
  className
}: BookmarkToggleProps) {
  return (
    <div className={cn("group relative shrink-0", className)}>
      <button
        type="button"
        className="inline-flex shrink-0 items-center justify-center rounded-[2px] p-0"
        aria-pressed={isTracked}
        aria-label={ariaLabel}
        onClick={(event) => {
          event.stopPropagation();
          onToggle();
        }}
      >
        {isTracked ? <TrackedBookmarkIcon /> : <UntrackedBookmarkIcon />}
      </button>

      {!isTracked && tooltip ? (
        <div
          role="tooltip"
          className={cn(
            "pointer-events-none absolute bottom-full left-0 z-20 mb-2 hidden w-[min(384px,calc(100vw-2rem))]",
            "group-hover:block group-focus-within:block"
          )}
        >
          {tooltip}
        </div>
      ) : null}
    </div>
  );
}
