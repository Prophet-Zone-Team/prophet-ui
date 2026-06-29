"use client";

import { useQuery } from "@tanstack/react-query";

import { ANALYTICS_QUERY_STALE_TIME_MS } from "@/lib/analytics/config";
import { getCopyTradeTargets } from "@/service/copy-trade";
import type { CopyTarget } from "@/types/copy-trade-api";

import { useCopyTradeSession } from "./use-copy-trade-session";

function copyTradeTargetsQueryKey(userId: number) {
  return ["copy-trade", "targets", userId] as const;
}

export interface UseCopyTradeTargetsOptions {
  enabled?: boolean;
}

export function useCopyTradeTargets(options?: UseCopyTradeTargetsOptions) {
  const { hydrated, userId } = useCopyTradeSession();
  const canFetch = Boolean(hydrated && userId);
  const enabled = (options?.enabled ?? true) && canFetch;

  const query = useQuery({
    queryKey: userId
      ? copyTradeTargetsQueryKey(userId)
      : ["copy-trade", "targets", "anonymous"],
    queryFn: async (): Promise<CopyTarget[]> => {
      if (!userId) {
        throw new Error("Copy-trade session is required.");
      }

      return getCopyTradeTargets(userId);
    },
    enabled,
    staleTime: ANALYTICS_QUERY_STALE_TIME_MS,
  });

  return {
    targets: query.data ?? [],
    isLoading: enabled && query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    hasSession: canFetch,
    hydrated,
  };
}
