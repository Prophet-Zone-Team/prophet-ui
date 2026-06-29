"use client";

import { useQuery } from "@tanstack/react-query";

import { ANALYTICS_QUERY_STALE_TIME_MS } from "@/lib/analytics/config";
import { getCopyTradeProfile } from "@/service/copy-trade";
import type { CopyProfile } from "@/types/copy-trade-api";

import { useCopyTradeSession } from "./use-copy-trade-session";

function copyTradeProfileQueryKey(userId: number) {
  return ["copy-trade", "profile", userId] as const;
}

export interface UseCopyTradeProfileOptions {
  enabled?: boolean;
}

export function useCopyTradeProfile(options?: UseCopyTradeProfileOptions) {
  const { hydrated, userId } = useCopyTradeSession();
  const canFetch = Boolean(hydrated && userId);
  const enabled = (options?.enabled ?? true) && canFetch;

  const query = useQuery({
    queryKey: userId
      ? copyTradeProfileQueryKey(userId)
      : ["copy-trade", "profile", "anonymous"],
    queryFn: async (): Promise<CopyProfile> => {
      if (!userId) {
        throw new Error("Copy-trade session is required.");
      }

      return getCopyTradeProfile(userId);
    },
    enabled,
    staleTime: ANALYTICS_QUERY_STALE_TIME_MS
  });

  return {
    profile: query.data ?? null,
    isLoading: enabled && query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    hasSession: canFetch,
    hydrated
  };
}

export { copyTradeProfileQueryKey };
