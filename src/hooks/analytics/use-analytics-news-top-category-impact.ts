"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { ANALYTICS_QUERY_STALE_TIME_MS } from "@/lib/analytics/config";
import {
  mapTopCategoryImpactToCategories,
  mapTopCategoryImpactToOverview,
  mapTopCategoryImpactToSummary
} from "@/lib/analytics/map-top-category-impact";
import { analyticsQueryKeys } from "@/lib/analytics/query-keys";
import { getAnalyticsNewsTopCategoryImpact } from "@/service/prophet";

export function useAnalyticsNewsTopCategoryImpact() {
  const query = useQuery({
    queryKey: analyticsQueryKeys.newsTopCategoryImpact,
    queryFn: () => getAnalyticsNewsTopCategoryImpact(),
    staleTime: ANALYTICS_QUERY_STALE_TIME_MS
  });

  const summary = useMemo(
    () => mapTopCategoryImpactToSummary(query.data?.impact),
    [query.data?.impact]
  );
  const topCategories = useMemo(
    () => mapTopCategoryImpactToCategories(query.data?.top_categories),
    [query.data?.top_categories]
  );
  const impactOverview = useMemo(
    () => mapTopCategoryImpactToOverview(query.data?.impact),
    [query.data?.impact]
  );

  return {
    summary,
    topCategories,
    impactOverview,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error
  };
}
