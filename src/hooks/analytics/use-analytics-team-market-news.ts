"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { ANALYTICS_QUERY_STALE_TIME_MS } from "@/lib/analytics/config";
import {
  mapTeamMarketNewsToImpactItems,
  mapTeamMarketNewsToIntelligence
} from "@/lib/analytics/map-team-market-news";
import { analyticsQueryKeys } from "@/lib/analytics/query-keys";
import { getAnalyticsTeamMarketNews } from "@/service/prophet";

export function useAnalyticsTeamMarketNews(teamName: string) {
  const query = useQuery({
    queryKey: analyticsQueryKeys.teamMarketNews(teamName),
    queryFn: () => getAnalyticsTeamMarketNews({ team_name: teamName }),
    enabled: Boolean(teamName),
    staleTime: ANALYTICS_QUERY_STALE_TIME_MS
  });

  const intelligence = useMemo(
    () => mapTeamMarketNewsToIntelligence(query.data?.market),
    [query.data?.market]
  );
  const newsItems = useMemo(
    () => mapTeamMarketNewsToImpactItems(query.data?.news, teamName),
    [query.data?.news, teamName]
  );

  return {
    intelligence,
    newsItems,
    totalNews: query.data?.total_news ?? 0,
    hasMarket: Boolean(query.data?.market?.slug),
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch
  };
}
