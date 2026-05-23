"use client";

import { useLayoutEffect, useRef, useState } from "react";

import {
  buildProbabilityClips,
  getSlantOffsetPx,
  type MatchOutcomeProbabilities
} from "../../../lib/market/matchProbabilityBar";
import { cn } from "../../../lib/cn";

export interface MatchProbabilityBarProps {
  probabilities: MatchOutcomeProbabilities;
  variant?: "compact" | "hero";
  className?: string;
}

export function MatchProbabilityBar({
  probabilities,
  variant = "compact",
  className
}: MatchProbabilityBarProps) {
  const [slantPx, setContainerRef] = useSlantOffsetPx(
    variant === "hero" ? 345 : 8
  );
  const slant = Math.round(slantPx);
  const { homeClip, drawClip, awayClip } = buildProbabilityClips(
    probabilities,
    slant
  );

  return (
    <div
      ref={setContainerRef}
      className={cn(
        "relative w-full overflow-hidden rounded-full",
        variant === "compact" ? "h-2" : "min-h-[345px]",
        className
      )}
      aria-hidden
    >
      <ProbabilitySegmentFill background="#3168FF" clipPath={homeClip} />
      <ProbabilitySegmentFill background="#D9D9D9" clipPath={drawClip} />
      <ProbabilitySegmentFill background="#F4B600" clipPath={awayClip} />
    </div>
  );
}

function ProbabilitySegmentFill({
  background,
  clipPath
}: {
  background: string;
  clipPath: string;
}) {
  return (
    <div
      className="pointer-events-none absolute inset-0"
      style={{ background, clipPath }}
    />
  );
}

function useSlantOffsetPx(defaultHeight: number): [number, (node: HTMLDivElement | null) => void] {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [slantPx, setSlantPx] = useState(() => getSlantOffsetPx(defaultHeight));

  useLayoutEffect(() => {
    const element = containerRef.current;

    if (!element) {
      return;
    }

    const update = () => {
      const rect = element.getBoundingClientRect();
      setSlantPx(getSlantOffsetPx(rect.height, rect.width));
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  const setContainerRef = (node: HTMLDivElement | null) => {
    containerRef.current = node;
  };

  return [slantPx, setContainerRef];
}

export { buildProbabilityClips, getSlantOffsetPx } from "../../../lib/market/matchProbabilityBar";
