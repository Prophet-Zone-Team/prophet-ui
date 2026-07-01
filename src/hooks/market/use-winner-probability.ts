"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { ANALYTICS_QUERY_STALE_TIME_MS } from "@/lib/analytics/config";
import { mapWinnerProbabilityByTeamId } from "@/lib/market/map-winner-probability";
import { marketQueryKeys } from "@/lib/market/query-keys";
import { getProphetWinnerProbability } from "@/service/prophet";

export function useWinnerProbability() {
  const query = useQuery({
    queryKey: marketQueryKeys.winnerProbability(),
    queryFn: ({ signal }) => getProphetWinnerProbability(signal),
    staleTime: ANALYTICS_QUERY_STALE_TIME_MS,
  });

  const probabilityByTeamId = useMemo(
    () => mapWinnerProbabilityByTeamId(query.data),
    [query.data],
  );

  return {
    probabilityByTeamId,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
