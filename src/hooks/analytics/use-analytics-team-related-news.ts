"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { ANALYTICS_QUERY_STALE_TIME_MS } from "@/lib/analytics/config";
import { mapTeamRelatedNewsArticles } from "@/lib/analytics/map-trade-game-related-news";
import { analyticsQueryKeys } from "@/lib/analytics/query-keys";
import { getAnalyticsTeamRelatedNews } from "@/service/prophet";

import { useAnalyticsTeamPowerRankings } from "./use-analytics-team-power-rankings";

const INVALID_TEAM_NAME = "TBD";

function buildTeamsQueryKey(homeTeamName: string, awayTeamName: string): string {
  return [homeTeamName, awayTeamName]
    .filter((name) => name && name !== INVALID_TEAM_NAME)
    .join(",");
}

export function useAnalyticsTeamRelatedNews(params: {
  homeTeamName: string;
  awayTeamName: string;
}) {
  const { teamCodeLookup } = useAnalyticsTeamPowerRankings();
  const teamsKey = buildTeamsQueryKey(params.homeTeamName, params.awayTeamName);

  const query = useQuery({
    queryKey: analyticsQueryKeys.teamRelatedNews(teamsKey),
    queryFn: () => getAnalyticsTeamRelatedNews({ teams: teamsKey }),
    enabled: teamsKey.length > 0,
    staleTime: ANALYTICS_QUERY_STALE_TIME_MS
  });

  const items = useMemo(
    () => mapTeamRelatedNewsArticles(query.data?.list, teamCodeLookup, { homeTeamName: params.homeTeamName, awayTeamName: params.awayTeamName }),
    [query.data?.list, teamCodeLookup]
  );

  return {
    items,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error
  };
}
