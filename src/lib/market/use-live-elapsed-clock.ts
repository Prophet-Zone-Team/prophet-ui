"use client";

import { useEffect, useState } from "react";

import { formatLiveClockLabel } from "./match-display";

export function useLiveElapsedClock(
  baseElapsedSeconds: number | undefined,
  isLive: boolean
): string | undefined {
  const [elapsedSeconds, setElapsedSeconds] = useState(baseElapsedSeconds);

  useEffect(() => {
    setElapsedSeconds(baseElapsedSeconds);
  }, [baseElapsedSeconds]);

  useEffect(() => {
    if (!isLive || baseElapsedSeconds === undefined) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setElapsedSeconds((current) => (current ?? baseElapsedSeconds) + 1);
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [baseElapsedSeconds, isLive]);

  if (!isLive || elapsedSeconds === undefined) {
    return undefined;
  }

  return formatLiveClockLabel(elapsedSeconds);
}
