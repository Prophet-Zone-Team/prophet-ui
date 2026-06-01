"use client";

import { useQuery } from "@tanstack/react-query";

import { ANALYTICS_QUERY_STALE_TIME_MS } from "@/lib/analytics/config";
import { mapTeamPathContextResponse } from "@/lib/analytics/map-team-path-context";
import { analyticsQueryKeys } from "@/lib/analytics/query-keys";
import { getAnalyticsTeamPathContext } from "@/service/prophet";

export function useAnalyticsTeamPathContext() {
  const query = useQuery({
    queryKey: analyticsQueryKeys.teamPathContext,
    queryFn: getAnalyticsTeamPathContext,
    staleTime: ANALYTICS_QUERY_STALE_TIME_MS
  });

  const data = mapTeamPathContextResponse(query.data);

  return {
    entries: data.entries,
    snapshotsByTeamId: data.snapshotsByTeamId,
    teams: data.entries.map((entry) => entry.team),
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error
  };
}
