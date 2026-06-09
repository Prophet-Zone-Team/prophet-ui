"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { ANALYTICS_QUERY_STALE_TIME_MS } from "@/lib/analytics/config";
import { buildMatchHistoryEntries } from "@/lib/analytics/map-head-to-head-fixtures";
import { analyticsQueryKeys } from "@/lib/analytics/query-keys";
import { getAnalyticsHeadToHeadFixtures } from "@/service/prophet";

import { useAnalyticsTeamPowerRankings } from "./use-analytics-team-power-rankings";

const INVALID_TEAM_NAME = "TBD";

function isValidTeamName(name: string): boolean {
  return Boolean(name) && name !== INVALID_TEAM_NAME;
}

export function useAnalyticsHeadToHeadFixtures(params: {
  teamA: string;
  teamB: string;
}) {
  const { teamCodeLookup } = useAnalyticsTeamPowerRankings();
  const enabled =
    isValidTeamName(params.teamA) && isValidTeamName(params.teamB);

  const query = useQuery({
    queryKey: analyticsQueryKeys.headToHead(params.teamA, params.teamB),
    queryFn: () =>
      getAnalyticsHeadToHeadFixtures({
        team_a: params.teamA,
        team_b: params.teamB
      }),
    enabled,
    staleTime: ANALYTICS_QUERY_STALE_TIME_MS
  });

  const matches = useMemo(
    () => buildMatchHistoryEntries(query.data?.list, teamCodeLookup),
    [query.data?.list, teamCodeLookup]
  );

  return {
    matches,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error
  };
}
