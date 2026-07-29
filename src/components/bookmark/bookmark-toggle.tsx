"use client";

import { Loader2 } from "lucide-react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode
} from "react";

import { TrackedBookmarkIcon, UntrackedBookmarkIcon } from "@/components/bookmark/bookmark-icons";
import { RegionRestrictedControl } from "@/components/trading/region-restricted-control";
import { useAuth } from "@/context/auth/use-auth";
import { cn } from "@/lib/cn";
import { trackTrackClicked } from "@/lib/analytics/tracking";
import {
  resolveTrackStoreKeyFromTarget,
  type ProphetBookmarkTarget
} from "@/lib/tracks/track-status";
import { ProphetApiError } from "@/service/prophet";
import {
  useIsTrackTracked,
  useTrackPending,
  useTracksStore
} from "@/store/tracks-store";

const TOOLTIP_HIDE_DELAY_MS = 2000;

export type { ProphetBookmarkTarget } from "@/lib/tracks/track-status";

export function useProphetBookmark(
  target: ProphetBookmarkTarget,
  options?: { onTrackAuthorized?: () => void }
) {
  const { isAuthenticated, isRegionBlocked, openLoginModalOnly } = useAuth();
  const storeKey = resolveTrackStoreKeyFromTarget(target);
  const isTracked = useIsTrackTracked(storeKey);
  const isLoading = useTrackPending(storeKey);
  const trackTarget = useTracksStore((state) => state.trackTarget);
  const untrackTarget = useTracksStore((state) => state.untrackTarget);
  const targetRef = useRef(target);
  const onTrackAuthorizedRef = useRef(options?.onTrackAuthorized);

  useEffect(() => {
    targetRef.current = target;
  }, [target]);

  useEffect(() => {
    onTrackAuthorizedRef.current = options?.onTrackAuthorized;
  }, [options?.onTrackAuthorized]);

  const toggle = useCallback(async () => {
    if (isLoading) {
      return;
    }

    if (isRegionBlocked) {
      openLoginModalOnly();
      return;
    }

    if (!isAuthenticated) {
      openLoginModalOnly();
      return;
    }

    const currentTarget = targetRef.current;

    trackTrackClicked({
      teamName: currentTarget.category === "team" ? currentTarget.teamName : undefined,
      target: isTracked ? "untrack" : "track",
      entrySource: "bookmark_toggle"
    });

    if (!isTracked) {
      onTrackAuthorizedRef.current?.();
    }

    try {
      if (isTracked) {
        await untrackTarget(currentTarget);
      } else {
        await trackTarget(currentTarget);
      }
    } catch (error) {
      if (error instanceof ProphetApiError && error.code === 401) {
        openLoginModalOnly();
      }
    }
  }, [
    isAuthenticated,
    isLoading,
    isRegionBlocked,
    isTracked,
    openLoginModalOnly,
    trackTarget,
    untrackTarget
  ]);

  return {
    isTracked,
    isLoading,
    isRegionBlocked,
    toggle
  };
}

export interface BookmarkToggleProps {
  target: ProphetBookmarkTarget;
  ariaLabel: string;
  trackedAriaLabel?: string;
  tooltip?: ReactNode;
  className?: string;
}

export function BookmarkToggle({
  target,
  ariaLabel,
  trackedAriaLabel,
  tooltip,
  className
}: BookmarkToggleProps) {
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingTrackSuccessTooltipRef = useRef(false);
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);
  const markPendingTrackSuccessTooltip = useCallback(() => {
    pendingTrackSuccessTooltipRef.current = true;
  }, []);
  const { isTracked, isLoading, isRegionBlocked, toggle } = useProphetBookmark(
    target,
    { onTrackAuthorized: markPendingTrackSuccessTooltip }
  );
  const buttonAriaLabel = isTracked
    ? (trackedAriaLabel ?? ariaLabel)
    : ariaLabel;

  const clearHideTimeout = useCallback(() => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
  }, []);

  const scheduleHideTooltip = useCallback(() => {
    clearHideTimeout();
    hideTimeoutRef.current = setTimeout(() => {
      setIsTooltipVisible(false);
      hideTimeoutRef.current = null;
    }, TOOLTIP_HIDE_DELAY_MS);
  }, [clearHideTimeout]);

  const dismissTooltip = useCallback(() => {
    clearHideTimeout();
    setIsTooltipVisible(false);
  }, [clearHideTimeout]);

  useEffect(() => {
    if (!pendingTrackSuccessTooltipRef.current || isLoading) {
      return;
    }

    pendingTrackSuccessTooltipRef.current = false;

    if (isTracked && tooltip) {
      setIsTooltipVisible(true);
      scheduleHideTooltip();
    }
  }, [isLoading, isTracked, scheduleHideTooltip, tooltip]);

  useEffect(() => {
    if (!isTracked && isTooltipVisible) {
      dismissTooltip();
    }
  }, [dismissTooltip, isTracked, isTooltipVisible]);

  useEffect(() => clearHideTimeout, [clearHideTimeout]);

  const bookmarkButton = (
    <button
      type="button"
      className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-[2px] p-0 disabled:cursor-not-allowed disabled:opacity-60 md:h-5 md:w-5"
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
          className="h-[12.8px] w-[12.8px] animate-spin text-[#909090] md:h-4 md:w-4"
          aria-hidden="true"
        />
      ) : isTracked ? (
        <TrackedBookmarkIcon />
      ) : (
        <UntrackedBookmarkIcon />
      )}
    </button>
  );

  return (
    <div
      className={cn("relative flex shrink-0 items-center", className)}
      onMouseLeave={() => {
        if (isTooltipVisible) {
          dismissTooltip();
        }
      }}
    >
      <RegionRestrictedControl restricted={isRegionBlocked}>
        {bookmarkButton}
      </RegionRestrictedControl>

      {isTracked && tooltip && isTooltipVisible ? (
        <div
          role="tooltip"
          className="absolute bottom-full left-0 z-[60] w-[min(384px,calc(100vw-2rem))] pb-2 md:left-1/2 md:-translate-x-1/2"
        >
          {tooltip}
        </div>
      ) : null}
    </div>
  );
}
