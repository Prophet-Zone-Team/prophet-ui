"use client";

import { useQuery } from "@tanstack/react-query";

import {
  ANALYTICS_NEWS_PAGE_SIZE,
  ANALYTICS_QUERY_STALE_TIME_MS
} from "@/lib/analytics/config";
import { mapNewsArticleToAllListItem } from "@/lib/analytics/map-news";
import { analyticsQueryKeys } from "@/lib/analytics/query-keys";
import { getAnalyticsNews } from "@/service/prophet";

import { useAnalyticsTeamPowerRankings } from "./use-analytics-team-power-rankings";

export function useAnalyticsNewsPage(
  page: number,
  pageSize: number = ANALYTICS_NEWS_PAGE_SIZE,
  category = "",
  teams = ""
) {
  const { teamCodeLookup } = useAnalyticsTeamPowerRankings();

  const query = useQuery({
    queryKey: analyticsQueryKeys.newsPage(page, pageSize, category, teams),
    queryFn: () =>
      getAnalyticsNews({
        page,
        page_size: pageSize,
        category,
        teams
      }),
    staleTime: ANALYTICS_QUERY_STALE_TIME_MS
  });

  const items = (query.data?.list ?? []).map((article) =>
    mapNewsArticleToAllListItem(article, teamCodeLookup)
  );

  return {
    items,
    rawArticles: query.data?.list ?? [],
    total: query.data?.total ?? 0,
    page,
    pageSize,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error
  };
}
