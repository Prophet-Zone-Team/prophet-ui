"use client";

import { useCallback, useEffect, useState } from "react";

import type { GameFixtureChartPoint, GameFixtureChartTimeRange } from "@/types/market";

export type FixturePriceHistoryStatus = "loading" | "ready" | "empty" | "error";

interface FixturePriceHistoryResponse {
  matchSlug: string;
  interval: string;
  points: GameFixtureChartPoint[];
  updatedAt: string;
  volume?: number;
}

export interface UseFixturePriceHistoryResult {
  points: GameFixtureChartPoint[];
  status: FixturePriceHistoryStatus;
  lastUpdated?: string;
  error?: string;
  refetch: () => Promise<void>;
}

export function useFixturePriceHistory(
  matchSlug: string | undefined,
  timeRange: GameFixtureChartTimeRange,
): UseFixturePriceHistoryResult {
  const [points, setPoints] = useState<GameFixtureChartPoint[]>([]);
  const [status, setStatus] = useState<FixturePriceHistoryStatus>("loading");
  const [lastUpdated, setLastUpdated] = useState<string | undefined>();
  const [error, setError] = useState<string | undefined>();

  const refetch = useCallback(async () => {
    if (!matchSlug) {
      setPoints([]);
      setStatus("empty");
      setLastUpdated(undefined);
      setError(undefined);
      return;
    }

    setStatus("loading");
    setError(undefined);

    try {
      const params = new URLSearchParams({
        matchSlug,
        range: timeRange,
      });
      const response = await fetch(`/api/market/fixture-history?${params}`, {
        cache: "no-store",
      });
      const payload = (await response.json()) as FixturePriceHistoryResponse & {
        error?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to load fixture price history.");
      }

      const nextPoints = payload.points ?? [];

      setPoints(nextPoints);
      setLastUpdated(payload.updatedAt);
      setStatus(nextPoints.length > 0 ? "ready" : "empty");
    } catch (fetchError) {
      setPoints([]);
      setStatus("error");
      setError(
        fetchError instanceof Error
          ? fetchError.message
          : "Unable to load fixture price history.",
      );
    }
  }, [matchSlug, timeRange]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return {
    points,
    status,
    lastUpdated,
    error,
    refetch,
  };
}
