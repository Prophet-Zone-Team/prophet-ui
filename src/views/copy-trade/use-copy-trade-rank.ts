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

export const COPY_TRADE_TRADERS_QUERY_KEY = ["copy-trade", "traders"] as const;

export async function fetchCopyTradeTraders(): Promise<TraderCatalogEntry[]> {
  const response = await listCopyTraders();
  return response.items ?? [];
}

export interface UseCopyTradeRankOptions {
  enabled?: boolean;
  filters?: CopyTradeRankFilters;
}

export function useCopyTradeRank(options?: UseCopyTradeRankOptions) {
  const filters = options?.filters;

  const query = useQuery({
    queryKey: COPY_TRADE_TRADERS_QUERY_KEY,
    queryFn: fetchCopyTradeTraders,
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
