"use client";

import { useQuery } from "@tanstack/react-query";

import { ANALYTICS_QUERY_STALE_TIME_MS } from "@/lib/analytics/config";
import { mapRecommendsResponse } from "@/lib/analytics/map-recommends";
import { analyticsQueryKeys } from "@/lib/analytics/query-keys";
import { getAnalyticsRecommends } from "@/service/prophet";

export function useAnalyticsRecommends() {
  const query = useQuery({
    queryKey: analyticsQueryKeys.recommends,
    queryFn: getAnalyticsRecommends,
    staleTime: ANALYTICS_QUERY_STALE_TIME_MS
  });

  return {
    cards: mapRecommendsResponse(query.data),
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error
  };
}
