"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { ANALYTICS_QUERY_STALE_TIME_MS } from "@/lib/analytics/config";
import {
  filterCopyTradeRankTraders,
  sortCopyTradeRankTraders,
  type CopyTradeRankFilters
} from "@/lib/copy-trade/trader-rank-filters";
import { listCopyTraders } from "@/service/copy-trade";
import type { TraderCatalogEntry } from "@/types/copy-trade-api";

const copyTradeRankQueryKey = ["copy-trade", "traders"] as const;

export { copyTradeRankQueryKey };

export interface UseCopyTradeRankOptions {
  enabled?: boolean;
  filters?: CopyTradeRankFilters;
}

export function useCopyTradeRank(options?: UseCopyTradeRankOptions) {
  const filters = options?.filters;

  const query = useQuery({
    queryKey: copyTradeRankQueryKey,
    queryFn: async (): Promise<TraderCatalogEntry[]> => {
      const response = await listCopyTraders();
      return response.items ?? [];
    },
    enabled: options?.enabled ?? true,
    staleTime: ANALYTICS_QUERY_STALE_TIME_MS,
  });

  const traders = useMemo(() => {
    const items = query.data ?? [];
    const filtered = filters
      ? filterCopyTradeRankTraders(items, filters)
      : items;

    return sortCopyTradeRankTraders(filtered);
  }, [filters, query.data]);

  return {
    traders,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
