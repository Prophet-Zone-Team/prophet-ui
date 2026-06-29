"use client";

import { useQuery } from "@tanstack/react-query";

import { ANALYTICS_QUERY_STALE_TIME_MS } from "@/lib/analytics/config";
import { listCopyTraderTracksLatest } from "@/service/copy-trade";
import type {
  CopyTraderTrackLatestError,
  CopyTraderTrackLatestItem,
} from "@/types/copy-trade-api";

import { useCopyTradeSession } from "./use-copy-trade-session";

function copyTradeTracksLatestQueryKey(userId: number, limit?: number) {
  return ["copy-trade", "tracks-latest", userId, limit ?? "default"] as const;
}

export interface UseCopyTradeTracksLatestOptions {
  enabled?: boolean;
  limit?: number;
}

export function useCopyTradeTracksLatest(
  options?: UseCopyTradeTracksLatestOptions
) {
  const { hydrated, userId } = useCopyTradeSession();
  const limit = options?.limit;
  const canFetch = Boolean(hydrated && userId);
  const enabled = (options?.enabled ?? true) && canFetch;

  const query = useQuery({
    queryKey: userId
      ? copyTradeTracksLatestQueryKey(userId, limit)
      : ["copy-trade", "tracks-latest", "anonymous"],
    queryFn: async (): Promise<{
      items: CopyTraderTrackLatestItem[];
      errors: CopyTraderTrackLatestError[];
    }> => {
      if (!userId) {
        throw new Error("Copy-trade session is required.");
      }

      const response = await listCopyTraderTracksLatest(limit);
      return {
        items: response.items ?? [],
        errors: response.errors ?? [],
      };
    },
    enabled,
    staleTime: ANALYTICS_QUERY_STALE_TIME_MS,
  });

  return {
    items: query.data?.items ?? [],
    errors: query.data?.errors ?? [],
    isLoading: enabled && query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    hasSession: canFetch,
    hydrated,
  };
}
