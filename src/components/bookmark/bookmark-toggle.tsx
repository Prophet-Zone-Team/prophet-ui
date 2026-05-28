"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FocusEvent,
  type ReactNode
} from "react";

import { cn } from "@/lib/cn";
import { TrackedBookmarkIcon, UntrackedBookmarkIcon } from "@/components/bookmark/bookmark-icons";

const TOOLTIP_HIDE_DELAY_MS = 1000;

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
  const rootRef = useRef<HTMLDivElement>(null);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);

  const clearHideTimeout = useCallback(() => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
  }, []);

  const showTooltip = useCallback(() => {
    if (isTracked || !tooltip) {
      return;
    }

    clearHideTimeout();
    setIsTooltipVisible(true);
  }, [clearHideTimeout, isTracked, tooltip]);

  const scheduleHideTooltip = useCallback(() => {
    if (isTracked || !tooltip) {
      return;
    }

    clearHideTimeout();
    hideTimeoutRef.current = setTimeout(() => {
      setIsTooltipVisible(false);
      hideTimeoutRef.current = null;
    }, TOOLTIP_HIDE_DELAY_MS);
  }, [clearHideTimeout, isTracked, tooltip]);

  const handleFocusOut = useCallback(
    (event: FocusEvent<HTMLDivElement>) => {
      const nextTarget = event.relatedTarget;

      if (nextTarget instanceof Node && rootRef.current?.contains(nextTarget)) {
        return;
      }

      scheduleHideTooltip();
    },
    [scheduleHideTooltip]
  );

  useEffect(() => {
    if (isTracked) {
      clearHideTimeout();
      setIsTooltipVisible(false);
    }
  }, [clearHideTimeout, isTracked]);

  useEffect(() => clearHideTimeout, [clearHideTimeout]);

  return (
    <div
      ref={rootRef}
      className={cn("relative flex shrink-0 items-center", className)}
      onMouseEnter={showTooltip}
      onMouseLeave={scheduleHideTooltip}
      onFocusCapture={showTooltip}
      onBlurCapture={handleFocusOut}
    >
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

      {!isTracked && tooltip && isTooltipVisible ? (
        <div
          role="tooltip"
          className="absolute bottom-full left-0 md:left-1/2 md:-translate-x-1/2 z-20 w-[min(384px,calc(100vw-2rem))] pb-2"
        >
          {tooltip}
        </div>
      ) : null}
    </div>
  );
}
