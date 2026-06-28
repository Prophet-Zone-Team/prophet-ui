"use client";

import { useQuery } from "@tanstack/react-query";

import { roadToFinalQueryKeys } from "@/lib/road-to-final/query-keys";
import {
  getWinnerActivityRecords,
  isProphetAuthenticated
} from "@/service/prophet";

const WINNER_ACTIVITY_STALE_TIME_MS = 30_000;

export function useWinnerRecords() {
  const query = useQuery({
    queryKey: roadToFinalQueryKeys.winnerRecords,
    queryFn: ({ signal }) => getWinnerActivityRecords(signal),
    enabled: isProphetAuthenticated(),
    staleTime: WINNER_ACTIVITY_STALE_TIME_MS
  });

  return {
    records: query.data?.list ?? [],
    count: query.data?.list.length ?? 0,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch
  };
}
