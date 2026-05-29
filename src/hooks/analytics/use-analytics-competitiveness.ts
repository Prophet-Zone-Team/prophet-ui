"use client";

import { useQuery } from "@tanstack/react-query";

import { ANALYTICS_QUERY_STALE_TIME_MS } from "@/lib/analytics/config";
import { mapCompetitivenessResponse } from "@/lib/analytics/map-competitiveness";
import { analyticsQueryKeys } from "@/lib/analytics/query-keys";
import { getAnalyticsCompetitiveness } from "@/service/prophet";

export function useAnalyticsCompetitiveness() {
  const query = useQuery({
    queryKey: analyticsQueryKeys.competitiveness,
    queryFn: getAnalyticsCompetitiveness,
    staleTime: ANALYTICS_QUERY_STALE_TIME_MS
  });

  return {
    data: mapCompetitivenessResponse(query.data),
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error
  };
}
