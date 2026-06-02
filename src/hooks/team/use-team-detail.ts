"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { ANALYTICS_QUERY_STALE_TIME_MS } from "@/lib/analytics/config";
import { analyticsQueryKeys } from "@/lib/analytics/query-keys";
import { mapTeamDetailResponse } from "@/lib/team/map-team-detail";
import { getAnalyticsTeamDetail } from "@/service/prophet";

export function useTeamDetail(teamName: string) {
  const query = useQuery({
    queryKey: analyticsQueryKeys.teamDetail(teamName),
    queryFn: () => getAnalyticsTeamDetail({ team_name: teamName }),
    enabled: Boolean(teamName),
    staleTime: ANALYTICS_QUERY_STALE_TIME_MS
  });

  const data = useMemo(
    () =>
      query.data
        ? mapTeamDetailResponse(query.data)
        : undefined,
    [query.data]
  );

  return {
    data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch
  };
}
