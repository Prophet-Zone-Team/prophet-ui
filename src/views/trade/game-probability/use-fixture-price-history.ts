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
  enabled?: boolean;
  pollIntervalMs?: number;
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
  enabled = true,
  pollIntervalMs,
}: UseFixturePriceHistoryOptions): UseFixturePriceHistoryResult {
  const [points, setPoints] = useState<GameFixtureChartPoint[]>([]);
  const [binaryPoints, setBinaryPoints] = useState<GameFixtureBinaryChartPoint[]>([]);
  const [chartMode, setChartMode] = useState<"ternary" | "binary">("ternary");
  const [status, setStatus] = useState<FixturePriceHistoryStatus>("loading");
  const [lastUpdated, setLastUpdated] = useState<string | undefined>();
  const [error, setError] = useState<string | undefined>();

  const fetchHistory = useCallback(
    async (signal?: AbortSignal) => {
      if (!matchSlug || !enabled) {
        return false;
      }

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
        signal,
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
      setError(undefined);

      return true;
    },
    [chartKind, enabled, lineKey, matchSlug, timeRange],
  );

  const refetch = useCallback(async () => {
    if (!matchSlug || !enabled) {
      setPoints([]);
      setBinaryPoints([]);
      setStatus(enabled ? "empty" : "loading");
      setLastUpdated(undefined);
      setError(undefined);
      return;
    }

    setStatus("loading");
    setError(undefined);

    try {
      await fetchHistory();
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
  }, [enabled, fetchHistory, matchSlug]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    if (!matchSlug) {
      setPoints([]);
      setBinaryPoints([]);
      setStatus("empty");
      setLastUpdated(undefined);
      setError(undefined);
      return;
    }

    const controller = new AbortController();
    let timeoutId: number | undefined;
    let isInitialFetch = true;

    const poll = async () => {
      if (isInitialFetch) {
        setStatus("loading");
        setError(undefined);
      }

      try {
        const success = await fetchHistory(controller.signal);

        if (!success || controller.signal.aborted) {
          return;
        }

        isInitialFetch = false;

        if (pollIntervalMs === undefined) {
          return;
        }

        timeoutId = window.setTimeout(() => {
          void poll();
        }, pollIntervalMs);
      } catch {
        if (controller.signal.aborted) {
          return;
        }

        if (isInitialFetch) {
          setPoints([]);
          setBinaryPoints([]);
          setStatus("error");
          setError("Unable to load fixture price history.");
        }

        isInitialFetch = false;
      }
    };

    void poll();

    return () => {
      controller.abort();
      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [enabled, fetchHistory, matchSlug, pollIntervalMs]);

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
