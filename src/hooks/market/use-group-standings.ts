"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { ANALYTICS_QUERY_STALE_TIME_MS } from "@/lib/analytics/config";
import { mapGroupStandingsResponse } from "@/lib/market/map-group-standings";
import { marketQueryKeys } from "@/lib/market/query-keys";
import { getProphetGroupStandings } from "@/service/prophet";

export function useGroupStandings(params?: { groupCode?: string }) {
  const groupCode = params?.groupCode ?? "";

  const query = useQuery({
    queryKey: marketQueryKeys.groupStandings(groupCode),
    queryFn: ({ signal }) =>
      getProphetGroupStandings({
        group_code: groupCode || undefined,
        signal,
      }),
    staleTime: ANALYTICS_QUERY_STALE_TIME_MS,
  });

  const groups = useMemo(
    () =>
      query.data ? mapGroupStandingsResponse(query.data) : [],
    [query.data],
  );

  return {
    groups,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
