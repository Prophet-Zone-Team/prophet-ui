"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import {
  parsePolymarketStatsTopMove,
  parsePolymarketStatsVolume,
} from "@/lib/market/map-polymarket-stats";
import { marketQueryKeys } from "@/lib/market/query-keys";
import { getProphetPolymarketStats } from "@/service/prophet";

const POLYMARKET_STATS_POLL_INTERVAL_MS = 30_000;

export function usePolymarketStats() {
  const query = useQuery({
    queryKey: marketQueryKeys.polymarketStats(),
    queryFn: ({ signal }) => getProphetPolymarketStats(signal),
    staleTime: POLYMARKET_STATS_POLL_INTERVAL_MS,
    refetchInterval: POLYMARKET_STATS_POLL_INTERVAL_MS,
  });

  const volume = useMemo(
    () => parsePolymarketStatsVolume(query.data),
    [query.data],
  );

  const topMove = useMemo(
    () => parsePolymarketStatsTopMove(query.data),
    [query.data],
  );

  return {
    volume,
    topMove,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
  };
}
