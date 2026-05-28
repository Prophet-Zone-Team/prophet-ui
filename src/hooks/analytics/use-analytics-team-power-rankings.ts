"use client";

import { useQuery } from "@tanstack/react-query";

import { ANALYTICS_QUERY_STALE_TIME_MS } from "@/lib/analytics/config";
import {
  buildTeamCodeLookup,
  mapTeamPowerRankingResponse
} from "@/lib/analytics/map-team-power-ranking";
import { analyticsQueryKeys } from "@/lib/analytics/query-keys";
import { getAnalyticsTeamPowerRankings } from "@/service/prophet";

export function useAnalyticsTeamPowerRankings() {
  const query = useQuery({
    queryKey: analyticsQueryKeys.rankings,
    queryFn: getAnalyticsTeamPowerRankings,
    staleTime: ANALYTICS_QUERY_STALE_TIME_MS
  });

  const entries = mapTeamPowerRankingResponse(query.data);
  const teamCodeLookup = buildTeamCodeLookup(query.data);

  return {
    entries,
    teamCodeLookup,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error
  };
}
