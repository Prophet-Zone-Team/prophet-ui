"use client";

import { useQuery } from "@tanstack/react-query";

import { ANALYTICS_QUERY_STALE_TIME_MS } from "@/lib/analytics/config";
import { mapNewsArticlesToImpactItems } from "@/lib/analytics/map-news";
import { analyticsQueryKeys } from "@/lib/analytics/query-keys";
import { getAnalyticsLatestNews } from "@/service/prophet";

import { useAnalyticsTeamPowerRankings } from "./use-analytics-team-power-rankings";

export function useAnalyticsLatestNews(category = "") {
  const { teamCodeLookup } = useAnalyticsTeamPowerRankings();

  const query = useQuery({
    queryKey: analyticsQueryKeys.latestNews(category),
    queryFn: () => getAnalyticsLatestNews({ category }),
    staleTime: ANALYTICS_QUERY_STALE_TIME_MS
  });

  const items = mapNewsArticlesToImpactItems(
    query.data?.list,
    teamCodeLookup
  );

  return {
    items,
    rawArticles: query.data?.list ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error
  };
}
