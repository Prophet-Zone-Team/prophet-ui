"use client";

import { useEffect, useState } from "react";

function formatLiveMatchClock(totalSeconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;
  const paddedSeconds = String(seconds).padStart(2, "0");

  return `${minutes} : ${paddedSeconds}'`;
}

export function resolveLiveMatchClockBaseSeconds(
  liveElapsedSeconds: number | undefined,
  kickoffAt: string | undefined,
  isLive: boolean
): number | undefined {
  if (liveElapsedSeconds !== undefined) {
    return liveElapsedSeconds;
  }

  if (!isLive || !kickoffAt) {
    return undefined;
  }

  const kickoffMs = Date.parse(kickoffAt);

  if (Number.isNaN(kickoffMs)) {
    return undefined;
  }

  return Math.max(0, Math.floor((Date.now() - kickoffMs) / 1000));
}

export type LiveMatchElapsedClockProps = {
  baseElapsedSeconds?: number;
  kickoffAt?: string;
  isLive: boolean;
  className?: string;
};

export function LiveMatchElapsedClock({
  baseElapsedSeconds,
  kickoffAt,
  isLive,
  className
}: LiveMatchElapsedClockProps) {
  const resolvedBase = resolveLiveMatchClockBaseSeconds(
    baseElapsedSeconds,
    kickoffAt,
    isLive
  );
  const [elapsedSeconds, setElapsedSeconds] = useState(resolvedBase);

  useEffect(() => {
    setElapsedSeconds(
      resolveLiveMatchClockBaseSeconds(baseElapsedSeconds, kickoffAt, isLive)
    );
  }, [baseElapsedSeconds, isLive, kickoffAt]);

  useEffect(() => {
    if (!isLive || resolvedBase === undefined) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setElapsedSeconds((current) => (current ?? resolvedBase) + 1);
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [isLive, resolvedBase]);

  if (!isLive || elapsedSeconds === undefined) {
    return null;
  }

  return <span className={className}>{formatLiveMatchClock(elapsedSeconds)}</span>;
}
