"use client";

import { Loader2 } from "lucide-react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FocusEvent,
  type ReactNode
} from "react";

import { TrackedBookmarkIcon, UntrackedBookmarkIcon } from "@/components/bookmark/bookmark-icons";
import { useAuth } from "@/context/auth/use-auth";
import { cn } from "@/lib/cn";
import {
  buildTrackRequest,
  buildUntrackRequest,
  resolveTrackStoreKeyFromTarget,
  type ProphetBookmarkTarget
} from "@/lib/tracks/track-status";
import {
  isProphetAuthenticated,
  ProphetApiError,
  trackProphet,
  untrackProphet
} from "@/service/prophet";
import {
  useIsTrackKeyTracked,
  useTrackStatusStore
} from "@/store/track-status-store";

const TOOLTIP_HIDE_DELAY_MS = 1000;

export type { ProphetBookmarkTarget } from "@/lib/tracks/track-status";

export function useProphetBookmark(
  target: ProphetBookmarkTarget,
  options?: { onUntracked?: (target: ProphetBookmarkTarget) => void }
) {
  const { openLogin } = useAuth();
  const storeKey = resolveTrackStoreKeyFromTarget(target);
  const isTracked = useIsTrackKeyTracked(storeKey);
  const setTracked = useTrackStatusStore((state) => state.setTracked);
  const [isLoading, setIsLoading] = useState(false);
  const targetRef = useRef(target);
  const onUntrackedRef = useRef(options?.onUntracked);

  useEffect(() => {
    targetRef.current = target;
  }, [target]);

  useEffect(() => {
    onUntrackedRef.current = options?.onUntracked;
  }, [options?.onUntracked]);

  const toggle = useCallback(async () => {
    if (isLoading) {
      return;
    }

    if (!isProphetAuthenticated()) {
      await openLogin();
      return;
    }

    const currentTarget = targetRef.current;
    const currentKey = resolveTrackStoreKeyFromTarget(currentTarget);
    const nextTracked = !isTracked;
    const previousTracked = isTracked;

    setIsLoading(true);
    setTracked(currentKey, nextTracked);

    try {
      if (nextTracked) {
        await trackProphet(buildTrackRequest(currentTarget));
      } else {
        await untrackProphet(buildUntrackRequest(currentTarget));
        onUntrackedRef.current?.(currentTarget);
      }
    } catch (error) {
      setTracked(currentKey, previousTracked);

      if (error instanceof ProphetApiError && error.code === 401) {
        await openLogin();
      }
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, isTracked, openLogin, setTracked]);

  return {
    isTracked,
    isLoading,
    toggle
  };
}

export interface BookmarkToggleProps {
  target: ProphetBookmarkTarget;
  ariaLabel: string;
  trackedAriaLabel?: string;
  tooltip?: ReactNode;
  className?: string;
  onUntracked?: (target: ProphetBookmarkTarget) => void;
}

export function BookmarkToggle({
  target,
  ariaLabel,
  trackedAriaLabel,
  tooltip,
  className,
  onUntracked
}: BookmarkToggleProps) {
  const { isTracked, isLoading, toggle } = useProphetBookmark(target, {
    onUntracked
  });
  const rootRef = useRef<HTMLDivElement>(null);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);
  const buttonAriaLabel = isTracked
    ? (trackedAriaLabel ?? ariaLabel)
    : ariaLabel;

  const clearHideTimeout = useCallback(() => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
  }, []);

  const showTooltip = useCallback(() => {
    if (isTracked || !tooltip || isLoading) {
      return;
    }

    clearHideTimeout();
    setIsTooltipVisible(true);
  }, [clearHideTimeout, isLoading, isTracked, tooltip]);

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
        className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-[2px] p-0 disabled:cursor-not-allowed disabled:opacity-60"
        aria-pressed={isTracked}
        aria-busy={isLoading}
        aria-label={buttonAriaLabel}
        disabled={isLoading}
        onClick={(event) => {
          event.stopPropagation();
          void toggle();
        }}
      >
        {isLoading ? (
          <Loader2
            className="h-4 w-4 animate-spin text-[#909090]"
            aria-hidden="true"
          />
        ) : isTracked ? (
          <TrackedBookmarkIcon />
        ) : (
          <UntrackedBookmarkIcon />
        )}
      </button>

      {!isTracked && tooltip && isTooltipVisible ? (
        <div
          role="tooltip"
          className="absolute bottom-full left-0 z-20 w-[min(384px,calc(100vw-2rem))] pb-2 md:left-1/2 md:-translate-x-1/2"
        >
          {tooltip}
        </div>
      ) : null}
    </div>
  );
}
