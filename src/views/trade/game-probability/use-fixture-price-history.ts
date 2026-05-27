"use client";

import { useCallback, useEffect, useState } from "react";

import type {
  FixtureChartKind,
  GameFixtureBinaryChartPoint,
  GameFixtureChartPoint,
  GameFixtureChartTimeRange,
} from "@/types/market";

export type FixturePriceHistoryStatus = "loading" | "ready" | "empty" | "error";

interface FixturePriceHistoryResponse {
  matchSlug: string;
  interval: string;
  chartKind: FixtureChartKind;
  lineKey?: string;
  chartMode: "ternary" | "binary";
  points: GameFixtureChartPoint[];
  binaryPoints: GameFixtureBinaryChartPoint[];
  updatedAt: string;
  volume?: number;
}

export interface UseFixturePriceHistoryOptions {
  matchSlug: string | undefined;
  timeRange: GameFixtureChartTimeRange;
  chartKind?: FixtureChartKind;
  lineKey?: string;
}

export interface UseFixturePriceHistoryResult {
  points: GameFixtureChartPoint[];
  binaryPoints: GameFixtureBinaryChartPoint[];
  chartMode: "ternary" | "binary";
  status: FixturePriceHistoryStatus;
  lastUpdated?: string;
  error?: string;
  refetch: () => Promise<void>;
}

export function useFixturePriceHistory({
  matchSlug,
  timeRange,
  chartKind = "moneyline",
  lineKey,
}: UseFixturePriceHistoryOptions): UseFixturePriceHistoryResult {
  const [points, setPoints] = useState<GameFixtureChartPoint[]>([]);
  const [binaryPoints, setBinaryPoints] = useState<GameFixtureBinaryChartPoint[]>([]);
  const [chartMode, setChartMode] = useState<"ternary" | "binary">("ternary");
  const [status, setStatus] = useState<FixturePriceHistoryStatus>("loading");
  const [lastUpdated, setLastUpdated] = useState<string | undefined>();
  const [error, setError] = useState<string | undefined>();

  const refetch = useCallback(async () => {
    if (!matchSlug) {
      setPoints([]);
      setBinaryPoints([]);
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
        chartKind,
      });

      if (lineKey) {
        params.set("lineKey", lineKey);
      }

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
      const nextBinaryPoints = payload.binaryPoints ?? [];
      const nextChartMode = payload.chartMode ?? "ternary";
      const hasData =
        nextChartMode === "binary" ? nextBinaryPoints.length > 0 : nextPoints.length > 0;

      setPoints(nextPoints);
      setBinaryPoints(nextBinaryPoints);
      setChartMode(nextChartMode);
      setLastUpdated(payload.updatedAt);
      setStatus(hasData ? "ready" : "empty");
    } catch (fetchError) {
      setPoints([]);
      setBinaryPoints([]);
      setStatus("error");
      setError(
        fetchError instanceof Error
          ? fetchError.message
          : "Unable to load fixture price history.",
      );
    }
  }, [chartKind, lineKey, matchSlug, timeRange]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return {
    points,
    binaryPoints,
    chartMode,
    status,
    lastUpdated,
    error,
    refetch,
  };
}
