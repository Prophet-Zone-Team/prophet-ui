"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { roadToFinalQueryKeys } from "@/lib/road-to-final/query-keys";
import { resolveTradePromptAmount } from "@/views/road-to-final/lib/winner-prediction";
import {
  getWinnerActivityStats,
  isProphetAuthenticated
} from "@/service/prophet";

const WINNER_ACTIVITY_STALE_TIME_MS = 30_000;

export function useWinnerStats() {
  const query = useQuery({
    queryKey: roadToFinalQueryKeys.winnerStats,
    queryFn: ({ signal }) => getWinnerActivityStats(signal),
    enabled: isProphetAuthenticated(),
    staleTime: WINNER_ACTIVITY_STALE_TIME_MS
  });

  const tradePromptAmount = useMemo(() => {
    if (!query.data) {
      return null;
    }

    return resolveTradePromptAmount(
      Number(query.data.total_trade_usdc) || 0,
      query.data.available_chances
    );
  }, [query.data]);

  return {
    stats: query.data,
    availableChances: query.data?.available_chances ?? 0,
    tradePromptAmount,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch
  };
}
