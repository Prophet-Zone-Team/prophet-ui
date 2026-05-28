"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

import { cn } from "@/lib/cn";

import type { TrackCardSignalItem } from "../types";
import { SignalFeedItem } from "./signal-feed-item";

export type SignalFeedProps = {
  items: TrackCardSignalItem[];
  className?: string;
};

function renderFeedItems(
  items: TrackCardSignalItem[],
  options: { truncateHeadline: boolean; keySuffix?: string }
) {
  const suffix = options.keySuffix ?? "";

  return items.map((item) => (
    <SignalFeedItem
      key={`${item.id}${suffix}`}
      item={item}
      truncateHeadline={options.truncateHeadline}
    />
  ));
}

export function SignalFeed({ items, className }: SignalFeedProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const [canScroll, setCanScroll] = useState(false);
  const [duration, setDuration] = useState(20);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => {
      setPrefersReducedMotion(mediaQuery.matches);
    };

    updatePreference();
    mediaQuery.addEventListener("change", updatePreference);

    return () => mediaQuery.removeEventListener("change", updatePreference);
  }, []);

  useLayoutEffect(() => {
    const container = containerRef.current;
    const measureTrack = measureRef.current;

    if (!container || !measureTrack) {
      return;
    }

    const updateOverflow = () => {
      const overflows = measureTrack.scrollWidth > container.clientWidth + 1;
      setCanScroll(overflows);

      if (overflows) {
        setDuration(Math.max(12, measureTrack.scrollWidth / 60));
      }
    };

    updateOverflow();

    const observer = new ResizeObserver(updateOverflow);
    observer.observe(container);
    observer.observe(measureTrack);

    return () => observer.disconnect();
  }, [items]);

  if (items.length === 0) {
    return (
      <p className="m-0 min-w-0 flex-1 truncate text-[16px] font-[400] leading-[20px] text-[#909090]">
        No related signals available.
      </p>
    );
  }

  const useMarquee = canScroll && !prefersReducedMotion;

  return (
    <div
      ref={containerRef}
      className={cn(
        "group relative w-full min-w-0 overflow-hidden md:w-[75%]",
        "before:pointer-events-none before:absolute before:inset-y-0 before:right-0 before:z-[1] before:w-16 before:bg-gradient-to-l before:from-[#EDF0F3] before:to-transparent",
        className
      )}
      aria-label="Related signals"
      aria-live="off"
    >
      <div
        ref={measureRef}
        className="pointer-events-none invisible absolute left-0 top-0 flex w-max items-center gap-6"
        aria-hidden
      >
        {renderFeedItems(items, { truncateHeadline: false })}
      </div>

      <div
        className={cn(
          "flex w-max items-center gap-6 pr-10 cursor-pointer",
          useMarquee &&
            "motion-safe:animate-track-signal-feed-marquee motion-safe:[animation-play-state:paused] motion-safe:group-hover:[animation-play-state:running]",
          canScroll &&
            prefersReducedMotion &&
            "overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        )}
        style={useMarquee ? { animationDuration: `${duration}s` } : undefined}
      >
        {renderFeedItems(items, { truncateHeadline: !canScroll })}
        {useMarquee
          ? renderFeedItems(items, {
              truncateHeadline: false,
              keySuffix: "-dup"
            })
          : null}
      </div>
    </div>
  );
}
